# Firebase Phone Authentication Setup Guide

This guide will help you set up Firebase Phone Authentication for the Thrive app.

## Prerequisites
- A Firebase project (create one at https://console.firebase.google.com)
- Node.js and npm installed
- The Thrive app codebase

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

## Step 2: Enable Phone Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Phone** provider
3. Toggle **Enable** switch
4. Click **Save**

## Step 3: Configure Phone Auth Settings

### For Testing (Recommended during development):
1. In Firebase Console > Authentication > Settings > **Authorized domains**
2. Add `localhost` for local development
3. Go to **Phone numbers for testing** section
4. Add test phone numbers (e.g., +1 555-555-5555)
5. Add corresponding verification codes (e.g., 123456)

### SMS Quota:
- Free tier: 10,000 SMS verifications/month
- Monitor usage in Firebase Console > Authentication > Usage

## Step 4: Get Firebase Configuration

1. In Firebase Console, click the gear icon > **Project settings**
2. Scroll to **Your apps** section
3. Click **Add app** > **Web** (</> icon)
4. Register your app with a nickname (e.g., "thrive-web")
5. Copy the configuration object

## Step 5: Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Firebase Configuration (from step 4)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## Step 6: Set up Firebase Admin SDK (for server-side)

1. In Firebase Console > Project settings > **Service accounts**
2. Click **Generate new private key**
3. Save the JSON file securely
4. Add to `.env.local`:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY='paste-entire-json-content-here'
```

**Important**: Never commit this key to version control!

## Step 7: Configure reCAPTCHA (Required for Web)

1. Firebase Phone Auth requires reCAPTCHA for web apps
2. The app already includes invisible reCAPTCHA setup
3. Make sure your domain is added to **Authorized domains** in Firebase Console

## Step 8: Test the Implementation

1. Start the development server:
   ```bash
   npm run dev
   ```

2. The phone auth flow:
   - User enters phone number
   - Firebase sends SMS with verification code
   - User enters code
   - Authentication completes

## Step 9: Production Deployment

### For Google Cloud Run:
1. Add Firebase config as environment variables
2. For service account, use Google Cloud Secret Manager:
   ```bash
   gcloud secrets create firebase-service-account --data-file=path/to/service-account.json
   ```

### Security Best Practices:
1. **Never expose service account keys** in client-side code
2. **Use environment variables** for all sensitive configuration
3. **Enable App Check** for additional security (optional)
4. **Monitor usage** to prevent abuse
5. **Set up rate limiting** in your application

## Troubleshooting

### Common Issues:

1. **"auth/invalid-phone-number"**
   - Ensure phone number includes country code
   - Format: +1234567890

2. **"auth/too-many-requests"**
   - Rate limit exceeded
   - Wait a few minutes or use test phone numbers

3. **reCAPTCHA issues**
   - Ensure domain is in authorized list
   - Check browser console for errors

4. **SMS not received**
   - Check Firebase Console > Authentication > Usage
   - Verify phone number format
   - Try test phone numbers first

## Testing Phone Numbers

For development, use these test numbers (configure in Firebase Console):
- US: +1 555-555-5555 → Code: 123456
- UK: +44 7700 900000 → Code: 123456
- India: +91 9999999999 → Code: 123456

## Next Steps

1. Implement user profile creation after first sign-in
2. Add user data to Firestore
3. Implement proper error handling
4. Add analytics tracking
5. Consider implementing:
   - Account deletion
   - Phone number change
   - Multi-factor authentication

## Resources

- [Firebase Phone Auth Documentation](https://firebase.google.com/docs/auth/web/phone-auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase App Check](https://firebase.google.com/docs/app-check)