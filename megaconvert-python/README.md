# megaconvert

[![PyPI version](https://img.shields.io/pypi/v/megaconvert.svg)](https://pypi.org/project/megaconvert/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Official Python SDK for the [MegaConvert API](https://megaconvert.io/docs/api) — convert files between 500+ formats.

## Install

```bash
pip install megaconvert
```

## Quick Start

```python
from megaconvert import MegaConvert

mc = MegaConvert("mc_your_api_key")

# Convert a file
mc.convert("document.docx", "pdf")
# → saves document.pdf

# Convert with custom output path
mc.convert("photo.heic", "jpg", "output/photo.jpg")

# Convert in memory
pdf_bytes = mc.convert_bytes(docx_bytes, "input.docx", "pdf")
```

## API

### `MegaConvert(api_key, base_url=None, timeout=300)`

You can also set the `MEGACONVERT_API_KEY` environment variable instead of passing the key directly.

### Methods

#### `convert(file_path, output_format, output_path=None)`
Converts a file synchronously. Returns the output file path.

```python
path = mc.convert("video.mov", "mp4")
```

#### `convert_bytes(data, filename, output_format)`
Converts bytes in memory. Returns the converted file as `bytes`.

```python
result = mc.convert_bytes(png_data, "image.png", "webp")
```

#### `convert_async(file_path, output_format)`
Starts an async conversion. Returns `{"job_id": "...", "status_url": "..."}`.

```python
job = mc.convert_async("large-video.avi", "mp4")
result = mc.wait_for_job(job["job_id"])
mc.download(job["job_id"], "output.mp4")
```

#### `tool(file_path, tool_name, output_path=None, **options)`
Runs a tool: compress, resize, rotate, merge, split, crop, trim, extract-audio, gif, watermark, qr-code.

```python
mc.tool("image.jpg", "compress", quality=80)
mc.tool("image.png", "resize", width=800, height=600)
mc.tool("document.pdf", "rotate", angle=90)
```

#### `status(job_id)` / `download(job_id, output_path=None)`
Check status or download result of an async job.

#### `wait_for_job(job_id, interval=2, timeout=300)`
Polls until job completes or fails.

#### `formats()` / `tools()`
List supported formats or tools. No authentication required.

#### `usage()`
Check your API quota.

```python
info = mc.usage()
# {"plan": "free", "requests_today": 3, "remaining": 7, ...}
```

## Error Handling

```python
from megaconvert import MegaConvert, MegaConvertError

try:
    mc.convert("file.xyz", "abc")
except MegaConvertError as e:
    print(e.message)  # "Conversion pair not supported"
    print(e.code)     # "unsupported"
    print(e.status)   # 400
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
