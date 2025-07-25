# Feed Assistant Setup Guide

This guide explains how to create and configure the Feed Assistant for the Thrive Discovery feature.

## Overview

The Feed Assistant is an OpenAI assistant that reviews user-generated posts in the Discovery/Community section to ensure they meet community guidelines before being published.

## Prerequisites

1. OpenAI API keys for both projects:
   - `THRIVE_OPENAI_API_KEY` - For production (thrive project)
   - `THRIVE_DEV_OPENAI_API_KEY` - For development (thrive-dev project)

2. Access to both OpenAI projects:
   - thrive (production)
   - thrive-dev (development)

## Step 1: Create the Feed Assistants

Run the provided script to create assistants in both projects:

```bash
# Set your API keys
export THRIVE_OPENAI_API_KEY="sk-proj-..."
export THRIVE_DEV_OPENAI_API_KEY="sk-proj-..."

# Run the creation script
node scripts/create-feed-assistant.js
```

The script will:
1. Create a Feed Assistant in the thrive project
2. Create a Feed Assistant in the thrive-dev project
3. Output the assistant IDs for both

## Step 2: Update Environment Variables

### Local Development (.env.local)

Add the assistant IDs to your `.env.local` file:

```bash
# Feed Assistant IDs
THRIVE_FEED_ASSISTANT_ID="asst_..."     # From thrive project
THRIVE_DEV_FEED_ASSISTANT_ID="asst_..." # From thrive-dev project
```

### Google Cloud Secret Manager

Upload the assistant IDs to Google Cloud:

```bash
# For production (thrive project)
echo -n "asst_..." | gcloud secrets create THRIVE_FEED_ASSISTANT_ID --data-file=- --project=thrive

# For development (thrive-dev project)
echo -n "asst_..." | gcloud secrets create THRIVE_DEV_FEED_ASSISTANT_ID --data-file=- --project=thrive-dev
```

Grant Cloud Run access to the secrets:

```bash
# For thrive project
gcloud secrets add-iam-policy-binding THRIVE_FEED_ASSISTANT_ID \
  --member="serviceAccount:YOUR-SERVICE-ACCOUNT@thrive.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=thrive

# For thrive-dev project
gcloud secrets add-iam-policy-binding THRIVE_DEV_FEED_ASSISTANT_ID \
  --member="serviceAccount:YOUR-SERVICE-ACCOUNT@thrive-dev.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=thrive-dev
```

## Step 3: Deploy

After setting up the environment variables:

1. **For local development**: Restart your dev server
2. **For production**: Deploy to Cloud Run and it will pick up the new secrets

## How It Works

1. User creates a post on `/discover/create`
2. Post is submitted to the API with "pending" status
3. Feed Assistant reviews the post content in the background
4. Progress bar shows on the Discover page while review is happening
5. Once approved/rejected, user sees a toast notification
6. Approved posts appear in the community feed

## Testing

To test the Feed Assistant:

1. Create a test post with appropriate wellness content
2. Watch the progress bar on the Discover page
3. Verify the post appears after approval
4. Try creating a post that violates guidelines to test rejection

## Troubleshooting

### Assistant Not Found
- Verify the assistant IDs are correctly set in environment variables
- Check that the API keys have access to the assistants

### Slow Reviews
- The assistant typically takes 5-10 seconds to review
- If taking longer, check OpenAI API status

### Always Approving/Rejecting
- Review the assistant instructions in `src/assistants/instructions/feedAssistantInstructions.ts`
- Consider adjusting the temperature or instructions

## Manual Review (If Needed)

If the assistant is unavailable, the system will fall back to:
1. Direct GPT-4 API calls with the same instructions
2. Auto-approval after timeout (configurable)