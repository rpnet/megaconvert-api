import { readFile, writeFile } from 'fs/promises';
import { basename, extname } from 'path';

const DEFAULT_BASE_URL = 'https://megaconvert.io/api/v1';
const DEFAULT_TIMEOUT = 300_000;

export class MegaConvertError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = 'MegaConvertError';
    this.code = code;
    this.status = status;
  }
}

export class MegaConvert {
  #apiKey;
  #baseUrl;
  #timeout;

  /**
   * @param {string} apiKey - Your MegaConvert API key (starts with mc_)
   * @param {object} [options]
   * @param {string} [options.baseUrl] - API base URL
   * @param {number} [options.timeout] - Request timeout in ms (default: 300000)
   */
  constructor(apiKey, options = {}) {
    if (!apiKey) throw new Error('API key is required. Get one at https://megaconvert.io/register');
    this.#apiKey = apiKey;
    this.#baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.#timeout = options.timeout || DEFAULT_TIMEOUT;
  }

  /**
   * Convert a file synchronously. Returns the output file path.
   * @param {string} filePath - Path to input file
   * @param {string} outputFormat - Target format (e.g. "pdf", "png", "mp3")
   * @param {string} [outputPath] - Output file path (auto-generated if omitted)
   * @returns {Promise<string>} Path to converted file
   */
  async convert(filePath, outputFormat, outputPath) {
    const buffer = await readFile(filePath);
    const filename = basename(filePath);
    const result = await this.convertBuffer(buffer, filename, outputFormat);

    if (!outputPath) {
      const base = filePath.replace(new RegExp(extname(filePath) + '$'), '');
      outputPath = `${base}.${outputFormat}`;
    }

    await writeFile(outputPath, result);
    return outputPath;
  }

  /**
   * Convert a buffer synchronously. Returns the converted file as a Buffer.
   * @param {Buffer|Uint8Array} buffer - Input file data
   * @param {string} filename - Original filename (used for format detection)
   * @param {string} outputFormat - Target format
   * @returns {Promise<Buffer>} Converted file data
   */
  async convertBuffer(buffer, filename, outputFormat) {
    const form = new FormData();
    form.append('file', new Blob([buffer]), filename);
    form.append('output_format', outputFormat);

    const resp = await this.#fetch('/convert/sync', { method: 'POST', body: form });

    if (resp.status === 200) {
      return Buffer.from(await resp.arrayBuffer());
    }

    if (resp.status === 202) {
      const data = await resp.json();
      return { jobId: data.job_id, statusUrl: data.status_url };
    }

    await this.#handleError(resp);
  }

  /**
   * Start an async conversion. Returns job info for polling.
   * @param {string} filePath - Path to input file
   * @param {string} outputFormat - Target format
   * @returns {Promise<{jobId: string, statusUrl: string}>}
   */
  async convertAsync(filePath, outputFormat) {
    const buffer = await readFile(filePath);
    const form = new FormData();
    form.append('file', new Blob([buffer]), basename(filePath));
    form.append('output_format', outputFormat);

    const resp = await this.#fetch('/convert', { method: 'POST', body: form });

    if (resp.ok) {
      const data = await resp.json();
      return { jobId: data.job_id, statusUrl: data.status_url };
    }

    await this.#handleError(resp);
  }

  /**
   * Run a tool on a file (compress, resize, merge, etc.)
   * @param {string} filePath - Path to input file
   * @param {string} toolName - Tool name (e.g. "compress", "resize", "rotate")
   * @param {object} [options] - Tool-specific options
   * @param {string} [outputPath] - Output file path
   * @returns {Promise<string>} Path to processed file
   */
  async tool(filePath, toolName, options = {}, outputPath) {
    const buffer = await readFile(filePath);
    const form = new FormData();
    form.append('file', new Blob([buffer]), basename(filePath));
    form.append('tool', toolName);
    for (const [key, value] of Object.entries(options)) {
      form.append(key, String(value));
    }

    const resp = await this.#fetch('/tool', { method: 'POST', body: form });

    if (resp.status === 200) {
      const result = Buffer.from(await resp.arrayBuffer());
      if (!outputPath) {
        outputPath = filePath.replace(extname(filePath), `_${toolName}${extname(filePath)}`);
      }
      await writeFile(outputPath, result);
      return outputPath;
    }

    if (resp.status === 202) {
      const data = await resp.json();
      return { jobId: data.job_id, statusUrl: data.status_url };
    }

    await this.#handleError(resp);
  }

  /**
   * Check the status of an async job.
   * @param {string} jobId
   * @returns {Promise<{status: string, download_url?: string}>}
   */
  async status(jobId) {
    const resp = await this.#fetch(`/status/${jobId}`);
    if (resp.ok) return resp.json();
    await this.#handleError(resp);
  }

  /**
   * Download the result of a completed async job.
   * @param {string} jobId
   * @param {string} [outputPath] - Path to save file
   * @returns {Promise<Buffer|string>} Buffer if no outputPath, path if outputPath given
   */
  async download(jobId, outputPath) {
    const resp = await this.#fetch(`/download/${jobId}`);
    if (!resp.ok) await this.#handleError(resp);

    const buf = Buffer.from(await resp.arrayBuffer());
    if (outputPath) {
      await writeFile(outputPath, buf);
      return outputPath;
    }
    return buf;
  }

  /**
   * List all supported conversion formats. No auth required.
   * @returns {Promise<object>}
   */
  async formats() {
    const resp = await this.#fetch('/formats', {}, false);
    if (resp.ok) return resp.json();
    await this.#handleError(resp);
  }

  /**
   * List all available tools. No auth required.
   * @returns {Promise<object>}
   */
  async tools() {
    const resp = await this.#fetch('/tools', {}, false);
    if (resp.ok) return resp.json();
    await this.#handleError(resp);
  }

  /**
   * Check your current API usage and quota.
   * @returns {Promise<{plan: string, requests_today: number, rate_limit: number, remaining: number}>}
   */
  async usage() {
    const resp = await this.#fetch('/usage');
    if (resp.ok) return resp.json();
    await this.#handleError(resp);
  }

  /**
   * Poll an async job until it completes or fails.
   * @param {string} jobId
   * @param {object} [options]
   * @param {number} [options.interval=2000] - Poll interval in ms
   * @param {number} [options.timeout=300000] - Max wait time in ms
   * @returns {Promise<{status: string, download_url: string}>}
   */
  async waitForJob(jobId, options = {}) {
    const interval = options.interval || 2000;
    const timeout = options.timeout || this.#timeout;
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const result = await this.status(jobId);
      if (result.status === 'completed') return result;
      if (result.status === 'failed') {
        throw new MegaConvertError('Job failed', 'job_failed', 422);
      }
      await new Promise(r => setTimeout(r, interval));
    }

    throw new MegaConvertError('Job timed out', 'timeout', 408);
  }

  async #fetch(path, options = {}, auth = true) {
    const headers = options.headers || {};
    if (auth) headers['X-API-Key'] = this.#apiKey;

    return fetch(`${this.#baseUrl}${path}`, {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.#timeout),
    });
  }

  async #handleError(resp) {
    let data;
    try {
      data = await resp.json();
    } catch {
      throw new MegaConvertError(`HTTP ${resp.status}`, 'unknown', resp.status);
    }
    throw new MegaConvertError(
      data.error || `HTTP ${resp.status}`,
      data.code || 'unknown',
      resp.status
    );
  }
}

export default MegaConvert;
