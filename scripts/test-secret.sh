#!/bin/bash

# Test if a secret is accessible and valid
# Usage: ./scripts/test-secret.sh SECRET_NAME

set -e

if [ $# -eq 0 ]; then
  echo "Usage: $0 SECRET_NAME"
  exit 1
fi

SECRET_NAME=$1
CURRENT_PROJECT=$(gcloud config get-value project)

echo "🔍 Testing secret: $SECRET_NAME"
echo "📍 Project: $CURRENT_PROJECT"
echo ""

# Check if secret exists
if ! gcloud secrets describe "$SECRET_NAME" --project="$CURRENT_PROJECT" &>/dev/null; then
  echo "❌ Secret '$SECRET_NAME' does not exist in project $CURRENT_PROJECT"
  exit 1
fi

# Get secret value
SECRET_VALUE=$(gcloud secrets versions access latest --secret="$SECRET_NAME" --project="$CURRENT_PROJECT" 2>/dev/null)

if [ -z "$SECRET_VALUE" ]; then
  echo "❌ Secret exists but has no value"
  exit 1
fi

# Basic validation based on secret type
case "$SECRET_NAME" in
  *"_API_KEY"|*"_KEY")
    if [[ ${#SECRET_VALUE} -lt 20 ]]; then
      echo "⚠️  API key seems unusually short (${#SECRET_VALUE} chars)"
    else
      echo "✅ API key format looks valid (${#SECRET_VALUE} chars)"
    fi
    ;;
    
  *"_ASSISTANT_ID")
    if [[ $SECRET_VALUE == asst_* ]]; then
      echo "✅ Assistant ID format is valid"
    else
      echo "❌ Invalid assistant ID format (should start with 'asst_')"
      exit 1
    fi
    ;;
    
  *"_URL")
    if [[ $SECRET_VALUE =~ ^https?:// ]]; then
      echo "✅ URL format is valid"
    else
      echo "❌ Invalid URL format"
      exit 1
    fi
    ;;
    
  *)
    echo "✅ Secret exists and has a value (${#SECRET_VALUE} chars)"
    ;;
esac

# Test in local environment
echo ""
echo "📝 To use in local development:"
echo "   Add to .env.local:"
echo "   $SECRET_NAME=$SECRET_VALUE"
echo ""
echo "⚠️  Note: Value shown above contains sensitive data"