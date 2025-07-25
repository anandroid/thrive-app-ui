#!/bin/bash

# Script to migrate THRIVE_DEV_FEED_ASSISTANT_ID to THRIVE_FEED_ASSISTANT_ID in dev project

echo "Migrating Feed Assistant secret in dev project..."

# Get the current value from THRIVE_DEV_FEED_ASSISTANT_ID
echo "Fetching current THRIVE_DEV_FEED_ASSISTANT_ID value..."
FEED_ASSISTANT_ID=$(gcloud secrets versions access latest --secret=THRIVE_DEV_FEED_ASSISTANT_ID --project=thrive-dev-465922 2>/dev/null)

if [ -z "$FEED_ASSISTANT_ID" ]; then
    echo "ERROR: THRIVE_DEV_FEED_ASSISTANT_ID not found in dev project"
    exit 1
fi

echo "Found Feed Assistant ID: ${FEED_ASSISTANT_ID:0:20}..."

# Create or update THRIVE_FEED_ASSISTANT_ID with the same value
echo "Creating/updating THRIVE_FEED_ASSISTANT_ID in dev project..."
echo -n "$FEED_ASSISTANT_ID" | gcloud secrets create THRIVE_FEED_ASSISTANT_ID --data-file=- --project=thrive-dev-465922 2>/dev/null || \
echo -n "$FEED_ASSISTANT_ID" | gcloud secrets versions add THRIVE_FEED_ASSISTANT_ID --data-file=- --project=thrive-dev-465922

if [ $? -eq 0 ]; then
    echo "✅ Successfully migrated to THRIVE_FEED_ASSISTANT_ID"
    
    echo ""
    echo "Next steps:"
    echo "1. Update your local .env.local file to use THRIVE_FEED_ASSISTANT_ID"
    echo "2. Update any code references from THRIVE_DEV_FEED_ASSISTANT_ID to THRIVE_FEED_ASSISTANT_ID"
    echo "3. After confirming everything works, you can delete THRIVE_DEV_FEED_ASSISTANT_ID with:"
    echo "   gcloud secrets delete THRIVE_DEV_FEED_ASSISTANT_ID --project=thrive-dev-465922"
else
    echo "❌ Failed to create/update THRIVE_FEED_ASSISTANT_ID"
    exit 1
fi