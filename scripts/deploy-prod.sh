#!/bin/bash

# Manual deployment script for PRODUCTION environment
# Use this if Cloud Build triggers are not set up

set -e

echo "🚀 Deploying thrive-app-ui to PRODUCTION environment..."

# Set project
PROJECT_ID="thrive-465618"
gcloud config set project $PROJECT_ID

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" != "release" ]; then
  echo "⚠️  ERROR: You are not on the release branch (current: $CURRENT_BRANCH)"
  echo "   Production deployments MUST be from the release branch."
  echo ""
  echo "   To deploy to production:"
  echo "   1. git checkout release"
  echo "   2. git merge main"
  echo "   3. git push origin release"
  echo "   4. Run this script again"
  exit 1
fi

# Double confirmation for production
echo "⚠️  WARNING: You are about to deploy to PRODUCTION!"
echo "   This will affect all live users."
echo ""
read -p "   Type 'DEPLOY TO PRODUCTION' to continue: " CONFIRMATION

if [ "$CONFIRMATION" != "DEPLOY TO PRODUCTION" ]; then
  echo "Deployment cancelled."
  exit 1
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

echo "✅ Deployment to PRODUCTION complete!"
echo ""
echo "🔗 Service URL: https://app.thrive.health"
echo "📊 View logs: https://console.cloud.google.com/run/detail/us-central1/thrive-app-ui/logs?project=$PROJECT_ID"