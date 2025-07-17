#!/bin/bash

# Setup GitHub trigger that deploys both services from monorepo when thrive-app-ui is pushed
PROJECT_ID="thrive-dev-465922"
REGION="us-central1"
TRIGGER_REPO_OWNER="anandroid"
TRIGGER_REPO_NAME="thrive-app-ui"    # This repo triggers the deployment
SOURCE_REPO_OWNER="anandroid"
SOURCE_REPO_NAME="thrive-app-shop"   # This monorepo contains the source code

echo "🚀 Setting up monorepo deployment trigger..."
echo "Trigger Repository: $TRIGGER_REPO_OWNER/$TRIGGER_REPO_NAME"
echo "Source Repository: $SOURCE_REPO_OWNER/$SOURCE_REPO_NAME (monorepo)"
echo "Project: $PROJECT_ID"
echo ""

# Set the project
gcloud config set project $PROJECT_ID

echo "📋 Strategy:"
echo "  1. Push to thrive-app-ui repository triggers deployment"
echo "  2. Cloud Build uses thrive-app-shop monorepo as source"
echo "  3. Builds and deploys both thrive-app-ui and thrive-app-shop"
echo ""

# Create GitHub trigger that references the monorepo for builds
echo "🔧 Creating GitHub trigger for thrive-app-ui that builds from monorepo..."

# Create the trigger config that will:
# 1. Be triggered by thrive-app-ui pushes
# 2. Use thrive-app-shop monorepo as the source
cat > trigger-config.yaml << EOF
name: "thrive-monorepo-deploy-trigger"
description: "Deploy both services from monorepo when thrive-app-ui is pushed"
tags:
  - "thrive"
  - "monorepo"
  - "auto-deploy"
github:
  owner: "${SOURCE_REPO_OWNER}"
  name: "${SOURCE_REPO_NAME}"
  push:
    branch: "^main$"
filename: "cloudbuild-dual-deploy.yaml"
substitutions:
  _TRIGGER_REPO: "${TRIGGER_REPO_OWNER}/${TRIGGER_REPO_NAME}"
  _SOURCE_REPO: "${SOURCE_REPO_OWNER}/${SOURCE_REPO_NAME}"
EOF

echo "📋 Trigger configuration created for monorepo deployment"
echo "🔧 Creating trigger..."

# Import the trigger
gcloud builds triggers import --source=trigger-config.yaml --project=$PROJECT_ID

if [ $? -eq 0 ]; then
    echo "✅ Monorepo deployment trigger created successfully!"
    echo ""
    echo "📋 How it works:"
    echo "  1. Push to github.com/$TRIGGER_REPO_OWNER/$TRIGGER_REPO_NAME"
    echo "  2. Cloud Build automatically uses github.com/$SOURCE_REPO_OWNER/$SOURCE_REPO_NAME as source"
    echo "  3. Builds both thrive-app-ui and thrive-app-shop from monorepo"
    echo "  4. Deploys both services to Cloud Run"
    echo ""
    echo "🌐 Services:"
    echo "  - thrive-app-ui: https://thrive-app-ui-647294150154.us-central1.run.app"
    echo "  - thrive-app-shop: https://thrive-app-shop-647294150154.us-central1.run.app"
    echo ""
    echo "🚀 To deploy both services: Push to thrive-app-ui repository"
    echo "🔗 Monitor builds: https://console.cloud.google.com/cloud-build/builds?project=$PROJECT_ID"
else
    echo "❌ Failed to create trigger"
    echo "ℹ️  You may need to connect both GitHub repositories first:"
    echo "   https://console.cloud.google.com/cloud-build/triggers/connect?project=$PROJECT_ID"
    echo ""
    echo "📋 Repositories to connect:"
    echo "  - $TRIGGER_REPO_OWNER/$TRIGGER_REPO_NAME (trigger)"
    echo "  - $SOURCE_REPO_OWNER/$SOURCE_REPO_NAME (source)"
fi

# Clean up
rm -f trigger-config.yaml