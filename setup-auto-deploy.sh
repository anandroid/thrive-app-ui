#!/bin/bash

# Setup auto-deployment from thrive-app-ui repository
# This will deploy both thrive-app-ui and trigger thrive-app-shop deployment

PROJECT_ID="thrive-dev-465922"
REGION="us-central1"
REPO_OWNER="anandroid"
REPO_NAME="thrive-app-ui"

echo "🚀 Setting up auto-deployment for thrive-app-ui repository..."
echo "Project: $PROJECT_ID"
echo "Repository: $REPO_OWNER/$REPO_NAME"
echo ""

# Set the project
gcloud config set project $PROJECT_ID

# First, we need to create the shop trigger (if it doesn't exist)
echo "🏪 Creating shop deployment trigger first..."
gcloud builds triggers create github \
    --repo-name=thrive-app-shop \
    --repo-owner=anandroid \
    --branch-pattern='^main$' \
    --build-config=cloudbuild-shop-only.yaml \
    --name="thrive-shop-monorepo-deploy" \
    --description="Deploy thrive-app-shop from monorepo" \
    --project=$PROJECT_ID \
    --quiet 2>/dev/null || echo "Shop trigger already exists or failed to create"

# Create the main auto-deployment trigger
echo "🔧 Creating auto-deployment trigger for thrive-app-ui..."
gcloud builds triggers create github \
    --repo-name=$REPO_NAME \
    --repo-owner=$REPO_OWNER \
    --branch-pattern='^main$' \
    --build-config=cloudbuild-auto-deploy.yaml \
    --name="thrive-app-ui-auto-deploy" \
    --description="Auto-deploy thrive-app-ui and trigger shop deployment" \
    --project=$PROJECT_ID

if [ $? -eq 0 ]; then
    echo "✅ Auto-deployment trigger created successfully!"
    echo ""
    echo "📋 How it works:"
    echo "  1. You push to thrive-app-ui repository (this one)"
    echo "  2. Cloud Build automatically deploys thrive-app-ui"
    echo "  3. Cloud Build then triggers thrive-app-shop deployment"
    echo "  4. Both services get updated!"
    echo ""
    echo "🌐 Services:"
    echo "  - thrive-app-ui: https://thrive-app-ui-647294150154.us-central1.run.app"
    echo "  - thrive-app-shop: https://thrive-app-shop-647294150154.us-central1.run.app"
    echo ""
    echo "🚀 To deploy both services: git push origin main"
    echo "🔗 Monitor builds: https://console.cloud.google.com/cloud-build/builds?project=$PROJECT_ID"
else
    echo "❌ Failed to create auto-deployment trigger"
    echo "ℹ️  You may need to connect the GitHub repository first:"
    echo "   https://console.cloud.google.com/cloud-build/triggers/connect?project=$PROJECT_ID"
fi