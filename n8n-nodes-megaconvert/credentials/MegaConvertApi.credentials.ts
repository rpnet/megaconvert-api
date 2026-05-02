import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class MegaConvertApi implements ICredentialType {
	name = 'megaConvertApi';
	displayName = 'MegaConvert API';
	documentationUrl = 'https://megaconvert.io/docs/api';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			placeholder: 'mc_your_api_key',
			description: 'Your MegaConvert API key. Get one at https://megaconvert.io/register',
		},
	];
}
