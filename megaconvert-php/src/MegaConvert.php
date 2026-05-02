<?php

declare(strict_types=1);

namespace MegaConvert;

class MegaConvert
{
    private const DEFAULT_BASE_URL = 'https://megaconvert.io/api/v1';
    private const DEFAULT_TIMEOUT = 300;

    private string $apiKey;
    private string $baseUrl;
    private int $timeout;

    /**
     * @param string $apiKey  Your API key (starts with mc_)
     * @param array  $options {baseUrl?: string, timeout?: int}
     */
    public function __construct(string $apiKey, array $options = [])
    {
        if (empty($apiKey)) {
            throw new \InvalidArgumentException(
                'API key is required. Get one at https://megaconvert.io/register'
            );
        }

        $this->apiKey = $apiKey;
        $this->baseUrl = rtrim($options['baseUrl'] ?? self::DEFAULT_BASE_URL, '/');
        $this->timeout = $options['timeout'] ?? self::DEFAULT_TIMEOUT;
    }

    /**
     * Convert a file synchronously.
     *
     * @param string      $filePath     Path to input file
     * @param string      $outputFormat Target format (e.g. "pdf", "png", "mp3")
     * @param string|null $outputPath   Output path (auto-generated if null)
     * @return string Path to converted file
     */
    public function convert(string $filePath, string $outputFormat, ?string $outputPath = null): string
    {
        $result = $this->request('/convert/sync', [
            'file' => new \CURLFile($filePath),
            'output_format' => $outputFormat,
        ], true);

        if ($outputPath === null) {
            $info = pathinfo($filePath);
            $outputPath = ($info['dirname'] ?? '.') . '/' . $info['filename'] . '.' . $outputFormat;
        }

        file_put_contents($outputPath, $result);
        return $outputPath;
    }

    /**
     * Convert data from a string.
     *
     * @param string $data         File content
     * @param string $filename     Original filename
     * @param string $outputFormat Target format
     * @return string Converted file content
     */
    public function convertFromString(string $data, string $filename, string $outputFormat): string
    {
        $tmpFile = tempnam(sys_get_temp_dir(), 'mc_');
        file_put_contents($tmpFile, $data);

        try {
            $result = $this->request('/convert/sync', [
                'file' => new \CURLFile($tmpFile, '', $filename),
                'output_format' => $outputFormat,
            ], true);
        } finally {
            @unlink($tmpFile);
        }

        return $result;
    }

    /**
     * Start an async conversion.
     *
     * @return array{job_id: string, status_url: string}
     */
    public function convertAsync(string $filePath, string $outputFormat): array
    {
        return $this->request('/convert', [
            'file' => new \CURLFile($filePath),
            'output_format' => $outputFormat,
        ]);
    }

    /**
     * Run a tool on a file.
     *
     * Tools: compress, merge, split, rotate, resize, crop, trim,
     *        extract-audio, gif, watermark, qr-code.
     *
     * @param string      $filePath   Path to input file
     * @param string      $toolName   Tool name
     * @param array       $options    Tool-specific options
     * @param string|null $outputPath Output path
     * @return string Path to processed file
     */
    public function tool(string $filePath, string $toolName, array $options = [], ?string $outputPath = null): string
    {
        $fields = array_merge($options, [
            'file' => new \CURLFile($filePath),
            'tool' => $toolName,
        ]);

        $result = $this->request('/tool', $fields, true);

        if ($outputPath === null) {
            $info = pathinfo($filePath);
            $outputPath = ($info['dirname'] ?? '.') . '/' . $info['filename'] . "_{$toolName}." . ($info['extension'] ?? 'bin');
        }

        file_put_contents($outputPath, $result);
        return $outputPath;
    }

    /**
     * Check the status of an async job.
     *
     * @return array{status: string, download_url?: string}
     */
    public function status(string $jobId): array
    {
        return $this->request("/status/{$jobId}");
    }

    /**
     * Download the result of a completed async job.
     *
     * @param string      $jobId
     * @param string|null $outputPath Path to save file. Returns content if null.
     * @return string File path or content
     */
    public function download(string $jobId, ?string $outputPath = null): string
    {
        $result = $this->request("/download/{$jobId}", [], true);

        if ($outputPath !== null) {
            file_put_contents($outputPath, $result);
            return $outputPath;
        }

        return $result;
    }

    /**
     * List all supported conversion formats. No auth required.
     */
    public function formats(): array
    {
        return $this->request('/formats', [], false, false);
    }

    /**
     * List all available tools. No auth required.
     */
    public function tools(): array
    {
        return $this->request('/tools', [], false, false);
    }

    /**
     * Check your current API usage and quota.
     *
     * @return array{plan: string, requests_today: int, rate_limit: int, remaining: int}
     */
    public function usage(): array
    {
        return $this->request('/usage');
    }

    /**
     * Poll an async job until it completes or fails.
     *
     * @param string $jobId
     * @param int    $interval Seconds between polls (default: 2)
     * @param int    $timeout  Max seconds to wait
     * @return array Job status with download_url
     */
    public function waitForJob(string $jobId, int $interval = 2, int $timeout = 0): array
    {
        $timeout = $timeout ?: $this->timeout;
        $start = time();

        while (time() - $start < $timeout) {
            $result = $this->status($jobId);

            if ($result['status'] === 'completed') {
                return $result;
            }

            if ($result['status'] === 'failed') {
                throw new MegaConvertException('Job failed', 'job_failed', 422);
            }

            sleep($interval);
        }

        throw new MegaConvertException('Job timed out', 'timeout', 408);
    }

    /**
     * @param string $path     API path
     * @param array  $fields   POST fields (empty = GET request)
     * @param bool   $raw      Return raw response (not JSON)
     * @param bool   $auth     Include API key
     * @return array|string
     */
    private function request(string $path, array $fields = [], bool $raw = false, bool $auth = true): array|string
    {
        $ch = curl_init($this->baseUrl . $path);

        $headers = [];
        if ($auth) {
            $headers[] = "X-API-Key: {$this->apiKey}";
        }

        $opts = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_FOLLOWLOCATION => true,
        ];

        if (!empty($fields)) {
            $opts[CURLOPT_POST] = true;
            $opts[CURLOPT_POSTFIELDS] = $fields;
        }

        curl_setopt_array($ch, $opts);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new MegaConvertException("cURL error: {$error}", 'curl_error', 0);
        }

        if ($httpCode >= 400) {
            $data = json_decode($response, true);
            throw new MegaConvertException(
                $data['error'] ?? "HTTP {$httpCode}",
                $data['code'] ?? 'unknown',
                $httpCode,
            );
        }

        if ($raw && $httpCode === 200) {
            return $response;
        }

        $data = json_decode($response, true);
        if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
            return $response;
        }

        return $data;
    }
}
