# n8n-nodes-megaconvert

[![npm version](https://img.shields.io/npm/v/n8n-nodes-megaconvert.svg)](https://www.npmjs.com/package/n8n-nodes-megaconvert)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[n8n](https://n8n.io) community node for [MegaConvert](https://megaconvert.io) — convert files between 500+ formats in your n8n workflows.

## Install

In your n8n instance:
1. Go to **Settings** → **Community Nodes**
2. Enter `n8n-nodes-megaconvert`
3. Click **Install**

Or via CLI:
```bash
npm install n8n-nodes-megaconvert
```

## Operations

### File
- **Convert** — Convert a file to another format (sync, returns converted file)
- **Convert Async** — Start an async conversion (returns job ID for polling)

### Tool
- **Execute Tool** — Run a tool on a file:
  - Compress (images, PDFs, videos)
  - Resize / Crop images
  - Rotate PDFs
  - Merge / Split PDFs
  - Trim video
  - Extract audio from video
  - Video to GIF
  - Add watermark
  - Generate QR code

### Job
- **Get Status** — Check async job status
- **Download** — Download completed job result

### Info
- **Get Formats** — List all 500+ supported conversion formats
- **Get Tools** — List available tools
- **Get Usage** — Check your API quota

## Credentials

You need a MegaConvert API key:
1. Register at [megaconvert.io/register](https://megaconvert.io/register)
2. Go to Dashboard → API Keys
3. Create a key and add it to n8n credentials

Free tier: 10 conversions/day, 25MB max.

## Example Workflow

1. **Trigger** (e.g. new file in Google Drive)
2. **Google Drive** → Download file
3. **MegaConvert** → Convert (output_format: pdf)
4. **Google Drive** → Upload converted file

## Links

- [API Documentation](https://megaconvert.io/docs/api)
- [MegaConvert](https://megaconvert.io)
- [GitHub](https://github.com/rpnet/megaconvert-api)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)

## License

MIT
