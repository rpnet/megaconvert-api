"""
MegaConvert API — Python example using requests
Full docs: https://megaconvert.io/docs/api

Install: pip install requests
"""

import requests
import time

API_KEY = "mc_your_api_key_here"
BASE_URL = "https://megaconvert.io/api/v1"

headers = {"X-API-Key": API_KEY}


def convert_file(input_path: str, output_format: str) -> str:
    """Convert a file and return the output file path."""

    # Step 1: Submit conversion
    with open(input_path, "rb") as f:
        response = requests.post(
            f"{BASE_URL}/convert",
            headers=headers,
            files={"file": f},
            data={"output_format": output_format},
        )
    response.raise_for_status()
    job_id = response.json()["job_id"]
    print(f"Job created: {job_id}")

    # Step 2: Poll for completion
    while True:
        status_resp = requests.get(f"{BASE_URL}/status/{job_id}", headers=headers)
        status = status_resp.json()["status"]
        print(f"Status: {status}")

        if status == "completed":
            break
        elif status == "failed":
            raise Exception("Conversion failed")
        time.sleep(2)

    # Step 3: Download result
    download_resp = requests.get(f"{BASE_URL}/download/{job_id}", headers=headers)
    output_path = f"{input_path.rsplit('.', 1)[0]}.{output_format}"
    with open(output_path, "wb") as f:
        f.write(download_resp.content)

    print(f"Saved to {output_path}")
    return output_path


def use_tool(input_path: str, tool: str, **params) -> str:
    """Process a file with a tool (compress, resize, etc.)."""

    with open(input_path, "rb") as f:
        response = requests.post(
            f"{BASE_URL}/tool",
            headers=headers,
            files={"file": f},
            data={"tool": tool, **params},
        )
    response.raise_for_status()
    job_id = response.json()["job_id"]

    while True:
        status = requests.get(
            f"{BASE_URL}/status/{job_id}", headers=headers
        ).json()["status"]
        if status == "completed":
            break
        elif status == "failed":
            raise Exception("Processing failed")
        time.sleep(2)

    download_resp = requests.get(f"{BASE_URL}/download/{job_id}", headers=headers)
    output_path = f"processed_{input_path}"
    with open(output_path, "wb") as f:
        f.write(download_resp.content)

    return output_path


def check_usage():
    """Check your API usage."""
    resp = requests.get(f"{BASE_URL}/usage", headers=headers)
    data = resp.json()
    print(f"Used: {data['requests_today']}/{data['rate_limit']} today")
    print(f"Remaining: {data['remaining']}")


if __name__ == "__main__":
    # Convert PNG to WebP
    convert_file("image.png", "webp")

    # Compress a PDF
    # use_tool("document.pdf", "compress-pdf")

    # Resize an image
    # use_tool("photo.jpg", "resize-image", width="800", height="600")
