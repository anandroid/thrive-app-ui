# Complete Deployment Guide for Thrive App UI

## Overview

This guide covers the complete deployment setup for the Thrive App UI, including both automated (Cloud Build triggers) and manual deployment options.

## Architecture

- **Development Environment**: `thrive-dev-465922` (deploys from `main` branch)
- **Production Environment**: `thrive-465618` (deploys from `release` branch)
- **Deployment Method**: Google Cloud Run via Cloud Build
- **Container Registry**: Artifact Registry

## Prerequisites

1. **Google Cloud SDK** installed and authenticated
2. **Git** installed
3. Access to at least one of the Google Cloud projects
4. Repository cloned locally

## Quick Start

### Option 1: Automated Setup (Recommended)

Run the complete setup script:

```bash
./scripts/setup-complete-deployment.sh
```

This script will:
- Check prerequisites and project access
- Enable required APIs
- Set up manual deployment scripts
- Create trigger configurations
- Provide next steps for GitHub integration

### Option 2: Manual Deployment

For immediate deployment without setting up triggers:

```bash
# Deploy to development
./scripts/deploy-dev.sh

# Deploy to production (must be on release branch)
./scripts/deploy-prod.sh
```

## Detailed Setup Instructions

### 1. Enable Required APIs

For each project, enable:
- Cloud Build API
- Cloud Run API
- Artifact Registry API
- Secret Manager API

```bash
# For dev
gcloud services enable cloudbuild.googleapis.com run.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com \
  --project=thrive-dev-465922

# For prod
gcloud services enable cloudbuild.googleapis.com run.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com \
  --project=thrive-465618
```

### 2. Set Up GitHub Integration (For Automated Deployments)

1. **Connect GitHub to Cloud Build**:
   - Dev: https://console.cloud.google.com/cloud-build/triggers/connect?project=thrive-dev-465922
   - Prod: https://console.cloud.google.com/cloud-build/triggers/connect?project=thrive-465618

2. **Authorize the Cloud Build GitHub App**:
   - Click "Connect" in the Cloud Console
   - Select "GitHub (Cloud Build GitHub App)"
   - Authorize access to your GitHub account
   - Select the `anandroid/thrive-app-ui` repository

3. **Create Triggers**:
   After connecting GitHub, run:
   ```bash
   ./scripts/create-github-triggers.sh
   ```

### 3. Cloud Build Configuration

The `cloudbuild.yaml` file is configured to:
1. Build Docker image
2. Push to Artifact Registry
3. Deploy to Cloud Run with environment-specific secrets

Key features:
- Automatic project detection
- Environment-specific secret management
- Consistent naming across environments

### 4. Environment Variables

All environment variables use the same names across dev/prod:
- `THRIVE_CHAT_ASSISTANT_ID`
- `THRIVE_ROUTINE_ASSISTANT_ID`
- `THRIVE_PANTRY_ASSISTANT_ID`
- `THRIVE_RECOMMENDATION_ASSISTANT_ID`
- `THRIVE_FEED_ASSISTANT_ID` (previously had different names)

Each project has its own secret values in Google Secret Manager.

## Deployment Workflows

### Development Deployment

1. **Automated** (with triggers):
   ```bash
   git checkout main
   git pull origin main
   # Make changes
   git add .
   git commit -m "feat: your feature"
   git push origin main
   # Deployment triggers automatically
   ```

2. **Manual**:
   ```bash
   git checkout main
   ./scripts/deploy-dev.sh
   ```

### Production Deployment

1. **Automated** (with triggers):
   ```bash
   git checkout release
   git merge main
   git push origin release
   # Deployment triggers automatically
   ```

2. **Manual**:
   ```bash
   git checkout release
   git merge main
   ./scripts/deploy-prod.sh
   ```

## Service URLs

- **Development**: https://thrive-app-ui-tjb75ol4sq-uc.a.run.app
- **Production**: https://app.thrive.health

## Monitoring and Logs

### View Deployment Status
- Dev: https://console.cloud.google.com/cloud-build/builds?project=thrive-dev-465922
- Prod: https://console.cloud.google.com/cloud-build/builds?project=thrive-465618

### View Service Logs
- Dev: https://console.cloud.google.com/run/detail/us-central1/thrive-app-ui/logs?project=thrive-dev-465922
- Prod: https://console.cloud.google.com/run/detail/us-central1/thrive-app-ui/logs?project=thrive-465618

## Troubleshooting

### GitHub Connection Issues

If you can't connect GitHub:
1. Ensure you have admin access to the repository
2. Check if the Cloud Build API is enabled
3. Try disconnecting and reconnecting the GitHub app

### Build Failures

Common issues:
1. **Missing secrets**: Check Secret Manager for all required environment variables
2. **API not enabled**: Run the setup script to enable all APIs
3. **Permission issues**: Ensure Cloud Build service account has necessary permissions

### Manual Deployment Fallback

If automated deployments fail, use manual deployment scripts:
```bash
# Always works if you have project access
./scripts/deploy-dev.sh   # For development
./scripts/deploy-prod.sh  # For production
```

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use Secret Manager** for all sensitive values
3. **Restrict production deployments** to release branch only
4. **Review changes** before merging to release branch
5. **Monitor deployment logs** for any security issues

## Maintenance

### Updating Secrets

```bash
# Update a secret in dev
echo -n "new-value" | gcloud secrets versions add SECRET_NAME \
  --data-file=- --project=thrive-dev-465922

# Update a secret in prod
echo -n "new-value" | gcloud secrets versions add SECRET_NAME \
  --data-file=- --project=thrive-465618
```

### Updating Cloud Build Configuration

1. Edit `cloudbuild.yaml`
2. Test with manual deployment first
3. Commit and push to trigger automated deployment

## Scripts Reference

- `setup-complete-deployment.sh`: Complete setup wizard
- `deploy-dev.sh`: Manual deployment to development
- `deploy-prod.sh`: Manual deployment to production
- `create-github-triggers.sh`: Create Cloud Build triggers
- `verify-env.js`: Verify environment variables
- `migrate-feed-assistant-secret.sh`: Migrate old feed assistant secret

## Next Steps

1. Run `./scripts/setup-complete-deployment.sh` to set up everything
2. Connect GitHub via the Cloud Console links provided
3. Test deployment to development
4. Set up monitoring and alerts
5. Document any project-specific deployment procedures