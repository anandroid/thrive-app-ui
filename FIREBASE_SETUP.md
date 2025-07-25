# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication for the Thrive App with support for Phone, Google, and Apple Sign-In.

## Prerequisites

1. A Firebase project (create one at https://console.firebase.google.com)
2. Your domain where the app is hosted (e.g., localhost:3000 for development)

## Step 1: Enable Authentication Providers

1. Go to Firebase Console > Authentication > Sign-in method
2. Enable the following providers:
   - **Phone** - Click enable and save
   - **Google** - Click enable, add project name, and save
   - **Apple** - Click enable and configure (requires Apple Developer account)

## Step 2: Configure Authorized Domains

1. In Firebase Console > Authentication > Settings > Authorized domains
2. Add your domains:
   - `localhost` (for development)
   - Your production domain (e.g., `thriveful.app`)
   - Any other domains where your app runs

## Step 3: Get Firebase Configuration

1. Go to Firebase Console > Project Settings > General
2. Scroll down to "Your apps" > Web app
3. If no web app exists, click "Add app" and choose Web
4. Copy the configuration values

## Step 4: Set Environment Variables

Create a `.env.local` file in your project root with:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

## Step 5: Configure reCAPTCHA for Phone Auth

1. Firebase automatically creates a reCAPTCHA key for phone authentication
2. If you see reCAPTCHA errors:
   - Go to https://console.cloud.google.com/apis/credentials
   - Find the reCAPTCHA key (created by Firebase)
   - Add your domains to the allowed domains list

## Step 6: Configure OAuth Redirect URIs

### For Google Sign-In:
1. Go to https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Add authorized redirect URIs:
   - `https://your-project-id.firebaseapp.com/__/auth/handler`
   - Your custom domain if applicable

### For Apple Sign-In:
1. Requires Apple Developer account
2. Configure in Apple Developer Console
3. Add redirect URI: `https://your-project-id.firebaseapp.com/__/auth/handler`

## Troubleshooting

### "Network request failed" error
- Check that all environment variables are set correctly
- Ensure your domain is in the authorized domains list

### "reCAPTCHA error"
- Verify your domain is authorized in both Firebase and Google Cloud Console
- Clear browser cache and cookies
- Try in an incognito window

### "Popup blocked" error
- Users need to allow popups for your site
- Consider using signInWithRedirect as an alternative

## Testing

1. Start your development server: `npm run dev`
2. Open the app and try signing in with:
   - Phone number (you'll receive a real SMS)
   - Google account (popup or redirect)
   - Apple ID (popup or redirect)

## Security Notes

- Never commit `.env.local` to version control
- Use Firebase Security Rules to protect user data
- Enable App Check for additional security in production