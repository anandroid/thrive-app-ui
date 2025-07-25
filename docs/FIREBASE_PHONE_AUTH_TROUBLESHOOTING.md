# Firebase Phone Authentication Troubleshooting

## Common reCAPTCHA Error (401 Unauthorized)

If you're seeing this error:
```
POST https://www.google.com/recaptcha/api2/pat?k=6LcMZR0UAAAAALgPMcgHwga7gY5p8QMg1Hj-bmUv 401 (Unauthorized)
Firebase: Error (auth/invalid-app-credential)
```

This means Firebase Phone Authentication is not properly configured for your domain.

## Solution Steps

### 1. Enable Phone Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/project/thrive-465618/authentication/providers)
2. Click on "Phone" in the sign-in providers list
3. Toggle it to "Enabled"
4. Click "Save"

### 2. Configure Authorized Domains
1. Go to [Authentication Settings](https://console.firebase.google.com/project/thrive-465618/authentication/settings)
2. Under "Authorized domains", ensure these are added:
   - `localhost` (for local development)
   - `thrive-465618.firebaseapp.com` (default)
   - `thrive-465618.web.app` (default)
   - Your production domain (e.g., `thriveful.app`)

### 3. Wait for Propagation
- Changes can take 2-5 minutes to propagate
- Try refreshing your browser and clearing cache

### 4. Test Configuration
```bash
# Restart your development server
npm run dev

# Clear browser cache and cookies for localhost
# Try phone authentication again
```

## Understanding the Error

The reCAPTCHA site key `6LcMZR0UAAAAALgPMcgHwga7gY5p8QMg1Hj-bmUv` is Firebase's default key that gets used when:
- Phone authentication is not enabled
- Your domain is not in the authorized domains list
- There's a configuration mismatch

Firebase automatically handles reCAPTCHA for phone authentication - you don't need to:
- Create your own reCAPTCHA keys
- Configure reCAPTCHA Enterprise
- Enable App Check (unless you specifically want it)

## Alternative: Test with Firebase Emulator

For local development without configuring production Firebase:

```bash
# Install Firebase tools
npm install -g firebase-tools

# Start emulators
firebase emulators:start --only auth

# Update your config to use emulator
# Add to your firebase config initialization:
if (process.env.NODE_ENV === 'development') {
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

## Still Having Issues?

1. Check browser console for specific error messages
2. Verify your Firebase project ID matches: `thrive-465618`
3. Ensure you're using the correct API key: `AIzaSyBLuZgeZaDkNcJxbAWujbWPTrsOZxp8JTs`
4. Try incognito/private browsing mode
5. Check if any browser extensions are blocking reCAPTCHA

## Production Deployment

When deploying to production:
1. Add your production domain to authorized domains
2. Ensure your domain has valid SSL certificate
3. Update any Content Security Policy headers to allow Firebase/reCAPTCHA