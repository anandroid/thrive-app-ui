#!/bin/bash

# Script to copy Shopify secrets from current project to thrive-dev project

echo "🔄 Copying Shopify secrets to thrive-dev project..."

# List of secrets to copy
SECRETS=(
  "THRIVE_SHOPIFY_API_KEY"
  "THRIVE_SHOPIFY_API_SECRET_KEY"
  "THRIVE_SHOPIFY_STOREFRONT_API_TOKEN"
  "THRIVE_SHOPIFY_STORE_DOMAIN"
)

# Source project (current)
SOURCE_PROJECT="api-project-269146618053"

# Target project
TARGET_PROJECT="thrive-dev-465922"

# First check if we can access the target project
echo "Checking access to $TARGET_PROJECT..."
if ! gcloud projects describe $TARGET_PROJECT &>/dev/null; then
  echo "❌ Cannot access project $TARGET_PROJECT. Please ensure:"
  echo "   1. The project exists"
  echo "   2. You have permissions to access it"
  echo "   3. You're logged in with: gcloud auth login"
  exit 1
fi

# Check if Secret Manager API is enabled on target project
echo "Checking if Secret Manager API is enabled on $TARGET_PROJECT..."
if ! gcloud services list --project=$TARGET_PROJECT --filter="name:secretmanager.googleapis.com" --format="value(name)" | grep -q secretmanager; then
  echo "⚠️  Secret Manager API is not enabled on $TARGET_PROJECT"
  echo "   Enabling it now..."
  gcloud services enable secretmanager.googleapis.com --project=$TARGET_PROJECT
  sleep 5
fi

# Copy each secret
for SECRET_NAME in "${SECRETS[@]}"; do
  echo ""
  echo "📋 Processing $SECRET_NAME..."
  
  # Get the secret value from source project
  echo "   Getting value from $SOURCE_PROJECT..."
  SECRET_VALUE=$(gcloud secrets versions access latest --secret="$SECRET_NAME" --project="$SOURCE_PROJECT" 2>/dev/null)
  
  if [ $? -ne 0 ]; then
    echo "   ❌ Failed to get secret $SECRET_NAME from source project"
    continue
  fi
  
  # Check if secret already exists in target project
  if gcloud secrets describe "$SECRET_NAME" --project="$TARGET_PROJECT" &>/dev/null; then
    echo "   Secret already exists in $TARGET_PROJECT"
    echo "   Creating new version..."
    echo "$SECRET_VALUE" | gcloud secrets versions add "$SECRET_NAME" --project="$TARGET_PROJECT" --data-file=-
  else
    echo "   Creating new secret in $TARGET_PROJECT..."
    echo "$SECRET_VALUE" | gcloud secrets create "$SECRET_NAME" --project="$TARGET_PROJECT" --data-file=- --replication-policy="automatic"
  fi
  
  if [ $? -eq 0 ]; then
    echo "   ✅ Successfully copied $SECRET_NAME"
  else
    echo "   ❌ Failed to copy $SECRET_NAME"
  fi
done

echo ""
echo "🎉 Secret copy process complete!"
echo ""
echo "To verify secrets in $TARGET_PROJECT, run:"
echo "gcloud secrets list --project=$TARGET_PROJECT | grep SHOPIFY"