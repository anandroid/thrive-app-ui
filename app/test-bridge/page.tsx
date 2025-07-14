'use client';

import React, { useEffect, useState } from 'react';
import bridge from '@/src/lib/react-native-bridge';
import { AppLayout } from '@/components/layout/AppLayout';

export default function TestBridgePage() {
  const [bridgeInfo, setBridgeInfo] = useState<Record<string, unknown>>({});
  const [checkCount, setCheckCount] = useState(0);
  
  useEffect(() => {
    const checkBridge = () => {
      const info = {
        isInReactNative: bridge.isInReactNative(),
        hasWindow: typeof window !== 'undefined',
        hasReactNativeWebView: typeof window !== 'undefined' && !!window.ReactNativeWebView,
        hasReactNativeBridge: typeof window !== 'undefined' && !!window.ReactNativeBridge,
        hasWebViewPostMessage: typeof window !== 'undefined' && window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
        windowKeys: typeof window !== 'undefined' ? Object.keys(window).filter(k => 
          k.toLowerCase().includes('react') || 
          k.toLowerCase().includes('native') ||
          k.toLowerCase().includes('bridge')
        ) : [],
        customProperties: {
          __REACT_NATIVE_ENV__: typeof window !== 'undefined' && (window as unknown as { __REACT_NATIVE_ENV__?: boolean }).__REACT_NATIVE_ENV__,
          isReactNativeWebView: typeof window !== 'undefined' && (window as unknown as { isReactNativeWebView?: boolean }).isReactNativeWebView,
          __bridgeMessageQueue: typeof window !== 'undefined' && (window as unknown as { __bridgeMessageQueue?: unknown[] }).__bridgeMessageQueue ? (window as unknown as { __bridgeMessageQueue?: unknown[] }).__bridgeMessageQueue?.length : 0
        },
        location: typeof window !== 'undefined' ? {
          href: window.location.href,
          search: window.location.search,
          origin: window.location.origin
        } : null,
        timestamp: new Date().toISOString(),
        checkNumber: checkCount + 1
      };
      setBridgeInfo(info);
      setCheckCount(prev => prev + 1);
    };
    
    // Check immediately
    checkBridge();
    
    // Check multiple times
    const timers = [100, 250, 500, 1000, 2000].map(delay => 
      setTimeout(checkBridge, delay)
    );
    
    // Listen for bridge ready event
    const handleBridgeReady = () => {
      console.log('Bridge ready event received!');
      checkBridge();
    };
    window.addEventListener('ReactNativeBridgeReady', handleBridgeReady);
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      window.removeEventListener('ReactNativeBridgeReady', handleBridgeReady);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const testNotification = async () => {
    const granted = await bridge.requestNotificationPermission();
    alert(`Permission ${granted ? 'granted' : 'denied'}`);
  };
  
  const sendTestNotification = () => {
    if (bridge.isInReactNative()) {
      bridge.sendNotification(
        'Test Notification',
        'This is a test notification from the bridge',
        { test: true }
      );
      alert('Notification sent!');
    } else {
      alert('Not in React Native environment');
    }
  };
  
  const testDirectPostMessage = () => {
    if (typeof window !== 'undefined' && window.ReactNativeWebView) {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'test_direct',
          payload: { message: 'Direct postMessage test' }
        }));
        alert('Direct postMessage sent!');
      } catch (e) {
        alert('Direct postMessage failed: ' + (e instanceof Error ? e.message : String(e)));
      }
    } else {
      alert('ReactNativeWebView not available');
    }
  };

  return (
    <AppLayout
      header={{
        showBackButton: true,
        backHref: "/settings",
        title: "Bridge Test"
      }}
    >
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-lg p-4 shadow">
          <h2 className="font-bold text-lg mb-4">React Native Bridge Detection</h2>
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
            {JSON.stringify(bridgeInfo, null, 2)}
          </pre>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow space-y-3">
          <h2 className="font-bold text-lg">Test Functions</h2>
          
          <button
            onClick={testNotification}
            className="w-full py-3 bg-rose text-white rounded-lg font-medium"
          >
            Request Notification Permission
          </button>
          
          <button
            onClick={sendTestNotification}
            className="w-full py-3 bg-dusty-rose text-white rounded-lg font-medium"
          >
            Send Test Notification
          </button>
          
          <button
            onClick={testDirectPostMessage}
            className="w-full py-3 bg-burgundy text-white rounded-lg font-medium"
          >
            Test Direct PostMessage
          </button>
          
          <button
            onClick={() => window.location.href = '/?reactNative=true'}
            className="w-full py-3 bg-sage text-white rounded-lg font-medium"
          >
            Reload with ?reactNative=true
          </button>
          
          <button
            onClick={() => window.location.href = '/bridge-injector.html'}
            className="w-full py-3 bg-soft-lavender text-white rounded-lg font-medium"
          >
            Load via Bridge Injector
          </button>
        </div>
        
        <div className="text-xs text-gray-500 space-y-2">
          <p className="font-semibold">Troubleshooting:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Try loading via /bridge-injector.html</li>
            <li>Add ?reactNative=true to URL</li>
            <li>Check if user agent contains &apos;ReactNative&apos;</li>
            <li>Native app should inject bridge before page load</li>
            <li>Check console for detailed logs</li>
          </ol>
          <p className="mt-2 font-semibold">Native App Requirements:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Set user agent to include &apos;ReactNative&apos; or &apos;thrive-app&apos;</li>
            <li>Inject window.ReactNativeBridge object</li>
            <li>Or inject window.ReactNativeWebView.postMessage</li>
            <li>Or set window.__REACT_NATIVE_ENV__ = true</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}