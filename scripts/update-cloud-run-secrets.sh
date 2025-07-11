#!/bin/bash

# Script to update Cloud Run service with all necessary secrets
# Usage: ./scripts/update-cloud-run-secrets.sh

set -e

SERVICE_NAME="thrive-app-ui"
REGION="us-central1"

echo "🚀 Updating Cloud Run service with secrets..."

gcloud run services update $SERVICE_NAME \
  --update-secrets=THRIVE_OPENAI_API_KEY=THRIVE_OPENAI_API_KEY:latest,\
THRIVE_GEMINI_API_KEY=THRIVE_GEMINI_API_KEY:latest,\
THRIVE_CHAT_ASSISTANT_ID=THRIVE_CHAT_ASSISTANT_ID:latest,\
THRIVE_ROUTINE_ASSISTANT_ID=THRIVE_ROUTINE_ASSISTANT_ID:latest,\
THRIVE_PANTRY_ASSISTANT_ID=THRIVE_PANTRY_ASSISTANT_ID:latest \
  --region=$REGION \
  --project="thrive-465618"

echo "✅ Cloud Run service updated with all secrets!"
echo ""
echo "🔍 To verify, run:"
echo "   gcloud run services describe $SERVICE_NAME --region=$REGION --format='get(spec.template.spec.containers[0].env)'"