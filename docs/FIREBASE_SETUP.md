# Firebase Phone Authentication Setup Guide

This guide will help you set up Firebase Phone Authentication for the Thrive app.

## Prerequisites

- Firebase project created at [Firebase Console](https://console.firebase.google.com)
- Google Cloud project linked to Firebase
- Node.js and npm installed

## Setup Steps

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" or select existing project
3. Enable Google Analytics (optional)
4. Wait for project creation to complete

### 2. Enable Phone Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Phone** provider
3. Toggle **Enable** switch
4. Click **Save**

### 3. Configure reCAPTCHA (Required for Phone Auth)

Phone authentication requires reCAPTCHA verification:

1. In Firebase Console, go to **Project Settings** → **General**
2. Add your app domain to **Authorized domains**:
   - `localhost` (for development)
   - Your production domain (e.g., `thrive-app.com`)

### 4. Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** → **General**
2. Scroll down to "Your apps" section
3. Click "Add app" → Select "Web" (</>)
4. Register your app with a nickname
5. Copy the Firebase configuration object

### 5. Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode**
4. Select your preferred location
5. Click **Enable**

### 6. Set Up Environment Variables

Create a `.env.local` file with your Firebase configuration:

```bash
# Firebase Client SDK Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Firebase Admin SDK (for server-side)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### 7. Generate Service Account Key

For server-side authentication:

1. Go to Firebase Console → **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Copy the entire JSON content
5. Set it as `FIREBASE_SERVICE_ACCOUNT_KEY` in `.env.local`

### 8. Set Up SMS Quota (Important!)

Firebase Phone Auth has daily SMS quotas:
- **Free tier**: 10 SMS/day
- **Blaze plan**: 10,000 SMS/month free, then pay-as-you-go

To increase quota:
1. Upgrade to Firebase Blaze plan (pay-as-you-go)
2. Set budget alerts in Google Cloud Console

### 9. Configure Phone Number Testing

For development, add test phone numbers:

1. In Firebase Console → **Authentication** → **Sign-in method** → **Phone**
2. Click "Phone numbers for testing" accordion
3. Add test numbers with verification codes:
   - Phone: `+1 555-123-4567`
   - Code: `123456`

### 10. Deploy Firestore Security Rules

Create `firestore.rules` file:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Discovery posts rules
    match /discovery_posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         request.auth.token.admin == true);
      allow delete: if false;
    }
  }
}
```

Deploy rules:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

### 11. Test Phone Authentication

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Click "Sign In" button on home page
3. Enter test phone number
4. Enter test verification code
5. Verify successful authentication

## Production Deployment

### Google Cloud Run

When deploying to Cloud Run, ensure:

1. All environment variables are set in Cloud Run service
2. Service account has necessary permissions:
   - Firebase Authentication Admin
   - Cloud Firestore User

### Upload Secrets Script

Use the provided script to upload secrets:

```bash
./scripts/upload-secrets.sh
```

This script:
- Uploads all Firebase environment variables
- Grants Cloud Run service access to secrets
- Handles the service account key properly

## Troubleshooting

### Common Issues

1. **"TOO_MANY_ATTEMPTS_TRY_LATER" error**
   - Firebase rate limiting - wait a few minutes
   - Use test phone numbers for development

2. **"INVALID_APP_CREDENTIAL" error**
   - Check service account key format
   - Ensure JSON is properly escaped in env variable

3. **"AUTH/INVALID-PHONE-NUMBER" error**
   - Include country code (e.g., +1 for US)
   - Remove special characters from phone number

4. **reCAPTCHA errors**
   - Add domain to authorized domains in Firebase
   - Check for ad blockers blocking reCAPTCHA

### Security Best Practices

1. **Never commit credentials**
   - Add `.env.local` to `.gitignore`
   - Use environment variables for all secrets

2. **Implement rate limiting**
   - Limit SMS sends per user
   - Add cooldown periods

3. **Validate phone numbers**
   - Use libphonenumber for validation
   - Restrict to specific countries if needed

4. **Monitor usage**
   - Set up budget alerts
   - Monitor Firebase Console for abuse

## Resources

- [Firebase Phone Auth Documentation](https://firebase.google.com/docs/auth/web/phone-auth)
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Cloud Run Firebase Integration](https://cloud.google.com/run/docs/tutorials/identity-platform)