# React Native App - Add send_notification Handler

The webapp is sending `send_notification` messages but the React Native app doesn't have a handler for this message type. 

## Add this case to your App.tsx handleWebViewMessage function:

Add this case before the `default:` case around line 275:

```typescript
case 'send_notification':
  if (message.payload) {
    const { title, body, data } = message.payload;
    
    // Send a local notification immediately
    NotificationService.sendNotification({
      title: title || 'Thrive Reminder',
      body: body || 'Time for your wellness routine',
      data: data || {},
    });
  }
  break;
```

## Full context of where to add it:

```typescript
// Around line 273-276 in App.tsx
        }
        break;

      // ADD THIS NEW CASE HERE
      case 'send_notification':
        if (message.payload) {
          const { title, body, data } = message.payload;
          
          // Send a local notification immediately
          NotificationService.sendNotification({
            title: title || 'Thrive Reminder',
            body: body || 'Time for your wellness routine',
            data: data || {},
          });
        }
        break;

      default:
        console.log('Unknown message type:', message.type);
```

## Make sure NotificationService has a sendNotification method:

If your NotificationService doesn't have a `sendNotification` method, add one like this:

```typescript
// In NotificationService.ts
static async sendNotification({ title, body, data }: {
  title: string;
  body: string;
  data?: Record<string, any>;
}) {
  await notifee.displayNotification({
    title,
    body,
    data,
    android: {
      channelId: 'routine-reminders',
      smallIcon: 'ic_launcher',
      pressAction: {
        id: 'default',
      },
    },
    ios: {
      sound: 'default',
    },
  });
}
```

## Testing

After adding this handler:
1. The webapp's "Test Notification" button should work
2. Step reminder notifications should be sent properly
3. You should see the notification on your device

The webapp is already sending the correct message format:
```javascript
window.ReactNativeBridge.postMessage({
  type: 'send_notification',
  payload: {
    title: 'Time for: Morning Meditation',
    body: 'It\'s time for your wellness routine step',
    data: {
      thrivingId: '123',
      stepId: '456',
      type: 'step_reminder'
    }
  }
});
```