# ThriveNativeApp Requirements for WebView Integration

## Required Bridge Methods

The React Native app should implement these methods in the bridge to properly integrate with the web app:

### 1. checkNotificationPermission() (✅ IMPLEMENTED)

**Purpose**: Check current notification permission status dynamically

**Implementation**:
```javascript
// In ThriveNativeApp bridge
checkNotificationPermission: () => {
  // Check actual system permission status
  const hasPermission = await checkSystemNotificationPermission();
  
  // Send result back to WebView
  webViewRef.current?.postMessage(JSON.stringify({
    type: 'notification_permission_status',
    payload: { granted: hasPermission }
  }));
}
```

**Why This is Needed**:
- Dynamic checking is more reliable than localStorage caching
- Enables session-based permission management
- Syncs actual system state with WebView state

### 2. requestNotificationPermission() (EXISTING)

**Status**: ✅ Already implemented
**Current Issue**: The response is sent but WebView sometimes times out
**WebView Fix Applied**: Added better timeout handling and fallback checks

### 3. checkHealthPermission() (❌ NOT YET IMPLEMENTED)

**Purpose**: Check current health permission status dynamically

**Implementation Required**:
```javascript
// In ThriveNativeApp bridge
checkHealthPermission: async () => {
  // Check actual system health permission status
  const hasPermission = await checkSystemHealthPermission();
  
  // Send result back to WebView
  // Note: WebView accepts both 'health_permission_status' or 'health_permission_result'
  webViewRef.current?.postMessage(JSON.stringify({
    type: 'health_permission_result', // or 'health_permission_status'
    payload: { granted: hasPermission }
  }));
}
```

**Why This is Needed**:
- Enables dynamic health permission checking like notifications
- Allows WebView to check permissions on app startup/session
- Prevents stale permission states

**Note**: The WebView now accepts both `health_permission_status` and `health_permission_result` message types for flexibility.

### 4. requestHealthPermission() (✅ EXISTING)

**Status**: ✅ Already implemented
**Enhancement**: Should send `health_permission_result` message with format:
```javascript
webViewRef.current?.postMessage(JSON.stringify({
  type: 'health_permission_result',
  payload: { granted: true/false }
}));
```

### 5. Current Issues in Logs

#### Issue 1: Object Logging
- **Problem**: `console.log('...', object)` shows `[object Object]` in logs
- **Fix Applied**: WebView now uses `JSON.stringify()` for object logging
- **Native Side**: Consider implementing similar JSON logging for debugging

#### Issue 2: Notification IDs (✅ FIXED)
- **Problem**: Notification IDs were using compound string format like "1752526197137_step_step-1"
  ```
  Error: java.lang.NumberFormatException: For input string: "1752526197137_step_step-1"
  ```
- **Root Cause**: Android notification system requires pure integer IDs, not compound strings
- **Fix Applied**: 
  - Updated `generateStepNotificationId()` to generate safe integer-only IDs using hash function
  - Added automatic migration system that clears legacy notifications and reschedules with new IDs
  - Migration runs once automatically on app launch when permissions are granted
- **Native Side**: No changes needed - WebView now generates compatible integer IDs

## Integration Status

### ✅ Working (WebView Side)
- Unified PermissionSyncProvider for app startup permission checks
- Session-based permission management for both notifications and health
- Safe notification ID generation with integer-only format
- Automatic migration system for legacy notification IDs
- Dynamic permission checking with fallbacks
- Better error handling and logging
- Health permission manager matching notification pattern

### ✅ Implemented (Native App Side)
- `checkNotificationPermission()` method implementation
- Dynamic notification permission status checking
- `requestHealthPermission()` method (existing)

### ❌ Needs Implementation (Native App Side)
- `checkHealthPermission()` method for dynamic health permission checking

### ✅ Completed (Native App Side)
- All notification ID issues resolved by WebView-side fixes

### 🔧 Optional Enhancement (Native App Side)
- `getScheduledNotifications()` method for debug purposes
  
  **Purpose**: Enables the debug modal in Settings to show actual scheduled notifications from the native app
  
  **Features Enabled**:
  - View all scheduled notifications with details (title, body, schedule time, etc.)
  - Compare WebView-expected vs Native-actual notifications
  - Debug notification ID mismatches
  - Verify notification content and scheduling
  - Copy debug info for troubleshooting
  
  **Implementation example for ThriveNativeApp bridge**:
  ```javascript
  getScheduledNotifications: () => {
    // Query the system's scheduled notifications
    const notifications = getSystemScheduledNotifications();
    
    // Send result back to WebView
    webViewRef.current?.postMessage(JSON.stringify({
      type: 'scheduled_notifications_list',
      payload: {
        notifications: notifications.map(notification => ({
          id: notification.id,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          scheduledTime: notification.scheduledTime,
          isRepeating: notification.isRepeating
        }))
      }
    }));
  }
  ```
  
  **Status**: Optional - WebView debug modal works without this but provides more limited information

## Testing Notes

Based on logs, the native app:
- ✅ Successfully handles `requestNotificationPermission()`
- ✅ Has working notification scheduling (13 notifications shown)
- ✅ Sends permission results back to WebView
- ✅ Now implements `checkNotificationPermission()` method
- ✅ Receives integer-only notification IDs from WebView (NumberFormatException fixed)

## Recommended Implementation Order

1. ✅ **High Priority**: ~~Implement `checkNotificationPermission()` method~~ (COMPLETED)
2. ✅ **Medium Priority**: ~~Fix notification ID generation~~ (COMPLETED)
3. **High Priority**: Implement `checkHealthPermission()` method
4. **Low Priority**: Improve debug logging with JSON.stringify()

## Expected Behavior Now

With all fixes implemented:
- ✅ WebView dynamically checks both notification and health permission status on app load
- ✅ Unified PermissionSyncProvider checks all permissions at startup
- ✅ NotificationSyncProvider properly syncs notifications when permissions exist
- ✅ ThrivingNotificationCard shows correct permission state
- ✅ Health data appears on home page immediately when permissions are granted
- ✅ Permission checking is now fully dynamic and reliable for both notifications and health
- ✅ Notification IDs are integer-only format, no more NumberFormatException errors
- ✅ Automatic migration clears legacy notifications and reschedules with new IDs
- ✅ Hash-based ID generation ensures uniqueness while staying within Android limits

## Unified Permission System

The app now uses a unified permission checking system that:
1. Checks all permissions (notifications, health) at app startup via PermissionSyncProvider
2. Caches results for the session to avoid repeated bridge calls
3. Forces fresh checks when permissions are requested
4. Falls back to localStorage when bridge methods are unavailable
5. Maintains consistency between WebView and Native app states