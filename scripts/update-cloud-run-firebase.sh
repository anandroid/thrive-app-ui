#!/bin/bash

# Update Cloud Run service with Firebase secrets
# Usage: ./scripts/update-cloud-run-firebase.sh

set -e

SERVICE_NAME="thrive-app-ui"
REGION="us-central1"
PROJECT_ID="thrive-465618"

echo "🚀 Updating Cloud Run service with Firebase configuration..."

# Update the service with Firebase secrets (only those that exist)
gcloud run services update $SERVICE_NAME \
  --project=$PROJECT_ID \
  --region=$REGION \
  --update-secrets=\
THRIVE_OPENAI_API_KEY=THRIVE_OPENAI_API_KEY:latest,\
OPENAI_API_KEY=OPENAI_API_KEY:latest,\
THRIVE_CHAT_ASSISTANT_ID=THRIVE_CHAT_ASSISTANT_ID:latest,\
THRIVE_ROUTINE_ASSISTANT_ID=THRIVE_ROUTINE_ASSISTANT_ID:latest,\
THRIVE_PANTRY_ASSISTANT_ID=THRIVE_PANTRY_ASSISTANT_ID:latest,\
NEXT_PUBLIC_FIREBASE_API_KEY=NEXT_PUBLIC_FIREBASE_API_KEY:latest,\
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:latest,\
NEXT_PUBLIC_FIREBASE_PROJECT_ID=NEXT_PUBLIC_FIREBASE_PROJECT_ID:latest,\
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:latest,\
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:latest,\
NEXT_PUBLIC_FIREBASE_APP_ID=NEXT_PUBLIC_FIREBASE_APP_ID:latest,\
FIREBASE_PROJECT_ID=FIREBASE_PROJECT_ID:latest,\
FIREBASE_ADMIN_CLIENT_EMAIL=FIREBASE_ADMIN_CLIENT_EMAIL:latest,\
FIREBASE_SERVICE_ACCOUNT_JSON=FIREBASE_SERVICE_ACCOUNT_JSON:latest \
  --set-env-vars=NODE_ENV=production

echo "✅ Cloud Run service updated successfully!"
echo ""
echo "🔍 View your service:"
echo "   https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/metrics?project=$PROJECT_ID"
echo ""
echo "🌐 Service URL:"
gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format="value(status.url)"