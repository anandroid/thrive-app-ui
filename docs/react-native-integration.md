# React Native WebView Integration Guide

## Android Configuration

### 1. AndroidManifest.xml
Location: `android/app/src/main/AndroidManifest.xml`

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Required permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    
    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:allowBackup="false"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true"> <!-- For dev server -->
        
        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode"
            android:launchMode="singleTask"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
    </application>
</manifest>
```

### 2. MainActivity.java (or MainActivity.kt)
Location: `android/app/src/main/java/com/yourapp/MainActivity.java`

```java
package com.yourapp;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import android.os.Bundle;

public class MainActivity extends ReactActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(null); // Fix for React Native 0.68+
    }

    @Override
    protected String getMainComponentName() {
        return "ThriveAppNative";
    }

    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new DefaultReactActivityDelegate(
            this,
            getMainComponentName(),
            DefaultNewArchitectureEntryPoint.getFabricEnabled()
        );
    }
}
```

### 3. WebView Component Update
Location: Your WebView component (e.g., `App.tsx`)

```tsx
import { WebView } from 'react-native-webview';

// Update WebView props
<WebView
    ref={webViewRef}
    source={{ uri: webUrl }}
    style={{ flex: 1 }} // Important: Use flex: 1, not fixed height
    
    // Keyboard handling props
    automaticallyAdjustContentInsets={false}
    contentInsetAdjustmentBehavior="never"
    
    // Android-specific props
    androidLayerType="hardware" // Better performance
    androidHardwareAccelerationDisabled={false}
    
    // iOS-specific props
    keyboardDisplayRequiresUserAction={false}
    
    // Standard props
    javaScriptEnabled={true}
    domStorageEnabled={true}
    startInLoadingState={true}
    
    // User agent - include "wv" for WebView detection
    userAgent="thrive-app/1.0 ReactNative Android wv"
    
    onMessage={handleMessage}
/>
```

### 4. Gradle Configuration (Optional but recommended)
Location: `android/app/build.gradle`

```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.yourapp"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode 1
        versionName "1.0"
        
        // Ensure WebView uses latest Chrome version
        multiDexEnabled true
    }
}
```

## iOS Configuration

### 1. Info.plist
Location: `ios/YourApp/Info.plist`

```xml
<!-- Keyboard handling -->
<key>KeyboardDisplayRequiresUserAction</key>
<false/>

<!-- Allow inline media playback -->
<key>AllowsInlineMediaPlayback</key>
<true/>

<!-- For dev server -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    <key>NSAllowsLocalNetworking</key>
    <true/>
</dict>
```

## Testing Checklist

After implementing these changes:

1. **Clean and rebuild**:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx react-native run-android
   ```

2. **Verify in logs**:
   - User Agent should show "wv" or "WebView"
   - Viewport should resize when keyboard appears
   - No keyboard overlap on input fields

3. **Expected behavior**:
   - Keyboard pushes content up
   - Input stays visible above keyboard
   - Header remains sticky at top
   - No blank space when keyboard dismisses

## Common Issues

1. **If keyboard still overlaps**:
   - Ensure MainActivity extends ReactActivity (not Activity)
   - Check that WebView style uses `flex: 1`
   - Verify `adjustResize` is in the manifest

2. **If WebView doesn't detect as WebView**:
   - Add "wv" or "WebView" to user agent string
   - This helps the web app apply WebView-specific styles

3. **Performance issues**:
   - Use `androidLayerType="hardware"`
   - Enable hardware acceleration in manifest