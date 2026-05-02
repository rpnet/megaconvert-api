import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class MegaConvert implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MegaConvert',
		name: 'megaConvert',
		icon: 'file:megaconvert.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + ($parameter["resource"] || "file")}}',
		description: 'Convert files between 500+ formats using the MegaConvert API',
		defaults: {
			name: 'MegaConvert',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'megaConvertApi',
				required: true,
			},
		],
		properties: [
			// Resource
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'File', value: 'file' },
					{ name: 'Tool', value: 'tool' },
					{ name: 'Job', value: 'job' },
					{ name: 'Info', value: 'info' },
				],
				default: 'file',
			},

			// ── File operations ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['file'] } },
				options: [
					{ name: 'Convert', value: 'convert', description: 'Convert a file to another format', action: 'Convert a file' },
					{ name: 'Convert Async', value: 'convertAsync', description: 'Start async conversion (returns job ID)', action: 'Start async conversion' },
				],
				default: 'convert',
			},
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['file'] } },
				default: 'pdf',
				placeholder: 'pdf, png, mp3, mp4, docx...',
				description: 'Target format for the conversion',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryProperty',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: { show: { resource: ['file', 'tool'] } },
				description: 'Name of the binary property containing the input file',
			},

			// ── Tool operations ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['tool'] } },
				options: [
					{ name: 'Execute Tool', value: 'execute', description: 'Run a tool on a file', action: 'Execute a tool' },
				],
				default: 'execute',
			},
			{
				displayName: 'Tool',
				name: 'toolName',
				type: 'options',
				displayOptions: { show: { resource: ['tool'] } },
				options: [
					{ name: 'Compress', value: 'compress' },
					{ name: 'Crop', value: 'crop' },
					{ name: 'Extract Audio', value: 'extract-audio' },
					{ name: 'GIF', value: 'gif' },
					{ name: 'Merge PDF', value: 'merge' },
					{ name: 'QR Code', value: 'qr-code' },
					{ name: 'Resize', value: 'resize' },
					{ name: 'Rotate', value: 'rotate' },
					{ name: 'Split PDF', value: 'split' },
					{ name: 'Trim', value: 'trim' },
					{ name: 'Watermark', value: 'watermark' },
				],
				default: 'compress',
				description: 'Tool to run on the file',
			},
			{
				displayName: 'Tool Options',
				name: 'toolOptions',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: { show: { resource: ['tool'] } },
				default: {},
				options: [
					{
						name: 'option',
						displayName: 'Option',
						values: [
							{
								displayName: 'Key',
								name: 'key',
								type: 'string',
								default: '',
								placeholder: 'quality, width, angle...',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},

			// ── Job operations ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['job'] } },
				options: [
					{ name: 'Get Status', value: 'status', description: 'Check job status', action: 'Get job status' },
					{ name: 'Download', value: 'download', description: 'Download completed job result', action: 'Download job result' },
				],
				default: 'status',
			},
			{
				displayName: 'Job ID',
				name: 'jobId',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['job'] } },
				default: '',
				description: 'The job ID from an async conversion',
			},

			// ── Info operations ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['info'] } },
				options: [
					{ name: 'Get Formats', value: 'formats', description: 'List supported formats', action: 'Get supported formats' },
					{ name: 'Get Tools', value: 'tools', description: 'List available tools', action: 'Get available tools' },
					{ name: 'Get Usage', value: 'usage', description: 'Check API usage quota', action: 'Get API usage' },
				],
				default: 'formats',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const credentials = await this.getCredentials('megaConvertApi');
		const apiKey = credentials.apiKey as string;
		const baseUrl = 'https://megaconvert.io/api/v1';

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'file') {
					const outputFormat = this.getNodeParameter('outputFormat', i) as string;
					const binaryProperty = this.getNodeParameter('binaryProperty', i) as string;
					const binaryData = this.helpers.assertBinaryData(i, binaryProperty);
					const buffer = await this.helpers.getBinaryDataBuffer(i, binaryProperty);
					const fileName = binaryData.fileName || `input.${binaryData.fileExtension || 'bin'}`;

					const endpoint = operation === 'convert' ? '/convert/sync' : '/convert';

					const response = await this.helpers.httpRequest({
						method: 'POST',
						url: `${baseUrl}${endpoint}`,
						headers: { 'X-API-Key': apiKey },
						body: {
							file: {
								value: buffer,
								options: { filename: fileName, contentType: binaryData.mimeType },
							},
							output_format: outputFormat,
						},
						encoding: operation === 'convert' ? 'arraybuffer' : undefined,
						json: operation !== 'convert',
					} as any);

					if (operation === 'convert') {
						const newBinary = await this.helpers.prepareBinaryData(
							Buffer.from(response as ArrayBuffer),
							`converted.${outputFormat}`,
						);
						returnData.push({
							json: { success: true, format: outputFormat },
							binary: { data: newBinary },
						});
					} else {
						returnData.push({ json: response as any });
					}

				} else if (resource === 'tool') {
					const toolName = this.getNodeParameter('toolName', i) as string;
					const binaryProperty = this.getNodeParameter('binaryProperty', i) as string;
					const toolOptions = this.getNodeParameter('toolOptions', i, {}) as any;
					const binaryData = this.helpers.assertBinaryData(i, binaryProperty);
					const buffer = await this.helpers.getBinaryDataBuffer(i, binaryProperty);
					const fileName = binaryData.fileName || `input.${binaryData.fileExtension || 'bin'}`;

					const formData: Record<string, any> = {
						file: {
							value: buffer,
							options: { filename: fileName, contentType: binaryData.mimeType },
						},
						tool: toolName,
					};

					if (toolOptions.option) {
						for (const opt of toolOptions.option) {
							formData[opt.key] = opt.value;
						}
					}

					const response = await this.helpers.httpRequest({
						method: 'POST',
						url: `${baseUrl}/tool`,
						headers: { 'X-API-Key': apiKey },
						body: formData,
						encoding: 'arraybuffer',
					} as any);

					const ext = binaryData.fileExtension || 'bin';
					const newBinary = await this.helpers.prepareBinaryData(
						Buffer.from(response as ArrayBuffer),
						`${toolName}_output.${ext}`,
					);
					returnData.push({
						json: { success: true, tool: toolName },
						binary: { data: newBinary },
					});

				} else if (resource === 'job') {
					const jobId = this.getNodeParameter('jobId', i) as string;

					if (operation === 'status') {
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/status/${jobId}`,
							headers: { 'X-API-Key': apiKey },
							json: true,
						});
						returnData.push({ json: response as any });

					} else if (operation === 'download') {
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/download/${jobId}`,
							headers: { 'X-API-Key': apiKey },
							encoding: 'arraybuffer',
						} as any);

						const newBinary = await this.helpers.prepareBinaryData(
							Buffer.from(response as ArrayBuffer),
							'download',
						);
						returnData.push({
							json: { success: true, jobId },
							binary: { data: newBinary },
						});
					}

				} else if (resource === 'info') {
					const needsAuth = operation === 'usage';
					const headers: Record<string, string> = {};
					if (needsAuth) headers['X-API-Key'] = apiKey;

					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/${operation}`,
						headers,
						json: true,
					});
					returnData.push({ json: response as any });
				}

			} catch (error: any) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error.message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
