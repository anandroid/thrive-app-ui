# Getting Firebase Service Account Key

The Firebase Admin SDK errors indicate you need to set up server-side authentication. Here's how to fix it:

## Quick Fix (Development Only)

For development, the app will work without the service account key. The errors won't affect basic functionality.

## Full Setup (Recommended for Production)

### 1. Download Service Account Key

1. Go to Firebase Console: https://console.firebase.google.com/project/thrive-465618/settings/serviceaccounts/adminsdk
2. Click **"Generate new private key"**
3. Click **"Generate key"** in the popup
4. Save the downloaded JSON file

### 2. Add to Environment Variables

You have two options:

#### Option A: Individual Variables (More Secure)

Open the downloaded JSON file and extract these values:

```bash
# Add these to your .env.local file
FIREBASE_PROJECT_ID=thrive-465618
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@thrive-465618.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

**Important**: Keep the quotes around the private key and preserve the `\n` characters.

#### Option B: Full JSON (Simpler)

1. Open the downloaded JSON file
2. Copy the entire content
3. Minify it to a single line (remove all line breaks)
4. Add to `.env.local`:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"thrive-465618","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"...","universe_domain":"googleapis.com"}'
```

**Important**: 
- Use single quotes to wrap the JSON
- Escape any single quotes in the JSON with `\'`
- Make sure it's all on one line

### 3. Restart Development Server

After updating `.env.local`, restart the server:

```bash
# Stop the server (Ctrl+C)
# Start again
npm run dev
```

## Security Notes

- **NEVER** commit the service account key to Git
- Add `.env.local` to `.gitignore` (already done)
- Use environment variables in production (Vercel, Cloud Run, etc.)
- The service account key has admin access to your Firebase project

## What This Enables

With the service account key configured:
- ✅ Server-side user authentication verification
- ✅ Firestore database access from API routes
- ✅ Ability to create/update user profiles
- ✅ Discovery post approval system
- ✅ Protected API endpoints

## Troubleshooting

If you still see errors after adding the service account:

1. **Check JSON format**: Make sure the JSON is valid (use a JSON validator)
2. **Check quotes**: Ensure proper escaping of quotes
3. **Check line breaks**: Private key must have `\n` preserved
4. **Clear Next.js cache**: `rm -rf .next && npm run dev`

## For Production Deployment

When deploying to production:

1. **Vercel**: Add environment variables in project settings
2. **Google Cloud Run**: Use Secret Manager or environment variables
3. **Other platforms**: Check their docs for environment variable setup

Remember: The service account key is sensitive - treat it like a password!