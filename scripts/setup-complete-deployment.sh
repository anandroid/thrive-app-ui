#!/bin/bash

# Complete deployment setup script for thrive-app-ui
# This script handles the entire deployment pipeline setup

set -e

echo "🚀 Complete Deployment Setup for thrive-app-ui"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
  if [ "$1" = "success" ]; then
    echo -e "${GREEN}✅ $2${NC}"
  elif [ "$1" = "error" ]; then
    echo -e "${RED}❌ $2${NC}"
  elif [ "$1" = "warning" ]; then
    echo -e "${YELLOW}⚠️  $2${NC}"
  else
    echo "$2"
  fi
}

# Function to check prerequisites
check_prerequisites() {
  echo "📋 Checking prerequisites..."
  
  # Check gcloud CLI
  if ! command -v gcloud &> /dev/null; then
    print_status "error" "gcloud CLI not found. Please install Google Cloud SDK."
    exit 1
  fi
  
  # Check git
  if ! command -v git &> /dev/null; then
    print_status "error" "git not found. Please install git."
    exit 1
  fi
  
  # Check if in git repository
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_status "error" "Not in a git repository. Please run from thrive-app directory."
    exit 1
  fi
  
  print_status "success" "All prerequisites met"
}

# Function to check project access
check_project_access() {
  local PROJECT_ID=$1
  echo ""
  echo "Checking access to project: $PROJECT_ID"
  
  if gcloud projects describe $PROJECT_ID &> /dev/null; then
    print_status "success" "Access confirmed for $PROJECT_ID"
    return 0
  else
    print_status "error" "No access to project $PROJECT_ID"
    return 1
  fi
}

# Function to enable required APIs
enable_apis() {
  local PROJECT_ID=$1
  echo ""
  echo "Enabling required APIs for $PROJECT_ID..."
  
  gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID
  gcloud services enable run.googleapis.com --project=$PROJECT_ID
  gcloud services enable artifactregistry.googleapis.com --project=$PROJECT_ID
  gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID
  
  print_status "success" "APIs enabled"
}

# Function to create GitHub trigger config
create_trigger_config() {
  local PROJECT_ID=$1
  local BRANCH=$2
  local ENV=$3
  
  cat > /tmp/trigger-$ENV.yaml <<EOF
name: thrive-app-ui-${ENV}-${BRANCH}
description: Deploy to ${ENV} environment on push to ${BRANCH} branch
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
- 'scripts/**'
EOF
}

# Main setup process
main() {
  check_prerequisites
  
  echo ""
  echo "🔍 Checking project access..."
  
  DEV_ACCESS=false
  PROD_ACCESS=false
  
  check_project_access "thrive-dev-465922" && DEV_ACCESS=true
  check_project_access "thrive-465618" && PROD_ACCESS=true
  
  if [ "$DEV_ACCESS" = false ] && [ "$PROD_ACCESS" = false ]; then
    print_status "error" "No access to any projects. Please check your gcloud authentication."
    exit 1
  fi
  
  # Enable APIs
  if [ "$DEV_ACCESS" = true ]; then
    enable_apis "thrive-dev-465922"
  fi
  
  if [ "$PROD_ACCESS" = true ]; then
    enable_apis "thrive-465618"
  fi
  
  # Make deployment scripts executable
  echo ""
  echo "📝 Setting up manual deployment scripts..."
  chmod +x scripts/deploy-dev.sh 2>/dev/null || true
  chmod +x scripts/deploy-prod.sh 2>/dev/null || true
  chmod +x scripts/create-github-triggers.sh 2>/dev/null || true
  print_status "success" "Manual deployment scripts ready"
  
  # Create trigger configs
  echo ""
  echo "📄 Creating trigger configurations..."
  create_trigger_config "thrive-dev-465922" "main" "dev"
  create_trigger_config "thrive-465618" "release" "prod"
  print_status "success" "Trigger configurations created"
  
  # Summary
  echo ""
  echo "========================================"
  echo "📊 DEPLOYMENT SETUP SUMMARY"
  echo "========================================"
  echo ""
  
  if [ "$DEV_ACCESS" = true ]; then
    echo "✅ DEV Environment (thrive-dev-465922):"
    echo "   - APIs enabled"
    echo "   - Manual deployment: ./scripts/deploy-dev.sh"
    echo "   - Trigger config: /tmp/trigger-dev.yaml"
  else
    echo "❌ DEV Environment: No access"
  fi
  
  echo ""
  
  if [ "$PROD_ACCESS" = true ]; then
    echo "✅ PROD Environment (thrive-465618):"
    echo "   - APIs enabled"
    echo "   - Manual deployment: ./scripts/deploy-prod.sh"
    echo "   - Trigger config: /tmp/trigger-prod.yaml"
  else
    echo "❌ PROD Environment: No access"
  fi
  
  echo ""
  echo "========================================"
  echo "📌 NEXT STEPS"
  echo "========================================"
  echo ""
  echo "1. FOR AUTOMATED DEPLOYMENTS (Recommended):"
  echo "   a. Connect GitHub to Cloud Build:"
  if [ "$DEV_ACCESS" = true ]; then
    echo "      - DEV: https://console.cloud.google.com/cloud-build/triggers/connect?project=thrive-dev-465922"
  fi
  if [ "$PROD_ACCESS" = true ]; then
    echo "      - PROD: https://console.cloud.google.com/cloud-build/triggers/connect?project=thrive-465618"
  fi
  echo ""
  echo "   b. After connecting, run: ./scripts/create-github-triggers.sh"
  echo ""
  echo "2. FOR MANUAL DEPLOYMENTS:"
  echo "   - Deploy to DEV: ./scripts/deploy-dev.sh"
  echo "   - Deploy to PROD: ./scripts/deploy-prod.sh"
  echo ""
  echo "3. CURRENT DEPLOYMENT URLS:"
  echo "   - DEV: https://thrive-app-ui-tjb75ol4sq-uc.a.run.app"
  echo "   - PROD: https://app.thrive.health"
  echo ""
  print_status "success" "Setup complete!"
}

# Run main function
main