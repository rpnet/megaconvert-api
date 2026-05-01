<?php
/**
 * MegaConvert API — PHP example using cURL
 * Full docs: https://megaconvert.io/docs/api
 */

define('API_KEY', 'mc_your_api_key_here');
define('BASE_URL', 'https://megaconvert.io/api/v1');

function megaconvert_request(string $method, string $endpoint, array $options = []): array
{
    $ch = curl_init(BASE_URL . $endpoint);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['X-API-Key: ' . API_KEY],
    ]);

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if (isset($options['postfields'])) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $options['postfields']);
        }
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if (isset($options['raw'])) {
        return ['code' => $httpCode, 'body' => $response];
    }

    return json_decode($response, true) ?? ['error' => 'Invalid response'];
}

function convert_file(string $inputPath, string $outputFormat): string
{
    // Step 1: Submit conversion
    $result = megaconvert_request('POST', '/convert', [
        'postfields' => [
            'file' => new CURLFile($inputPath),
            'output_format' => $outputFormat,
        ],
    ]);

    if (isset($result['error'])) {
        throw new RuntimeException("Upload failed: {$result['error']}");
    }

    $jobId = $result['job_id'];
    echo "Job created: {$jobId}\n";

    // Step 2: Poll for completion
    while (true) {
        $status = megaconvert_request('GET', "/status/{$jobId}");
        echo "Status: {$status['status']}\n";

        if ($status['status'] === 'completed') break;
        if ($status['status'] === 'failed') throw new RuntimeException('Conversion failed');
        sleep(2);
    }

    // Step 3: Download
    $download = megaconvert_request('GET', "/download/{$jobId}", ['raw' => true]);
    $ext = pathinfo($inputPath, PATHINFO_EXTENSION);
    $outputPath = str_replace(".{$ext}", ".{$outputFormat}", $inputPath);
    file_put_contents($outputPath, $download['body']);
    echo "Saved to {$outputPath}\n";

    return $outputPath;
}

function use_tool(string $inputPath, string $tool, array $params = []): string
{
    $postfields = array_merge([
        'file' => new CURLFile($inputPath),
        'tool' => $tool,
    ], $params);

    $result = megaconvert_request('POST', '/tool', ['postfields' => $postfields]);
    $jobId = $result['job_id'];

    while (true) {
        $status = megaconvert_request('GET', "/status/{$jobId}");
        if ($status['status'] === 'completed') break;
        if ($status['status'] === 'failed') throw new RuntimeException('Processing failed');
        sleep(2);
    }

    $download = megaconvert_request('GET', "/download/{$jobId}", ['raw' => true]);
    $outputPath = "processed_" . basename($inputPath);
    file_put_contents($outputPath, $download['body']);

    return $outputPath;
}

function check_usage(): void
{
    $data = megaconvert_request('GET', '/usage');
    echo "Used: {$data['requests_today']}/{$data['rate_limit']} today\n";
    echo "Remaining: {$data['remaining']}\n";
}

// Usage:
// convert_file('image.png', 'webp');
// use_tool('document.pdf', 'compress-pdf');
// use_tool('photo.jpg', 'resize-image', ['width' => '800', 'height' => '600']);
