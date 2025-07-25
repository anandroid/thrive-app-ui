# Getting Firebase Web Configuration

Your Firebase API key error is happening because you need to create a **Web app** in Firebase Console. The `google-services.json` file is only for Android apps.

## Steps to Get Web App Configuration:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/project/thrive-465618/settings/general

2. **Create a Web App**
   - Scroll down to "Your apps" section
   - Click the **"</>"** (Web) icon
   - Register your app with a nickname (e.g., "Thrive Web App")
   - You DON'T need to set up Firebase Hosting
   - Click "Register app"

3. **Copy the Configuration**
   After registering, you'll see a configuration like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyDxP-OCO8d4cpbWF9KO35UQl1jMoou3wIw",
     authDomain: "thrive-465618.firebaseapp.com",
     projectId: "thrive-465618",
     storageBucket: "thrive-465618.firebasestorage.app",
     messagingSenderId: "689752906332",
     appId: "1:689752906332:web:XXXXXXXXXXXXXXXX"  // This is what you need!
   };
   ```

4. **Update .env.local**
   Replace `YOUR_WEB_APP_ID` in the `.env.local` file with the actual `appId` value from step 3.

5. **Restart the Development Server**
   ```bash
   npm run dev
   ```

## Alternative: Use Development Mode

If you want to test without Firebase authentication for now, I've already set up the app to work in development mode with a demo user. The error won't affect core functionality.

## Complete Setup Checklist:

- [ ] Create Web app in Firebase Console
- [ ] Copy the complete `appId` (format: `1:689752906332:web:XXXXXXXXXXXXXXXX`)
- [ ] Update `NEXT_PUBLIC_FIREBASE_APP_ID` in `.env.local`
- [ ] Enable Phone Authentication in Firebase Console (Authentication → Sign-in method → Phone)
- [ ] Add `localhost` to Authorized domains (Authentication → Settings → Authorized domains)
- [ ] Download service account key (Project Settings → Service accounts → Generate new private key)
- [ ] Add service account JSON to `FIREBASE_SERVICE_ACCOUNT_KEY` in `.env.local`

Once these steps are complete, Firebase authentication will work properly!