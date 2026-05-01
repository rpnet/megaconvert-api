#!/bin/bash
# MegaConvert API — Convert a file using cURL
# Full docs: https://megaconvert.io/docs/api

API_KEY="mc_your_api_key_here"
BASE_URL="https://megaconvert.io/api/v1"

INPUT_FILE="document.pdf"
OUTPUT_FORMAT="docx"

echo "Uploading and converting ${INPUT_FILE} to ${OUTPUT_FORMAT}..."

# Step 1: Submit conversion job
RESPONSE=$(curl -s -X POST "${BASE_URL}/convert" \
  -H "X-API-Key: ${API_KEY}" \
  -F "file=@${INPUT_FILE}" \
  -F "output_format=${OUTPUT_FORMAT}")

JOB_ID=$(echo "$RESPONSE" | grep -o '"job_id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$JOB_ID" ]; then
  echo "Error: $RESPONSE"
  exit 1
fi

echo "Job created: ${JOB_ID}"

# Step 2: Poll for completion
while true; do
  STATUS_RESPONSE=$(curl -s "${BASE_URL}/status/${JOB_ID}" \
    -H "X-API-Key: ${API_KEY}")

  STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

  echo "Status: ${STATUS}"

  if [ "$STATUS" = "completed" ]; then
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "Conversion failed!"
    echo "$STATUS_RESPONSE"
    exit 1
  fi

  sleep 2
done

# Step 3: Download result
OUTPUT_FILE="${INPUT_FILE%.*}.${OUTPUT_FORMAT}"
curl -s -o "$OUTPUT_FILE" "${BASE_URL}/download/${JOB_ID}" \
  -H "X-API-Key: ${API_KEY}"

echo "Done! Saved to ${OUTPUT_FILE}"
