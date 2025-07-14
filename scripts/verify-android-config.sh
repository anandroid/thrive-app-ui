#!/bin/bash

# Script to verify Android configuration for WebView keyboard handling

echo "🔍 Checking Android WebView Configuration..."
echo "==========================================="

# Check if we're in a React Native project
if [ ! -f "android/app/src/main/AndroidManifest.xml" ]; then
    echo "❌ Error: Not in a React Native project root directory"
    exit 1
fi

echo ""
echo "1. Checking AndroidManifest.xml..."
echo "-----------------------------------"

# Check for adjustResize
if grep -q "android:windowSoftInputMode=\"adjustResize\"" android/app/src/main/AndroidManifest.xml; then
    echo "✅ windowSoftInputMode=\"adjustResize\" is set"
else
    echo "❌ windowSoftInputMode=\"adjustResize\" is NOT set"
    echo "   Add this to your <activity> tag in AndroidManifest.xml"
fi

# Check for Internet permission
if grep -q "android.permission.INTERNET" android/app/src/main/AndroidManifest.xml; then
    echo "✅ Internet permission is set"
else
    echo "❌ Internet permission is NOT set"
fi

# Check for cleartext traffic (dev only)
if grep -q "android:usesCleartextTraffic=\"true\"" android/app/src/main/AndroidManifest.xml; then
    echo "⚠️  Cleartext traffic is allowed (OK for dev, remove for production)"
fi

echo ""
echo "2. Checking MainActivity..."
echo "---------------------------"

# Check MainActivity file
MAIN_ACTIVITY=$(find android/app/src/main -name "MainActivity.*" | head -1)
if [ -n "$MAIN_ACTIVITY" ]; then
    echo "✅ Found MainActivity: $MAIN_ACTIVITY"
    
    # Check if extends ReactActivity
    if grep -q "extends ReactActivity" "$MAIN_ACTIVITY"; then
        echo "✅ MainActivity extends ReactActivity"
    else
        echo "❌ MainActivity should extend ReactActivity"
    fi
else
    echo "❌ MainActivity not found"
fi

echo ""
echo "3. Checking build.gradle..."
echo "---------------------------"

# Check minSdkVersion
if grep -q "minSdkVersion" android/app/build.gradle; then
    MIN_SDK=$(grep "minSdkVersion" android/app/build.gradle | grep -o '[0-9]\+' | head -1)
    if [ "$MIN_SDK" -ge 21 ]; then
        echo "✅ minSdkVersion is $MIN_SDK (>= 21)"
    else
        echo "⚠️  minSdkVersion is $MIN_SDK (should be >= 21 for modern WebView)"
    fi
fi

echo ""
echo "4. Suggested WebView props..."
echo "------------------------------"
echo "Add these to your WebView component:"
echo ""
cat << 'EOF'
<WebView
    style={{ flex: 1 }}
    automaticallyAdjustContentInsets={false}
    contentInsetAdjustmentBehavior="never"
    androidLayerType="hardware"
    keyboardDisplayRequiresUserAction={false}
    userAgent="YourApp/1.0 ReactNative Android wv"
/>
EOF

echo ""
echo "==========================================="
echo "📱 After making changes, clean and rebuild:"
echo "cd android && ./gradlew clean && cd .. && npx react-native run-android"
echo ""