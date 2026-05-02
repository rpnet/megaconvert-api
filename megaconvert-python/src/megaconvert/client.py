"""MegaConvert API client."""

import os
import time
from pathlib import Path
from typing import Any, Dict, Optional, Union

import requests

from .exceptions import MegaConvertError

DEFAULT_BASE_URL = "https://megaconvert.io/api/v1"
DEFAULT_TIMEOUT = 300


class MegaConvert:
    """MegaConvert API client.

    Args:
        api_key: Your API key (starts with mc_). Get one at https://megaconvert.io/register
        base_url: API base URL (default: https://megaconvert.io/api/v1)
        timeout: Request timeout in seconds (default: 300)
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = DEFAULT_BASE_URL,
        timeout: int = DEFAULT_TIMEOUT,
    ):
        self.api_key = api_key or os.environ.get("MEGACONVERT_API_KEY", "")
        if not self.api_key:
            raise ValueError(
                "API key is required. Pass it directly or set MEGACONVERT_API_KEY. "
                "Get one at https://megaconvert.io/register"
            )
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self._session = requests.Session()
        self._session.headers["X-API-Key"] = self.api_key

    def convert(
        self,
        file_path: Union[str, Path],
        output_format: str,
        output_path: Optional[Union[str, Path]] = None,
    ) -> str:
        """Convert a file synchronously.

        Args:
            file_path: Path to the input file.
            output_format: Target format (e.g. "pdf", "png", "mp3").
            output_path: Where to save the result. Auto-generated if omitted.

        Returns:
            Path to the converted file.
        """
        file_path = Path(file_path)
        if output_path is None:
            output_path = file_path.with_suffix(f".{output_format}")
        output_path = Path(output_path)

        with open(file_path, "rb") as f:
            resp = self._session.post(
                f"{self.base_url}/convert/sync",
                files={"file": (file_path.name, f)},
                data={"output_format": output_format},
                timeout=self.timeout,
                stream=True,
            )

        if resp.status_code == 200:
            with open(output_path, "wb") as out:
                for chunk in resp.iter_content(8192):
                    out.write(chunk)
            return str(output_path)

        if resp.status_code == 202:
            return resp.json()

        self._handle_error(resp)

    def convert_bytes(
        self,
        data: bytes,
        filename: str,
        output_format: str,
    ) -> bytes:
        """Convert file data in memory.

        Args:
            data: File content as bytes.
            filename: Original filename (for format detection).
            output_format: Target format.

        Returns:
            Converted file as bytes.
        """
        resp = self._session.post(
            f"{self.base_url}/convert/sync",
            files={"file": (filename, data)},
            data={"output_format": output_format},
            timeout=self.timeout,
        )

        if resp.status_code == 200:
            return resp.content

        self._handle_error(resp)

    def convert_async(
        self,
        file_path: Union[str, Path],
        output_format: str,
    ) -> Dict[str, str]:
        """Start an async conversion.

        Args:
            file_path: Path to the input file.
            output_format: Target format.

        Returns:
            Dict with job_id and status_url.
        """
        file_path = Path(file_path)
        with open(file_path, "rb") as f:
            resp = self._session.post(
                f"{self.base_url}/convert",
                files={"file": (file_path.name, f)},
                data={"output_format": output_format},
                timeout=self.timeout,
            )

        if resp.ok:
            return resp.json()

        self._handle_error(resp)

    def tool(
        self,
        file_path: Union[str, Path],
        tool_name: str,
        output_path: Optional[Union[str, Path]] = None,
        **options: Any,
    ) -> str:
        """Run a tool on a file.

        Tools: compress, merge, split, rotate, resize, crop, trim,
        extract-audio, gif, watermark, qr-code.

        Args:
            file_path: Path to the input file.
            tool_name: Tool name.
            output_path: Where to save the result.
            **options: Tool-specific options (e.g. quality=80, width=800).

        Returns:
            Path to the processed file.
        """
        file_path = Path(file_path)
        form_data = {"tool": tool_name}
        form_data.update({k: str(v) for k, v in options.items()})

        with open(file_path, "rb") as f:
            resp = self._session.post(
                f"{self.base_url}/tool",
                files={"file": (file_path.name, f)},
                data=form_data,
                timeout=self.timeout,
                stream=True,
            )

        if resp.status_code == 200:
            if output_path is None:
                output_path = file_path.with_name(
                    f"{file_path.stem}_{tool_name}{file_path.suffix}"
                )
            output_path = Path(output_path)
            with open(output_path, "wb") as out:
                for chunk in resp.iter_content(8192):
                    out.write(chunk)
            return str(output_path)

        if resp.status_code == 202:
            return resp.json()

        self._handle_error(resp)

    def status(self, job_id: str) -> Dict[str, Any]:
        """Check the status of an async job.

        Returns:
            Dict with status ("pending", "processing", "completed", "failed")
            and download_url when completed.
        """
        resp = self._session.get(
            f"{self.base_url}/status/{job_id}",
            timeout=self.timeout,
        )
        if resp.ok:
            return resp.json()
        self._handle_error(resp)

    def download(
        self,
        job_id: str,
        output_path: Optional[Union[str, Path]] = None,
    ) -> Union[str, bytes]:
        """Download the result of a completed async job.

        Args:
            job_id: The job ID.
            output_path: Where to save the file. Returns bytes if omitted.

        Returns:
            File path (if output_path given) or bytes.
        """
        resp = self._session.get(
            f"{self.base_url}/download/{job_id}",
            timeout=self.timeout,
            stream=True,
        )
        if not resp.ok:
            self._handle_error(resp)

        if output_path:
            output_path = Path(output_path)
            with open(output_path, "wb") as out:
                for chunk in resp.iter_content(8192):
                    out.write(chunk)
            return str(output_path)

        return resp.content

    def formats(self) -> Any:
        """List all supported conversion formats. No auth required."""
        resp = requests.get(f"{self.base_url}/formats", timeout=self.timeout)
        if resp.ok:
            return resp.json()
        self._handle_error(resp)

    def tools(self) -> Any:
        """List all available tools. No auth required."""
        resp = requests.get(f"{self.base_url}/tools", timeout=self.timeout)
        if resp.ok:
            return resp.json()
        self._handle_error(resp)

    def usage(self) -> Dict[str, Any]:
        """Check your current API usage and quota."""
        resp = self._session.get(
            f"{self.base_url}/usage",
            timeout=self.timeout,
        )
        if resp.ok:
            return resp.json()
        self._handle_error(resp)

    def wait_for_job(
        self,
        job_id: str,
        interval: float = 2.0,
        timeout: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Poll an async job until it completes or fails.

        Args:
            job_id: The job ID.
            interval: Seconds between polls (default: 2).
            timeout: Max seconds to wait (default: client timeout).

        Returns:
            Job status dict with download_url.
        """
        timeout = timeout or self.timeout
        start = time.monotonic()

        while time.monotonic() - start < timeout:
            result = self.status(job_id)
            if result["status"] == "completed":
                return result
            if result["status"] == "failed":
                raise MegaConvertError("Job failed", "job_failed", 422)
            time.sleep(interval)

        raise MegaConvertError("Job timed out", "timeout", 408)

    @staticmethod
    def _handle_error(resp: requests.Response) -> None:
        try:
            data = resp.json()
            raise MegaConvertError(
                data.get("error", f"HTTP {resp.status_code}"),
                data.get("code", "unknown"),
                resp.status_code,
            )
        except (ValueError, KeyError):
            raise MegaConvertError(f"HTTP {resp.status_code}", "unknown", resp.status_code)
