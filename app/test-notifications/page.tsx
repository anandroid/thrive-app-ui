'use client';

import React, { useState, useEffect } from 'react';
import bridge from '@/src/lib/react-native-bridge';

export default function TestNotificationsPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRequesting, setIsRequesting] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<Record<string, unknown>>({});

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    // Check bridge status
    const status = bridge.getBridgeStatus();
    setBridgeStatus(status);
    addLog('Page loaded');
    addLog(`Bridge status: ${JSON.stringify(status, null, 2)}`);

    // Set up message listener
    const handleMessage = (event: MessageEvent) => {
      addLog(`Received message: ${JSON.stringify(event.data)}`);
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const testPermissionRequest = async () => {
    addLog('Starting permission request...');
    setIsRequesting(true);
    
    try {
      addLog('Calling bridge.requestNotificationPermission()');
      const result = await bridge.requestNotificationPermission();
      addLog(`Permission result: ${result}`);
      
      if (result) {
        addLog('Permission granted! Testing notification...');
        setTimeout(() => {
          testSendNotification();
        }, 1000);
      } else {
        addLog('Permission denied');
      }
    } catch (error) {
      addLog(`Error: ${error}`);
    } finally {
      setIsRequesting(false);
    }
  };

  const testSendNotification = () => {
    addLog('Sending test notification...');
    try {
      bridge.sendNotification(
        'Test Notification 🎉',
        'If you see this, notifications are working!',
        { type: 'test', timestamp: new Date().toISOString() }
      );
      addLog('Notification sent');
    } catch (error) {
      addLog(`Send error: ${error}`);
    }
  };

  const testDirectBridge = () => {
    addLog('Testing direct bridge call...');
    if (window.ReactNativeBridge) {
      addLog('ReactNativeBridge exists');
      try {
        window.ReactNativeBridge.postMessage({
          type: 'test_notification'
        });
        addLog('Direct bridge call sent');
      } catch (error) {
        addLog(`Direct bridge error: ${error}`);
      }
    } else {
      addLog('ReactNativeBridge not found');
    }
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Notification Test Page</h1>
        
        {/* Bridge Status */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
          <h2 className="font-semibold mb-2">Bridge Status</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
            {JSON.stringify(bridgeStatus, null, 2)}
          </pre>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
          <h2 className="font-semibold mb-4">Actions</h2>
          <div className="space-y-2">
            <button
              onClick={testPermissionRequest}
              disabled={isRequesting}
              className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isRequesting ? 'Requesting...' : 'Request Notification Permission'}
            </button>
            
            <button
              onClick={testSendNotification}
              className="w-full py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Send Test Notification
            </button>
            
            <button
              onClick={testDirectBridge}
              className="w-full py-2 px-4 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Test Direct Bridge Call
            </button>
            
            <button
              onClick={clearLogs}
              className="w-full py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="font-semibold mb-2">Console Logs</h2>
          <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}