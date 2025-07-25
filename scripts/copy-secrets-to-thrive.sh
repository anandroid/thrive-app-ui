#!/bin/bash

# Script to copy missing Shopify secrets to main thrive project

echo "🔄 Copying missing Shopify secrets to thrive project..."

# Source project (current)
SOURCE_PROJECT="api-project-269146618053"

# Target project
TARGET_PROJECT="thrive-465618"

# Check for THRIVE_SHOPIFY_STORE_DOMAIN
echo "📋 Processing THRIVE_SHOPIFY_STORE_DOMAIN..."

# Get the secret value from source project
SECRET_VALUE=$(gcloud secrets versions access latest --secret="THRIVE_SHOPIFY_STORE_DOMAIN" --project="$SOURCE_PROJECT" 2>/dev/null)

if [ $? -ne 0 ]; then
  echo "   ❌ Failed to get secret from source project"
  exit 1
fi

# Check if secret already exists in target project
if gcloud secrets describe "THRIVE_SHOPIFY_STORE_DOMAIN" --project="$TARGET_PROJECT" &>/dev/null; then
  echo "   Secret already exists in $TARGET_PROJECT"
  echo "   Creating new version..."
  echo "$SECRET_VALUE" | gcloud secrets versions add "THRIVE_SHOPIFY_STORE_DOMAIN" --project="$TARGET_PROJECT" --data-file=-
else
  echo "   Creating new secret in $TARGET_PROJECT..."
  echo "$SECRET_VALUE" | gcloud secrets create "THRIVE_SHOPIFY_STORE_DOMAIN" --project="$TARGET_PROJECT" --data-file=- --replication-policy="automatic"
fi

if [ $? -eq 0 ]; then
  echo "   ✅ Successfully copied THRIVE_SHOPIFY_STORE_DOMAIN"
else
  echo "   ❌ Failed to copy THRIVE_SHOPIFY_STORE_DOMAIN"
fi

echo ""
echo "🎉 Done! All Shopify secrets should now be available in all projects."
echo ""
echo "Verify with:"
echo "gcloud secrets list --project=$TARGET_PROJECT | grep SHOPIFY"