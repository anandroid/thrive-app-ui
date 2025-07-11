#!/bin/bash

# Upload secrets to Google Cloud Secret Manager
# Usage: ./scripts/upload-secrets.sh

set -e

echo "🔐 Uploading secrets to Google Cloud Secret Manager..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please create a .env.local file with your secrets."
    exit 1
fi

# Function to create or update a secret
create_or_update_secret() {
    local secret_name=$1
    local secret_value=$2
    
    # Check if secret exists
    if gcloud secrets describe "$secret_name" --project="api-project-269146618053" >/dev/null 2>&1; then
        echo "📝 Updating secret: $secret_name"
        echo -n "$secret_value" | gcloud secrets versions add "$secret_name" --data-file=- --project="api-project-269146618053"
    else
        echo "✨ Creating new secret: $secret_name"
        echo -n "$secret_value" | gcloud secrets create "$secret_name" --data-file=- --project="api-project-269146618053"
    fi
}

# Read .env.local and upload secrets
while IFS='=' read -r key value; do
    # Skip empty lines and comments
    if [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Remove quotes from value if present
    value="${value%\"}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value#\'}"
    
    # Convert to THRIVE_ prefix if not already present
    if [[ ! "$key" =~ ^THRIVE_ ]]; then
        new_key="THRIVE_$key"
    else
        new_key="$key"
    fi
    
    # Create or update the secret
    create_or_update_secret "$new_key" "$value"
    
done < .env.local

echo "✅ All secrets uploaded successfully!"

# Grant Cloud Run service access to secrets
echo "🔧 Granting Cloud Run service access to secrets..."

# Get all THRIVE_ secrets
for secret in $(gcloud secrets list --filter="name:THRIVE_" --format="value(name)" --project="api-project-269146618053"); do
    echo "🔓 Granting access to: $secret"
    gcloud secrets add-iam-policy-binding "$secret" \
        --member="serviceAccount:269146618053-compute@developer.gserviceaccount.com" \
        --role="roles/secretmanager.secretAccessor" \
        --project="api-project-269146618053" >/dev/null 2>&1
done

echo "✅ Access granted to all secrets!"
echo ""
echo "📌 To use these secrets in Cloud Run, update your service with:"
echo "   gcloud run services update thrive-app-ui \\"
echo "     --update-secrets=THRIVE_OPENAI_API_KEY=THRIVE_OPENAI_API_KEY:latest,\\"
echo "       THRIVE_CHAT_ASSISTANT_ID=THRIVE_CHAT_ASSISTANT_ID:latest,\\"
echo "       THRIVE_ROUTINE_ASSISTANT_ID=THRIVE_ROUTINE_ASSISTANT_ID:latest,\\"
echo "       THRIVE_PANTRY_ASSISTANT_ID=THRIVE_PANTRY_ASSISTANT_ID:latest \\"
echo "     --region=us-central1"