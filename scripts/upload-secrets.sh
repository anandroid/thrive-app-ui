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
    if gcloud secrets describe "$secret_name" --project="thrive-465618" >/dev/null 2>&1; then
        echo "📝 Updating secret: $secret_name"
        echo -n "$secret_value" | gcloud secrets versions add "$secret_name" --data-file=- --project="thrive-465618"
    else
        echo "✨ Creating new secret: $secret_name"
        echo -n "$secret_value" | gcloud secrets create "$secret_name" --data-file=- --project="thrive-465618"
    fi
}

# Read .env.local and upload secrets
while IFS='=' read -r key value; do
    # Skip empty lines and comments
    if [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Handle multi-line values (like private keys)
    if [[ $value == \"* ]]; then
        # Multi-line value starting with quote
        full_value=$value
        while IFS= read -r line && [[ ! $line == *\" ]]; do
            full_value="${full_value}
${line}"
        done
        full_value="${full_value}
${line}"
        # Remove surrounding quotes
        value="${full_value%\"}"
        value="${value#\"}"
    else
        # Remove quotes from value if present
        value="${value%\"}"
        value="${value#\"}"
        value="${value%\'}"
        value="${value#\'}"
    fi
    
    # Skip placeholder values
    if [[ "$value" == "..." || "$value" == "sk-..." || "$value" == "asst_..." || "$value" == "{}" ]]; then
        continue
    fi
    
    # Handle different types of secrets
    if [[ "$key" == "OPENAI_API_KEY" ]]; then
        # Keep OPENAI_API_KEY as-is for SDK compatibility
        create_or_update_secret "$key" "$value"
    elif [[ "$key" =~ ^NEXT_PUBLIC_FIREBASE_ ]]; then
        # Upload Firebase public config as-is
        create_or_update_secret "$key" "$value"
    elif [[ "$key" =~ ^FIREBASE_ ]]; then
        # Upload Firebase admin config as-is
        create_or_update_secret "$key" "$value"
    elif [[ "$key" =~ ^THRIVE_ ]]; then
        # Upload THRIVE_ prefixed secrets as-is
        create_or_update_secret "$key" "$value"
    fi
    
done < .env.local

echo "✅ All secrets uploaded successfully!"

# Upload Firebase service account JSON if it exists
if [ -f "thrive-465618-firebase-adminsdk-fbsvc-57bc407cdc.json" ]; then
    echo "📄 Uploading Firebase service account JSON..."
    create_or_update_secret "FIREBASE_SERVICE_ACCOUNT_JSON" "$(cat thrive-465618-firebase-adminsdk-fbsvc-57bc407cdc.json)"
fi

# Grant Cloud Run service access to secrets
echo "🔧 Granting Cloud Run service access to secrets..."

# Get all relevant secrets
for secret in $(gcloud secrets list --filter="name ~ ^THRIVE_ OR name ~ ^FIREBASE_ OR name ~ ^NEXT_PUBLIC_FIREBASE_ OR name = OPENAI_API_KEY" --format="value(name)" --project="thrive-465618"); do
    echo "🔓 Granting access to: $secret"
    gcloud secrets add-iam-policy-binding "$secret" \
        --member="serviceAccount:689752906332-compute@developer.gserviceaccount.com" \
        --role="roles/secretmanager.secretAccessor" \
        --project="thrive-465618" >/dev/null 2>&1
done

echo "✅ Access granted to all secrets!"
echo ""
echo "📌 To use these secrets in Cloud Run, update your service with:"
echo "   gcloud run services update thrive-app-ui \\"
echo "     --update-secrets=THRIVE_OPENAI_API_KEY=THRIVE_OPENAI_API_KEY:latest,\\"
echo "       OPENAI_API_KEY=OPENAI_API_KEY:latest,\\"
echo "       THRIVE_CHAT_ASSISTANT_ID=THRIVE_CHAT_ASSISTANT_ID:latest,\\"
echo "       THRIVE_ROUTINE_ASSISTANT_ID=THRIVE_ROUTINE_ASSISTANT_ID:latest,\\"
echo "       THRIVE_PANTRY_ASSISTANT_ID=THRIVE_PANTRY_ASSISTANT_ID:latest,\\"
echo "       NEXT_PUBLIC_FIREBASE_API_KEY=NEXT_PUBLIC_FIREBASE_API_KEY:latest,\\"
echo "       NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:latest,\\"
echo "       NEXT_PUBLIC_FIREBASE_PROJECT_ID=NEXT_PUBLIC_FIREBASE_PROJECT_ID:latest,\\"
echo "       NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:latest,\\"
echo "       NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:latest,\\"
echo "       NEXT_PUBLIC_FIREBASE_APP_ID=NEXT_PUBLIC_FIREBASE_APP_ID:latest,\\"
echo "       FIREBASE_PROJECT_ID=FIREBASE_PROJECT_ID:latest,\\"
echo "       FIREBASE_ADMIN_CLIENT_EMAIL=FIREBASE_ADMIN_CLIENT_EMAIL:latest,\\"
echo "       FIREBASE_ADMIN_PRIVATE_KEY=FIREBASE_ADMIN_PRIVATE_KEY:latest \\"
echo "     --region=us-central1"
echo ""
echo "   Or if using the service account JSON:"
echo "   gcloud run services update thrive-app-ui \\"
echo "     --set-env-vars=FIREBASE_SERVICE_ACCOUNT_KEY=\"\$(gcloud secrets versions access latest --secret=FIREBASE_SERVICE_ACCOUNT_JSON)\" \\"
echo "     --region=us-central1"