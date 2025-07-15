#!/bin/bash

# Setup GitHub trigger for thrive-app-ui auto-deployment
PROJECT_ID="thrive-dev-465922"
REGION="us-central1"
REPO_OWNER="anandroid"
REPO_NAME="thrive-app-ui"

echo "🚀 Setting up GitHub trigger for thrive-app-ui auto-deployment..."
echo "Project: $PROJECT_ID"
echo "Repository: $REPO_OWNER/$REPO_NAME"
echo ""

# Set the project
gcloud config set project $PROJECT_ID

echo "🔧 Creating GitHub trigger for thrive-app-ui..."
echo "When you push to $REPO_NAME main branch, it will auto-deploy thrive-app-ui"
echo ""

# Create GitHub trigger using cloudbuild-simple.yaml
gcloud builds triggers create github \
    --repo-name=$REPO_NAME \
    --repo-owner=$REPO_OWNER \
    --branch-pattern='^main$' \
    --build-config=cloudbuild-simple.yaml \
    --name="thrive-app-ui-auto-deploy" \
    --description="Auto-deploy thrive-app-ui on push to main branch" \
    --project=$PROJECT_ID

if [ $? -eq 0 ]; then
    echo "✅ GitHub trigger created successfully!"
    echo ""
    echo "📋 Auto-deployment setup complete:"
    echo "  • Push to thrive-app-ui repository main branch"
    echo "  • Automatically deploys to: https://thrive-app-ui-647294150154.us-central1.run.app"
    echo "  • Shop service: https://thrive-app-shop-647294150154.us-central1.run.app (already deployed)"
    echo ""
    echo "🚀 To test: git push origin main"
    echo "🔗 Monitor builds: https://console.cloud.google.com/cloud-build/builds?project=$PROJECT_ID"
    echo ""
    echo "🎯 Final result: Pushing to thrive-app-ui will auto-deploy the main app!"
    echo "   (Shop service is already deployed and running separately)"
else
    echo "❌ Failed to create GitHub trigger"
    echo "ℹ️  You may need to connect the GitHub repository first:"
    echo "   https://console.cloud.google.com/cloud-build/triggers/connect?project=$PROJECT_ID"
    echo ""
    echo "📋 Manual deployment is working:"
    echo "   gcloud builds submit --config=cloudbuild-simple.yaml --project=$PROJECT_ID"
fi