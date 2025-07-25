#!/bin/bash

# Script to set up Cloud Build triggers for thrive-app-ui
# This script creates webhook-based triggers that can be connected to GitHub

set -e

echo "Setting up Cloud Build triggers for thrive-app-ui..."

# Function to create a webhook trigger
create_webhook_trigger() {
  local PROJECT_ID=$1
  local TRIGGER_NAME=$2
  local BRANCH=$3
  local DESCRIPTION=$4
  
  echo ""
  echo "Creating webhook trigger for project: $PROJECT_ID"
  echo "Trigger name: $TRIGGER_NAME"
  echo "Branch: $BRANCH"
  
  # Create the webhook trigger
  gcloud builds triggers create webhook \
    --name="${TRIGGER_NAME}" \
    --substitutions="_BRANCH=${BRANCH}" \
    --build-config="cloudbuild.yaml" \
    --project="${PROJECT_ID}" \
    --description="${DESCRIPTION}" \
    --secret="projects/${PROJECT_ID}/secrets/github-webhook-secret" 2>/dev/null || {
      echo "Note: Webhook secret 'github-webhook-secret' not found. Creating without secret."
      gcloud builds triggers create webhook \
        --name="${TRIGGER_NAME}" \
        --substitutions="_BRANCH=${BRANCH}" \
        --build-config="cloudbuild.yaml" \
        --project="${PROJECT_ID}" \
        --description="${DESCRIPTION}"
    }
  
  # Get the webhook URL
  WEBHOOK_URL=$(gcloud builds triggers describe ${TRIGGER_NAME} --project=${PROJECT_ID} --format="value(webhookConfig.url)")
  echo "Webhook URL: ${WEBHOOK_URL}"
  echo "Save this URL to configure in GitHub repository settings"
  echo ""
}

# Function to create GitHub-connected trigger (if GitHub app is connected)
create_github_trigger() {
  local PROJECT_ID=$1
  local TRIGGER_NAME=$2
  local BRANCH=$3
  local DESCRIPTION=$4
  
  echo ""
  echo "Attempting to create GitHub-connected trigger for project: $PROJECT_ID"
  
  # First, let's check if we can see any GitHub connections
  echo "Checking for existing GitHub connections..."
  
  # Create a trigger configuration file
  cat > /tmp/trigger-${PROJECT_ID}-${BRANCH}.yaml <<EOF
name: ${TRIGGER_NAME}
description: ${DESCRIPTION}
filename: cloudbuild.yaml
github:
  owner: anandroid
  name: thrive-app-ui
  push:
    branch: ^${BRANCH}$
includedFiles:
- '**'
ignoredFiles:
- 'docs/**'
- '**.md'
- '.gitignore'
EOF

  # Try to import the trigger
  gcloud builds triggers import --source=/tmp/trigger-${PROJECT_ID}-${BRANCH}.yaml --project=${PROJECT_ID} 2>/dev/null && {
    echo "✅ Successfully created GitHub trigger: ${TRIGGER_NAME}"
    rm /tmp/trigger-${PROJECT_ID}-${BRANCH}.yaml
    return 0
  } || {
    echo "❌ Could not create GitHub trigger. GitHub app may not be connected."
    echo "   Creating webhook trigger as fallback..."
    rm /tmp/trigger-${PROJECT_ID}-${BRANCH}.yaml
    return 1
  }
}

# Enable Cloud Build API if not already enabled
echo "Enabling Cloud Build API..."
gcloud services enable cloudbuild.googleapis.com --project=thrive-dev-465922
gcloud services enable cloudbuild.googleapis.com --project=thrive-465618

# Create triggers for dev environment
echo ""
echo "=== Setting up DEV environment trigger ==="
create_github_trigger "thrive-dev-465922" \
  "thrive-app-ui-dev-main" \
  "main" \
  "Deploy to dev environment on push to main branch" || \
create_webhook_trigger "thrive-dev-465922" \
  "thrive-app-ui-dev-webhook" \
  "main" \
  "Webhook trigger for dev deployment (connect to GitHub)"

# Create triggers for prod environment
echo ""
echo "=== Setting up PROD environment trigger ==="
create_github_trigger "thrive-465618" \
  "thrive-app-ui-prod-release" \
  "release" \
  "Deploy to production environment on push to release branch" || \
create_webhook_trigger "thrive-465618" \
  "thrive-app-ui-prod-webhook" \
  "release" \
  "Webhook trigger for prod deployment (connect to GitHub)"

# List all triggers
echo ""
echo "=== Current triggers in DEV project ==="
gcloud builds triggers list --project=thrive-dev-465922 --format="table(name,description)"

echo ""
echo "=== Current triggers in PROD project ==="
gcloud builds triggers list --project=thrive-465618 --format="table(name,description)"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. If webhook triggers were created, configure the webhook URLs in your GitHub repository settings"
echo "2. If GitHub triggers failed, connect your GitHub account via Cloud Console:"
echo "   - Dev: https://console.cloud.google.com/cloud-build/triggers/connect?project=thrive-dev-465922"
echo "   - Prod: https://console.cloud.google.com/cloud-build/triggers/connect?project=thrive-465618"
echo "3. Test the triggers by pushing to the respective branches"