<?php

declare(strict_types=1);

namespace MegaConvert;

use RuntimeException;

class MegaConvertException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly string $errorCode = 'unknown',
        public readonly int $statusCode = 0,
    ) {
        parent::__construct($message, $statusCode);
    }

    public function __toString(): string
    {
        return "[{$this->statusCode} {$this->errorCode}] {$this->getMessage()}";
    }
}
