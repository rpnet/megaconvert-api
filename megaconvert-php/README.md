# megaconvert-php

[![Packagist Version](https://img.shields.io/packagist/v/megaconvert/megaconvert-php.svg)](https://packagist.org/packages/megaconvert/megaconvert-php)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Official PHP SDK for the [MegaConvert API](https://megaconvert.io/docs/api) — convert files between 500+ formats.

**Zero dependencies.** Uses built-in cURL. Requires PHP 8.1+.

## Install

```bash
composer require megaconvert/megaconvert-php
```

## Quick Start

```php
use MegaConvert\MegaConvert;

$mc = new MegaConvert('mc_your_api_key');

// Convert a file
$mc->convert('document.docx', 'pdf');
// → saves document.pdf

// Convert with custom output path
$mc->convert('photo.heic', 'jpg', 'output/photo.jpg');

// Convert from string
$pdfContent = $mc->convertFromString($docxBytes, 'input.docx', 'pdf');
```

## API

### `new MegaConvert(string $apiKey, array $options = [])`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | `https://megaconvert.io/api/v1` | API base URL |
| `timeout` | `int` | `300` | Request timeout in seconds |

### Methods

#### `convert($filePath, $outputFormat, $outputPath = null): string`

```php
$path = $mc->convert('video.mov', 'mp4');
```

#### `convertFromString($data, $filename, $outputFormat): string`

```php
$webp = $mc->convertFromString($pngData, 'image.png', 'webp');
```

#### `convertAsync($filePath, $outputFormat): array`

```php
$job = $mc->convertAsync('large-video.avi', 'mp4');
$result = $mc->waitForJob($job['job_id']);
$mc->download($job['job_id'], 'output.mp4');
```

#### `tool($filePath, $toolName, $options = [], $outputPath = null): string`

```php
$mc->tool('image.jpg', 'compress', ['quality' => 80]);
$mc->tool('image.png', 'resize', ['width' => 800, 'height' => 600]);
$mc->tool('document.pdf', 'rotate', ['angle' => 90]);
```

#### `status($jobId)` / `download($jobId, $outputPath = null)`
Check status or download result of an async job.

#### `waitForJob($jobId, $interval = 2, $timeout = 300): array`
Polls until job completes or fails.

#### `formats()` / `tools()`
List supported formats or tools. No authentication required.

#### `usage(): array`
Check your API quota.

## Error Handling

```php
use MegaConvert\MegaConvert;
use MegaConvert\MegaConvertException;

try {
    $mc->convert('file.xyz', 'abc');
} catch (MegaConvertException $e) {
    echo $e->getMessage();   // "Conversion pair not supported"
    echo $e->errorCode;      // "unsupported"
    echo $e->statusCode;     // 400
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
