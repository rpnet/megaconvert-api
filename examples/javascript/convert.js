/**
 * MegaConvert API — Node.js example using fetch
 * Full docs: https://megaconvert.io/docs/api
 *
 * Requires Node.js 18+ (native fetch)
 */

const fs = require("fs");
const path = require("path");

const API_KEY = "mc_your_api_key_here";
const BASE_URL = "https://megaconvert.io/api/v1";

const headers = { "X-API-Key": API_KEY };

async function convertFile(inputPath, outputFormat) {
  // Step 1: Submit conversion
  const formData = new FormData();
  formData.append("file", new Blob([fs.readFileSync(inputPath)]), path.basename(inputPath));
  formData.append("output_format", outputFormat);

  const response = await fetch(`${BASE_URL}/convert`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
  const { job_id } = await response.json();
  console.log(`Job created: ${job_id}`);

  // Step 2: Poll for completion
  while (true) {
    const statusResp = await fetch(`${BASE_URL}/status/${job_id}`, { headers });
    const { status } = await statusResp.json();
    console.log(`Status: ${status}`);

    if (status === "completed") break;
    if (status === "failed") throw new Error("Conversion failed");
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Step 3: Download
  const downloadResp = await fetch(`${BASE_URL}/download/${job_id}`, { headers });
  const buffer = Buffer.from(await downloadResp.arrayBuffer());
  const ext = path.extname(inputPath);
  const outputPath = inputPath.replace(ext, `.${outputFormat}`);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Saved to ${outputPath}`);
  return outputPath;
}

async function useTool(inputPath, tool, params = {}) {
  const formData = new FormData();
  formData.append("file", new Blob([fs.readFileSync(inputPath)]), path.basename(inputPath));
  formData.append("tool", tool);
  for (const [key, value] of Object.entries(params)) {
    formData.append(key, value);
  }

  const response = await fetch(`${BASE_URL}/tool`, {
    method: "POST",
    headers,
    body: formData,
  });
  const { job_id } = await response.json();

  while (true) {
    const { status } = await (await fetch(`${BASE_URL}/status/${job_id}`, { headers })).json();
    if (status === "completed") break;
    if (status === "failed") throw new Error("Processing failed");
    await new Promise((r) => setTimeout(r, 2000));
  }

  const downloadResp = await fetch(`${BASE_URL}/download/${job_id}`, { headers });
  const buffer = Buffer.from(await downloadResp.arrayBuffer());
  const outputPath = `processed_${path.basename(inputPath)}`;
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

async function checkUsage() {
  const resp = await fetch(`${BASE_URL}/usage`, { headers });
  const data = await resp.json();
  console.log(`Used: ${data.requests_today}/${data.rate_limit} today`);
  console.log(`Remaining: ${data.remaining}`);
}

module.exports = { convertFile, useTool, checkUsage };

// Usage:
// convertFile("image.png", "webp");
// useTool("document.pdf", "compress-pdf");
// useTool("photo.jpg", "resize-image", { width: "800", height: "600" });
