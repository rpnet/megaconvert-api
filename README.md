# MegaConvert API [![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

Official documentation and code examples for the [MegaConvert.io](https://megaconvert.io) File Conversion API.

Convert 300+ file format pairs programmatically — images, video, audio, documents, ebooks, fonts, subtitles, archives, vector graphics, and more.

**Full interactive documentation:** [megaconvert.io/docs/api](https://megaconvert.io/docs/api)

---

## Contents

- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Code Examples](#code-examples)
- [Rate Limits & File Limits](#rate-limits--file-limits)
- [Security Features](#security-features)
- [Supported Formats](#supported-formats)
- [Error Codes](#error-codes)
- [Awesome File Conversion](#awesome-file-conversion) — Curated list of conversion tools, libraries & resources

---

## Quick Start

### 1. Get your API key

API access is included with the [12-month plan ($79/year)](https://megaconvert.io/pricing). Once subscribed, generate your API key from the [dashboard](https://megaconvert.io/dashboard/api-keys).

### 2. Convert a file

```bash
# Upload and convert a PNG to WebP
curl -X POST https://megaconvert.io/api/v1/convert \
  -H "X-API-Key: mc_your_api_key_here" \
  -F "file=@image.png" \
  -F "output_format=webp"
```

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Job created successfully"
}
```

### 3. Check status

```bash
curl https://megaconvert.io/api/v1/status/550e8400-e29b-41d4-a716-446655440000 \
  -H "X-API-Key: mc_your_api_key_here"
```

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "download_url": "/api/v1/download/550e8400-e29b-41d4-a716-446655440000"
}
```

### 4. Download the result

```bash
curl -O https://megaconvert.io/api/v1/download/550e8400-e29b-41d4-a716-446655440000 \
  -H "X-API-Key: mc_your_api_key_here"
```

---

## API Reference

**Base URL:** `https://megaconvert.io/api/v1`

**Authentication:** API key via `X-API-Key` header

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/convert` | Convert a file to another format |
| `POST` | `/tool` | Process a file with a tool (compress, resize, merge, etc.) |
| `GET` | `/status/{job_id}` | Check job status |
| `GET` | `/download/{job_id}` | Download completed file |
| `GET` | `/formats` | List all supported format conversions |
| `GET` | `/tools` | List all available processing tools |
| `GET` | `/usage` | Check your API usage and limits |

### POST /convert

Convert a file from one format to another.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | Yes | The file to convert |
| `output_format` | string | Yes | Target format (e.g., `webp`, `pdf`, `mp3`) |

**Response:**

```json
{
  "job_id": "uuid-string",
  "status": "pending",
  "message": "Job created successfully"
}
```

### POST /tool

Process a file using a specific tool.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | Yes | The file to process |
| `tool` | string | Yes | Tool name (see available tools below) |
| Additional params vary by tool (see below) |

**Available tools:**

| Tool | Description | Extra Parameters |
|------|-------------|-----------------|
| `compress-pdf` | Compress PDF files | — |
| `merge-pdf` | Merge multiple PDFs | Multiple `file` fields |
| `split-pdf` | Extract page range | `pages` (e.g., `"1-5"`) |
| `rotate-pdf` | Rotate PDF pages | `angle` (`90`, `180`, `270`) |
| `protect-pdf` | Password-protect PDF | `password` |
| `unlock-pdf` | Remove PDF password | `password` (current password) |
| `compress-image` | Compress images | — |
| `resize-image` | Resize images | `width`, `height` |
| `crop-image` | Crop images | `width`, `height`, `x`, `y` |
| `compress-video` | Compress videos | — |
| `trim-video` | Trim video | `start`, `end` |
| `video-to-gif` | Convert video to GIF | — |
| `extract-audio` | Extract audio from video | — |

### GET /status/{job_id}

Check the status of a conversion job.

**Statuses:** `pending` → `processing` → `completed` or `failed`

**Response:**

```json
{
  "job_id": "uuid-string",
  "status": "completed",
  "download_url": "/api/v1/download/uuid-string"
}
```

### GET /download/{job_id}

Download the converted file. Returns the binary file content.

### GET /formats

List all supported format conversion pairs.

### GET /tools

List all available processing tools.

### GET /usage

Check your current API usage.

**Response:**

```json
{
  "rate_limit": 100,
  "requests_today": 42,
  "remaining": 58
}
```

---

## Code Examples

Complete working examples in multiple languages:

- **[cURL](examples/curl/)** — Shell scripts
- **[Python](examples/python/)** — Using `requests`
- **[JavaScript](examples/javascript/)** — Using `fetch` (Node.js 18+)
- **[PHP](examples/php/)** — Using `cURL`

---

## Rate Limits & File Limits

### Rate Limits
- **100 requests per day** per API key (configurable)
- Resets at midnight UTC
- Response headers:
  - `X-RateLimit-Limit` — Your daily limit
  - `X-RateLimit-Remaining` — Requests remaining today

### File Limits
- **Maximum file size:** 10 GB
- **File retention:** 24 hours after conversion
- Files are automatically deleted after the retention period

---

## Security Features

- **IP Whitelist** — Restrict API access to specific IPs (configurable per key)
- **Domain Whitelist** — Restrict API access to specific domains (configurable per key)
- **API Key Hashing** — Keys are stored as SHA256 hashes

Configure these settings in your [API dashboard](https://megaconvert.io/dashboard/api-keys).

---

## Supported Formats

### Documents
PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT, ODT, ODS, ODP, TXT, CSV, HTML, RTF

### Images
JPG, JPEG, PNG, GIF, WebP, BMP, SVG, TIFF, ICO, HEIC, AVIF, PSD, RAW

### Video
MP4, WebM, AVI, MKV, MOV, FLV

### Audio
MP3, WAV, OGG, FLAC, AAC, M4A, WMA

### Ebooks
EPUB, MOBI, AZW3, FB2

### Fonts
TTF, OTF, WOFF, WOFF2, EOT

### Archives
ZIP, RAR, 7Z, TAR, GZ

### Subtitles
SRT, VTT, ASS, SSA

### Vector & CAD
SVG, EPS, DXF

Use `GET /formats` for the complete list.

---

## Error Codes

| Code | Description |
|------|-------------|
| `400` | Bad request — missing parameters or unsupported format |
| `401` | Unauthorized — missing or invalid API key |
| `403` | Forbidden — no active subscription or IP/domain not whitelisted |
| `404` | Not found — job doesn't exist or doesn't belong to you |
| `413` | File too large — exceeds size limit |
| `429` | Rate limit exceeded — try again tomorrow or upgrade |
| `500` | Server error — please retry or contact support |

**Error response format:**

```json
{
  "error": "Human-readable error message",
  "code": "error_code_identifier"
}
```

---

# Awesome File Conversion

> A curated list of tools, libraries, APIs, and resources for converting files between formats.

## Online Converters

| Tool | Formats | Free Tier | API | Languages |
|------|---------|-----------|-----|-----------|
| **[MegaConvert.io](https://megaconvert.io)** | **300+ pairs** (images, video, audio, docs, ebooks, fonts, subtitles, archives, vector) | 3/day, 25MB | **[Yes](https://megaconvert.io/docs/api)** | **47** |
| [CloudConvert](https://cloudconvert.com) | 200+ formats | 25 min/day | Yes | ~15 |
| [Convertio](https://convertio.co) | 300+ formats | 100MB, 10 min/day | Yes | ~10 |
| [Zamzar](https://zamzar.com) | 1200+ formats | 2 files/day, 50MB | Yes | 1 (EN) |
| [Online-Convert](https://online-convert.com) | 200+ formats | Limited | Yes | ~10 |
| [FreeConvert](https://freeconvert.com) | 200+ formats | 1GB | No | ~5 |

## Image Conversion

### Online Tools
- [MegaConvert Image Converter](https://megaconvert.io/category/image) — JPG, PNG, WebP, AVIF, HEIC, SVG, BMP, TIFF, ICO, PSD, RAW and more
- [Squoosh](https://squoosh.app) — Google's image compression/conversion tool (client-side)
- [TinyPNG](https://tinypng.com) — PNG and JPEG compression

### CLI Tools
- [ImageMagick](https://imagemagick.org) — The Swiss Army knife of image processing. Supports 200+ formats
- [libvips](https://github.com/libvips/libvips) — Fast image processing library, lower memory than ImageMagick
- [Sharp](https://github.com/lovell/sharp) — High-performance Node.js image processing (powered by libvips)

### Libraries
- [sharp](https://www.npmjs.com/package/sharp) (Node.js) — Resize, convert, compress images
- [Pillow](https://pypi.org/project/Pillow/) (Python) — Read/write many image formats
- [image](https://crates.io/crates/image) (Rust) — Pure Rust image processing
- [Intervention Image](https://github.com/Intervention/image) (PHP) — OOP image handling

## Video Conversion

### Online Tools
- [MegaConvert Video Converter](https://megaconvert.io/category/video) — MP4, WebM, AVI, MKV, MOV, FLV and more
- [HandBrake](https://handbrake.fr) — Open source video transcoder (desktop app)

### CLI Tools
- [FFmpeg](https://ffmpeg.org) — The universal multimedia framework
- [HandBrake CLI](https://handbrake.fr/docs/en/latest/cli/cli-options.html) — Command line video transcoding

### Libraries
- [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg) (Node.js) — FFmpeg wrapper
- [ffmpeg-python](https://github.com/kkroening/ffmpeg-python) (Python) — Pythonic FFmpeg bindings
- [PHP-FFMpeg](https://github.com/PHP-FFMpeg/PHP-FFMpeg) (PHP) — FFmpeg wrapper for PHP

## Audio Conversion

### Online Tools
- [MegaConvert Audio Converter](https://megaconvert.io/category/audio) — MP3, WAV, FLAC, AAC, OGG, M4A, WMA and more

### CLI Tools
- [FFmpeg](https://ffmpeg.org) — Also handles all audio formats
- [SoX](http://sox.sourceforge.net) — Sound eXchange, the Swiss Army knife of audio
- [LAME](https://lame.sourceforge.io) — High quality MP3 encoder

### Libraries
- [pydub](https://github.com/jiaaro/pydub) (Python) — Simple audio manipulation
- [NAudio](https://github.com/naudio/NAudio) (.NET) — Audio library for .NET

## Document Conversion

### Online Tools
- [MegaConvert Document Converter](https://megaconvert.io/category/document) — PDF, DOCX, DOC, ODT, RTF, TXT, HTML and more
- [iLovePDF](https://www.ilovepdf.com) — Comprehensive PDF toolkit
- [SmallPDF](https://smallpdf.com) — PDF tools suite

### CLI Tools
- [LibreOffice CLI](https://www.libreoffice.org/discover/libreoffice/) — `libreoffice --headless --convert-to` for document conversion
- [Pandoc](https://pandoc.org) — Universal document converter (Markdown, LaTeX, DOCX, HTML, EPUB, etc.)
- [Ghostscript](https://www.ghostscript.com) — PostScript/PDF interpreter and converter
- [poppler-utils](https://poppler.freedesktop.org) — PDF rendering library (pdftotext, pdftohtml, etc.)

### Libraries
- [python-docx](https://github.com/python-openxml/python-docx) (Python) — Create/modify Word documents
- [PyPDF2](https://github.com/py-pdf/pypdf) (Python) — PDF manipulation
- [pdf-lib](https://github.com/Hopding/pdf-lib) (JavaScript) — Create and modify PDFs
- [TCPDF](https://github.com/tecnickcom/TCPDF) (PHP) — PDF generation

## Ebook Conversion

### Online Tools
- [MegaConvert Ebook Converter](https://megaconvert.io/category/ebook) — EPUB, MOBI, AZW3, FB2, PDF and more

### CLI Tools
- [Calibre](https://calibre-ebook.com) — The ultimate ebook management and conversion tool
- `ebook-convert` — Calibre's CLI tool for ebook format conversion

### Libraries
- [EbookLib](https://github.com/aerkalov/ebooklib) (Python) — Read/write EPUB files

## Font Conversion

### Online Tools
- [MegaConvert Font Converter](https://megaconvert.io/category/font) — TTF, OTF, WOFF, WOFF2, EOT and more

### Libraries
- [fonttools](https://github.com/fonttools/fonttools) (Python) — Manipulate font files (TTF, OTF, WOFF, WOFF2)

## Archive & Compression

### Online Tools
- [MegaConvert Archive Converter](https://megaconvert.io/category/archive) — ZIP, RAR, 7Z, TAR, GZ and more

### CLI Tools
- [7-Zip](https://www.7-zip.org) — High compression ratio archiver
- [p7zip](https://github.com/p7zip-project/p7zip) — 7-Zip for POSIX systems

## Subtitle Conversion

### Online Tools
- [MegaConvert Subtitle Converter](https://megaconvert.io/category/subtitle) — SRT, VTT, ASS, SSA and more

### Libraries
- [pysrt](https://github.com/byroot/pysrt) (Python) — SRT subtitle parser
- [webvtt-py](https://github.com/glut23/webvtt-py) (Python) — WebVTT parser

## Vector & CAD

### Online Tools
- [MegaConvert Vector Converter](https://megaconvert.io/category/vector) — SVG, EPS, DXF, AI and more

### CLI Tools
- [Inkscape CLI](https://inkscape.org) — `inkscape --export-filename` for vector conversion
- [potrace](http://potrace.sourceforge.net) — Bitmap to vector tracing

## Spreadsheet Conversion

### Online Tools
- [MegaConvert Spreadsheet Converter](https://megaconvert.io/category/spreadsheet) — XLS, XLSX, CSV, ODS, TSV and more

### Libraries
- [openpyxl](https://github.com/theorchard/openpyxl) (Python) — Read/write Excel files
- [SheetJS](https://github.com/SheetJS/sheetjs) (JavaScript) — Spreadsheet parser and writer
- [PhpSpreadsheet](https://github.com/PHPOffice/PhpSpreadsheet) (PHP) — Read/write spreadsheet files

## Presentation Conversion

### Online Tools
- [MegaConvert Presentation Converter](https://megaconvert.io/category/presentation) — PPT, PPTX, ODP, PDF and more

### Libraries
- [python-pptx](https://github.com/scanny/python-pptx) (Python) — Create/modify PowerPoint files

## Conversion APIs — Price Comparison

| API | Plan | Requests Included | Cost/Request | Max File Size |
|-----|------|-------------------|-------------|---------------|
| **[MegaConvert API](https://megaconvert.io/docs/api)** | **$79/year** | **36,500/year** (100/day) | **$0.002** | **10 GB** |
| [CloudConvert API](https://cloudconvert.com/api) | $8/500 min | ~500/month | $0.016 | 5 GB |
| [Zamzar API](https://developers.zamzar.com) | $8/month ($96/yr) | 100/month | $0.080 | 50 MB |
| [ConvertAPI](https://www.convertapi.com) | $15/month ($180/yr) | 1,500/month | $0.010 | 1 GB |

> **MegaConvert is up to 40x cheaper per request** than alternatives, with the largest file size limit (10 GB) and no monthly billing — one flat annual fee.

## Articles & Guides

- [FFmpeg Cheat Sheet](https://gist.github.com/steven2358/ba153c642fe2bb1e47485962df07c3e2) — Common FFmpeg commands
- [Pandoc User's Guide](https://pandoc.org/MANUAL.html) — Complete guide to document conversion
- [ImageMagick Examples](https://imagemagick.org/Usage/) — Comprehensive ImageMagick tutorial

---

## Contributing

Contributions welcome! Please read the [contribution guidelines](CONTRIBUTING.md) first.

## Support

- **Documentation:** [megaconvert.io/docs/api](https://megaconvert.io/docs/api)
- **Issues:** [GitHub Issues](https://github.com/rpnet/megaconvert-api/issues)
- **Email:** support@megaconvert.io

## License

[MIT](LICENSE) — API docs and code examples.

[CC0 1.0](LICENSE-CC0) — Awesome File Conversion list (public domain).
