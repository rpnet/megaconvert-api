#!/bin/bash
# MegaConvert API — Use a tool (compress, resize, merge, etc.)
# Full docs: https://megaconvert.io/docs/api

API_KEY="mc_your_api_key_here"
BASE_URL="https://megaconvert.io/api/v1"

# Example: Compress a PDF
echo "Compressing PDF..."

RESPONSE=$(curl -s -X POST "${BASE_URL}/tool" \
  -H "X-API-Key: ${API_KEY}" \
  -F "file=@large-document.pdf" \
  -F "tool=compress-pdf")

JOB_ID=$(echo "$RESPONSE" | grep -o '"job_id":"[^"]*"' | cut -d'"' -f4)
echo "Job: ${JOB_ID}"

# Wait for completion
while true; do
  STATUS=$(curl -s "${BASE_URL}/status/${JOB_ID}" -H "X-API-Key: ${API_KEY}" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  [ "$STATUS" = "completed" ] && break
  [ "$STATUS" = "failed" ] && echo "Failed!" && exit 1
  sleep 2
done

# Download
curl -s -o "compressed.pdf" "${BASE_URL}/download/${JOB_ID}" -H "X-API-Key: ${API_KEY}"
echo "Done! Saved to compressed.pdf"
