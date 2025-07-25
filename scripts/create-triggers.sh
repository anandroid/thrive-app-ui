#!/bin/bash

# Script to create Cloud Build triggers for thrive-app-ui

echo "Creating Cloud Build triggers for thrive-app-ui..."

# Function to create a trigger using REST API
create_trigger() {
  local PROJECT_ID=$1
  local TRIGGER_NAME=$2
  local BRANCH=$3
  local DESCRIPTION=$4
  
  echo "Creating trigger $TRIGGER_NAME for project $PROJECT_ID..."
  
  # Get access token
  ACCESS_TOKEN=$(gcloud auth application-default print-access-token)
  
  # Create trigger JSON
  cat > /tmp/trigger-${PROJECT_ID}.json <<EOF
{
  "name": "${TRIGGER_NAME}",
  "description": "${DESCRIPTION}",
  "github": {
    "owner": "anandroid",
    "name": "thrive-app-ui",
    "push": {
      "branch": "^${BRANCH}$"
    }
  },
  "filename": "cloudbuild.yaml",
  "includedFiles": ["**/*"],
  "ignoredFiles": ["docs/**", "*.md", ".gitignore"]
}
EOF

  # Create trigger via REST API
  curl -X POST \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d @/tmp/trigger-${PROJECT_ID}.json \
    "https://cloudbuild.googleapis.com/v1/projects/${PROJECT_ID}/triggers"
  
  echo ""
  rm /tmp/trigger-${PROJECT_ID}.json
}

# Create dev trigger
create_trigger "thrive-dev-465922" \
  "thrive-app-ui-dev-main" \
  "main" \
  "Deploy to dev environment on push to main branch"

# Create prod trigger
create_trigger "thrive-465618" \
  "thrive-app-ui-prod-release" \
  "release" \
  "Deploy to production environment on push to release branch"

echo "Done creating triggers!"

# List triggers to verify
echo ""
echo "=== Dev Project Triggers ==="
gcloud builds triggers list --project=thrive-dev-465922 --format="table(name,github.owner,github.name,github.push.branch)"

echo ""
echo "=== Prod Project Triggers ==="
gcloud builds triggers list --project=thrive-465618 --format="table(name,github.owner,github.name,github.push.branch)"