# megaconvert

[![npm version](https://img.shields.io/npm/v/megaconvert.svg)](https://www.npmjs.com/package/megaconvert)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Official Node.js SDK for the [MegaConvert API](https://megaconvert.io/docs/api) — convert files between 500+ formats.

**Zero dependencies.** Uses native `fetch` (Node.js 18+).

## Install

```bash
npm install megaconvert
```

## Quick Start

```js
import MegaConvert from 'megaconvert';

const mc = new MegaConvert('mc_your_api_key');

// Convert a file
await mc.convert('document.docx', 'pdf');
// → saves document.pdf

// Convert with custom output path
await mc.convert('photo.heic', 'jpg', 'output/photo.jpg');

// Convert from buffer
const buffer = await mc.convertBuffer(fileBuffer, 'input.png', 'webp');
```

## API

### `new MegaConvert(apiKey, options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | `https://megaconvert.io/api/v1` | API base URL |
| `timeout` | `number` | `300000` | Request timeout in ms |

### Methods

#### `convert(filePath, outputFormat, outputPath?)`
Converts a file synchronously. Returns the output file path.

```js
const path = await mc.convert('video.mov', 'mp4');
```

#### `convertBuffer(buffer, filename, outputFormat)`
Converts a buffer. Returns the converted file as a `Buffer`.

```js
const result = await mc.convertBuffer(buf, 'image.png', 'webp');
```

#### `convertAsync(filePath, outputFormat)`
Starts an async conversion. Returns `{ jobId, statusUrl }`.

```js
const { jobId } = await mc.convertAsync('large-video.avi', 'mp4');
const result = await mc.waitForJob(jobId);
const file = await mc.download(jobId, 'output.mp4');
```

#### `tool(filePath, toolName, options?, outputPath?)`
Runs a tool (compress, resize, rotate, merge, split, crop, trim, extract-audio, gif, watermark, qr-code).

```js
await mc.tool('image.jpg', 'compress', { quality: 80 });
await mc.tool('image.png', 'resize', { width: 800, height: 600 });
await mc.tool('document.pdf', 'rotate', { angle: 90 });
```

#### `status(jobId)` / `download(jobId, outputPath?)`
Check status or download result of an async job.

#### `waitForJob(jobId, options?)`
Polls until job completes. Options: `{ interval: 2000, timeout: 300000 }`.

#### `formats()` / `tools()`
List supported formats or tools. No authentication required.

#### `usage()`
Check your API quota and usage.

```js
const info = await mc.usage();
// { plan: 'free', requests_today: 3, remaining: 7, ... }
```

## Error Handling

```js
import { MegaConvert, MegaConvertError } from 'megaconvert';

try {
  await mc.convert('file.xyz', 'abc');
} catch (err) {
  if (err instanceof MegaConvertError) {
    console.log(err.message); // "Conversion pair not supported"
    console.log(err.code);    // "unsupported"
    console.log(err.status);  // 400
  }
}
```

## Get an API Key

1. Register at [megaconvert.io/register](https://megaconvert.io/register)
2. Go to Dashboard → API Keys
3. Create a key — use it with this SDK

Free tier: 10 conversions/day, 25MB max file size.

## Links

- [API Documentation](https://megaconvert.io/docs/api)
- [Pricing](https://megaconvert.io/pricing)
- [GitHub](https://github.com/rpnet/megaconvert-api)

## License

MIT
