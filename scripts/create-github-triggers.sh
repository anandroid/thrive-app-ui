#!/bin/bash

# Script to create GitHub-connected Cloud Build triggers

set -e

echo "Creating Cloud Build triggers for thrive-app-ui..."

# Function to check if GitHub is connected and connect if needed
check_github_connection() {
  local PROJECT_ID=$1
  echo "Checking GitHub connection for project: $PROJECT_ID"
  
  # Check if we can list triggers (this will show if GitHub is connected)
  gcloud builds triggers list --project=$PROJECT_ID --format=json | jq -r '.[].github.owner' | grep -q "anandroid" 2>/dev/null && {
    echo "✅ GitHub appears to be connected for project $PROJECT_ID"
    return 0
  } || {
    echo "❌ GitHub may not be connected. Please connect via:"
    echo "   https://console.cloud.google.com/cloud-build/triggers/connect?project=$PROJECT_ID"
    return 1
  }
}

# Function to create trigger using configuration file
create_trigger_from_config() {
  local PROJECT_ID=$1
  local CONFIG_FILE=$2
  
  echo "Creating trigger from config: $CONFIG_FILE"
  
  # Try to import the trigger
  gcloud builds triggers import --source=$CONFIG_FILE --project=$PROJECT_ID && {
    echo "✅ Successfully created trigger"
    return 0
  } || {
    echo "❌ Failed to create trigger. Error details above."
    return 1
  }
}

# Create trigger configuration for dev
cat > /tmp/trigger-dev.yaml <<'EOF'
name: thrive-app-ui-dev-main
description: Deploy to dev environment on push to main branch
filename: cloudbuild.yaml
github:
  owner: anandroid
  name: thrive-app-ui
  push:
    branch: ^main$
includedFiles:
- '**'
ignoredFiles:
- 'docs/**'
- '**.md'
- '.gitignore'
EOF

# Create trigger configuration for prod
cat > /tmp/trigger-prod.yaml <<'EOF'
name: thrive-app-ui-prod-release
description: Deploy to production environment on push to release branch
filename: cloudbuild.yaml
github:
  owner: anandroid
  name: thrive-app-ui
  push:
    branch: ^release$
includedFiles:
- '**'
ignoredFiles:
- 'docs/**'
- '**.md'
- '.gitignore'
EOF

# Check connections
echo ""
echo "=== Checking GitHub connections ==="
DEV_CONNECTED=false
PROD_CONNECTED=false

check_github_connection "thrive-dev-465922" && DEV_CONNECTED=true
check_github_connection "thrive-465618" && PROD_CONNECTED=true

# Create triggers if connections exist
echo ""
echo "=== Creating triggers ==="

if [ "$DEV_CONNECTED" = true ]; then
  echo ""
  echo "Creating DEV trigger..."
  create_trigger_from_config "thrive-dev-465922" "/tmp/trigger-dev.yaml"
else
  echo ""
  echo "⚠️  Skipping DEV trigger creation - GitHub not connected"
fi

if [ "$PROD_CONNECTED" = true ]; then
  echo ""
  echo "Creating PROD trigger..."
  create_trigger_from_config "thrive-465618" "/tmp/trigger-prod.yaml"
else
  echo ""
  echo "⚠️  Skipping PROD trigger creation - GitHub not connected"
fi

# Clean up
rm -f /tmp/trigger-dev.yaml /tmp/trigger-prod.yaml

# List triggers
echo ""
echo "=== Current triggers ==="
echo ""
echo "DEV Project (thrive-dev-465922):"
gcloud builds triggers list --project=thrive-dev-465922 --format="table(name,github.owner,github.name,github.push.branch,createTime.date())"

echo ""
echo "PROD Project (thrive-465618):"
gcloud builds triggers list --project=thrive-465618 --format="table(name,github.owner,github.name,github.push.branch,createTime.date())"

echo ""
echo "✅ Script complete!"

if [ "$DEV_CONNECTED" = false ] || [ "$PROD_CONNECTED" = false ]; then
  echo ""
  echo "⚠️  IMPORTANT: Some projects need GitHub connection!"
  echo ""
  echo "To connect GitHub and create triggers:"
  if [ "$DEV_CONNECTED" = false ]; then
    echo "1. DEV: https://console.cloud.google.com/cloud-build/triggers/connect?project=thrive-dev-465922"
  fi
  if [ "$PROD_CONNECTED" = false ]; then
    echo "2. PROD: https://console.cloud.google.com/cloud-build/triggers/connect?project=thrive-465618"
  fi
  echo ""
  echo "After connecting, run this script again to create the triggers."
fi