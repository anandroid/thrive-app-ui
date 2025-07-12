# React Native Bridge Integration Guide

## Overview
This guide explains how to properly inject the React Native bridge when loading the Thrive webapp in a WebView.

## Problem
The webapp needs to detect when it's running inside a React Native WebView to enable native features like notifications. Currently, the webapp checks for `window.ReactNativeBridge` but this isn't being injected when loading localhost.

## Solutions

### Option 1: Set User Agent (Simplest)
Configure your WebView to include 'ReactNative' or 'thrive-app' in the user agent:

```swift
// iOS Swift
webView.customUserAgent = "thrive-app/1.0 ReactNative"
```

```kotlin
// Android Kotlin
webView.settings.userAgentString = "${webView.settings.userAgentString} thrive-app/1.0 ReactNative"
```

### Option 2: Inject JavaScript Before Page Load

#### iOS (Swift)
```swift
let bridgeScript = """
window.ReactNativeBridge = {
    postMessage: function(message) {
        window.webkit.messageHandlers.ReactNative.postMessage(message);
    },
    requestNotificationPermission: function() {
        this.postMessage({ type: 'requestNotificationPermission' });
    },
    requestCameraPermission: function() {
        this.postMessage({ type: 'requestCameraPermission' });
    },
    notifyThrivingCreated: function() {
        this.postMessage({ type: 'notifyThrivingCreated' });
    },
    openExternalUrl: function(url) {
        this.postMessage({ type: 'openExternalUrl', payload: { url: url } });
    }
};
window.__REACT_NATIVE_ENV__ = true;
"""

let userScript = WKUserScript(
    source: bridgeScript,
    injectionTime: .atDocumentStart,
    forMainFrameOnly: true
)
webView.configuration.userContentController.addUserScript(userScript)
```

#### Android (Kotlin)
```kotlin
webView.addJavascriptInterface(NativeBridge(), "AndroidBridge")

webView.evaluateJavascript("""
    window.ReactNativeBridge = {
        postMessage: function(message) {
            AndroidBridge.postMessage(JSON.stringify(message));
        },
        requestNotificationPermission: function() {
            this.postMessage({ type: 'requestNotificationPermission' });
        },
        requestCameraPermission: function() {
            this.postMessage({ type: 'requestCameraPermission' });
        },
        notifyThrivingCreated: function() {
            this.postMessage({ type: 'notifyThrivingCreated' });
        },
        openExternalUrl: function(url) {
            this.postMessage({ type: 'openExternalUrl', payload: { url: url } });
        }
    };
    window.__REACT_NATIVE_ENV__ = true;
""", null)
```

### Option 3: Use Bridge Injector Page
Load the webapp through the bridge injector page which sets up the bridge before redirecting:

```swift
webView.load(URLRequest(url: URL(string: "http://localhost:3000/bridge-injector.html")!))
```

## Testing the Bridge

1. Load the webapp in your WebView
2. Navigate to `/test-bridge` to see comprehensive bridge detection info
3. The page will show:
   - Current bridge detection status
   - User agent string
   - Available window properties
   - Multiple checks over time

## Expected Bridge Methods

The webapp expects these methods on `window.ReactNativeBridge`:

```typescript
interface ReactNativeBridge {
    postMessage: (message: unknown) => void;
    requestCameraPermission: () => void;
    requestNotificationPermission: () => void;
    notifyThrivingCreated: () => void;
    openExternalUrl: (url: string) => void;
}
```

## Handling Messages from Webapp

When the webapp calls `ReactNativeBridge.postMessage()`, it sends messages in this format:

```typescript
{
    type: string;
    payload?: any;
}
```

Common message types:
- `send_notification` - Send a local notification
- `requestNotificationPermission` - Request notification permissions
- `openExternalUrl` - Open URL in external browser

## Sending Messages to Webapp

To send messages from native to webapp:

```javascript
// Call this JavaScript in the WebView
window.onReactNativeMessage({ 
    type: 'notification_permission_result', 
    payload: { granted: true } 
});
```

## Debugging Tips

1. Open Safari Web Inspector (iOS) or Chrome DevTools (Android) to see console logs
2. The webapp logs detailed bridge detection info on load
3. Use the `/test-bridge` page for comprehensive debugging
4. Check for these indicators of successful bridge injection:
   - `window.ReactNativeBridge` exists
   - Console shows "React Native Bridge Detection: isReactNative: true"
   - Native features (notifications) appear in Settings

## URL Parameters

The webapp supports these URL parameters for testing:
- `?reactNative=true` - Forces React Native mode even without bridge
- `/test-bridge` - Shows detailed bridge debugging information

## Example Native Implementation

See the test implementations in:
- iOS: (Create a sample iOS WebView controller)
- Android: (Create a sample Android WebView activity)