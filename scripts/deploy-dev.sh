#!/bin/bash

# Manual deployment script for DEV environment
# Use this if Cloud Build triggers are not set up

set -e

echo "🚀 Deploying thrive-app-ui to DEV environment..."

# Set project
PROJECT_ID="thrive-dev-465922"
gcloud config set project $PROJECT_ID

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "⚠️  Warning: You are not on the main branch (current: $CURRENT_BRANCH)"
  echo "   Dev deployments should typically be from the main branch."
  read -p "   Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
  fi
fi

# Get commit hash for build ID
COMMIT_HASH=$(git rev-parse --short HEAD)
BUILD_ID="manual-${COMMIT_HASH}-$(date +%Y%m%d%H%M%S)"

echo "📦 Build ID: $BUILD_ID"
echo "🔄 Starting Cloud Build..."

# Submit build
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=$PROJECT_ID \
  --substitutions="_BUILD_ID=${BUILD_ID}" \
  .

echo "✅ Deployment to DEV complete!"
echo ""
echo "🔗 Service URL: https://thrive-app-ui-tjb75ol4sq-uc.a.run.app"
echo "📊 View logs: https://console.cloud.google.com/run/detail/us-central1/thrive-app-ui/logs?project=$PROJECT_ID"