'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Bell, AlertCircle, CheckCircle, Calendar, Hash } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { TouchCloseButton } from '@/components/ui/TouchCloseButton';
import bridge from '@/src/lib/react-native-bridge';
import { getThrivingsFromStorage } from '@/src/utils/thrivingStorage';
import { generateStepNotificationId } from '@/src/utils/idGenerator';

interface NotificationDebugInfo {
  id: string;
  thrivingId?: string;
  thrivingTitle?: string;
  stepTitle?: string;
  time?: string;
  reminderText?: string;
  frequency?: string;
  enabledWeekdays?: boolean;
  enabledWeekends?: boolean;
  status: 'scheduled' | 'error' | 'unknown';
  // From native app
  title?: string;
  body?: string;
  scheduledTime?: string;
  isRepeating?: boolean;
  data?: Record<string, unknown>;
  source: 'webview' | 'native';
}

interface NotificationDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDebugModal({ isOpen, onClose }: NotificationDebugModalProps) {
  const [notifications, setNotifications] = useState<NotificationDebugInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'scheduled' | 'webview' | 'native' | 'all'>('scheduled');

  useEffect(() => {
    if (isOpen) {
      loadNotificationData();
    }
  }, [isOpen]);

  const loadNotificationData = async () => {
    setLoading(true);
    try {
      const thrivings = getThrivingsFromStorage();
      const notificationList: NotificationDebugInfo[] = [];

      // 1. Get WebView-expected notifications (from thrivings data)
      thrivings
        .filter(thriving => thriving.isActive)
        .forEach(thriving => {
          thriving.steps
            .filter(step => step.time && step.reminderEnabled !== false)
            .forEach(step => {
              const notificationId = generateStepNotificationId(thriving.id, step.id);
              
              notificationList.push({
                id: notificationId,
                thrivingId: thriving.id,
                thrivingTitle: thriving.title,
                stepTitle: step.title,
                time: step.time!,
                reminderText: step.reminderText,
                frequency: thriving.frequency,
                enabledWeekdays: thriving.notificationSettings?.enabledWeekdays ?? true,
                enabledWeekends: thriving.notificationSettings?.enabledWeekends ?? true,
                status: 'unknown',
                source: 'webview'
              });
            });
        });

      // 2. Get actual scheduled notifications from native app
      if (bridge.isInReactNative()) {
        try {
          const nativeNotifications = await bridge.getScheduledNotifications();
          console.log('[NotificationDebug] Got native notifications:', nativeNotifications);
          
          // Add native notifications
          nativeNotifications.forEach(notification => {
            notificationList.push({
              id: notification.id,
              title: notification.title,
              body: notification.body,
              scheduledTime: notification.scheduledTime,
              isRepeating: notification.isRepeating,
              data: notification.data,
              status: 'scheduled',
              source: 'native'
            });
          });

          // Cross-reference to update status of WebView notifications
          const nativeIds = new Set(nativeNotifications.map(n => n.id));
          notificationList.forEach(notification => {
            if (notification.source === 'webview') {
              notification.status = nativeIds.has(notification.id) ? 'scheduled' : 'error';
            }
          });
        } catch (error) {
          console.error('[NotificationDebug] Error getting native notifications:', error);
          // Mark all WebView notifications as unknown since we couldn't verify
          notificationList.forEach(notification => {
            if (notification.source === 'webview') {
              notification.status = 'unknown';
            }
          });
        }
      }

      setNotifications(notificationList);
    } catch (error) {
      console.error('Error loading notification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerTestNotification = async () => {
    if (!bridge.isInReactNative()) return;
    
    try {
      // Send a test notification via bridge
      bridge.postMessage({
        type: 'send_notification',
        payload: {
          title: 'Test Notification',
          body: 'This is a test notification from Thrive debug panel',
          data: {
            type: 'debug_test',
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  const copyDebugInfo = () => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      totalNotifications: notifications.length,
      isReactNative: bridge.isInReactNative(),
      bridgeStatus: bridge.getBridgeStatus(),
      notifications: notifications.map(n => ({
        id: n.id,
        thrivingTitle: n.thrivingTitle,
        stepTitle: n.stepTitle,
        time: n.time,
        frequency: n.frequency
      }))
    };

    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
  };

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const filteredNotifications = (() => {
    switch (activeTab) {
      case 'scheduled':
        return notifications.filter(n => n.status === 'scheduled');
      case 'webview':
        return notifications.filter(n => n.source === 'webview');
      case 'native':
        return notifications.filter(n => n.source === 'native');
      case 'all':
      default:
        return notifications;
    }
  })();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      className="max-h-[85vh] overflow-hidden"
    >
      <div className="relative">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Notification Debug</h2>
                <p className="text-sm text-gray-500">
                  {loading ? 'Loading...' : `${notifications.length} notifications`}
                </p>
              </div>
            </div>
            <TouchCloseButton onClose={onClose} size="sm" />
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-4 gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`px-2 py-2 rounded-md text-xs font-medium transition-all ${
                activeTab === 'scheduled'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Scheduled
              <div className="text-xs text-gray-500">
                ({notifications.filter(n => n.status === 'scheduled').length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('webview')}
              className={`px-2 py-2 rounded-md text-xs font-medium transition-all ${
                activeTab === 'webview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              WebView
              <div className="text-xs text-gray-500">
                ({notifications.filter(n => n.source === 'webview').length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('native')}
              className={`px-2 py-2 rounded-md text-xs font-medium transition-all ${
                activeTab === 'native'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Native
              <div className="text-xs text-gray-500">
                ({notifications.filter(n => n.source === 'native').length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2 py-2 rounded-md text-xs font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
              <div className="text-xs text-gray-500">
                ({notifications.length})
              </div>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={triggerTestNotification}
              variant="gradient"
              gradient={{
                from: 'blue-500',
                to: 'purple-600',
                hoverFrom: 'blue-600',
                hoverTo: 'purple-700'
              }}
              springAnimation
              cardGlow
              haptic="medium"
              size="sm"
              className="text-white"
            >
              Test Notification
            </Button>
            <Button
              onClick={copyDebugInfo}
              variant="outline"
              springAnimation
              haptic="light"
              size="sm"
              className="text-gray-700"
            >
              Copy Debug Info
            </Button>
            <Button
              onClick={loadNotificationData}
              disabled={loading}
              variant="ghost"
              springAnimation
              haptic="light"
              size="sm"
              className="text-gray-600"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-4 overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No notifications found</p>
              <p className="text-sm text-gray-400 mt-1">
                Create some thrivings with time-based steps to see notifications here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={`${notification.source}-${notification.id}`}
                  className={`rounded-xl p-4 border ${
                    notification.source === 'native' 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(notification.status)}
                      <h3 className="font-medium text-gray-900 text-sm">
                        {notification.source === 'native' 
                          ? notification.title 
                          : notification.stepTitle
                        }
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        notification.source === 'native' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {notification.source}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Hash className="w-3 h-3" />
                      <span className="font-mono">{notification.id}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {notification.source === 'webview' ? (
                      // WebView notification details
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Thriving:</span>
                          <span className="font-medium text-gray-900">
                            {notification.thrivingTitle}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Time:</span>
                          <div className="flex items-center space-x-1 text-gray-900">
                            <Clock className="w-3 h-3" />
                            <span className="font-medium">
                              {notification.time ? formatTime(notification.time) : 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Frequency:</span>
                          <span className="font-medium text-gray-900 capitalize">
                            {notification.frequency}
                          </span>
                        </div>

                        {notification.reminderText && (
                          <div className="pt-2 border-t border-gray-200">
                            <p className="text-gray-600 text-xs">
                              &ldquo;{notification.reminderText}&rdquo;
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <span className="text-gray-600">Schedule:</span>
                          <div className="flex items-center space-x-2 text-xs">
                            <div className={`flex items-center space-x-1 ${
                              notification.enabledWeekdays ? 'text-green-600' : 'text-gray-400'
                            }`}>
                              <Calendar className="w-3 h-3" />
                              <span>Weekdays</span>
                            </div>
                            <div className={`flex items-center space-x-1 ${
                              notification.enabledWeekends ? 'text-green-600' : 'text-gray-400'
                            }`}>
                              <Calendar className="w-3 h-3" />
                              <span>Weekends</span>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      // Native notification details
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Body:</span>
                          <span className="font-medium text-gray-900 text-right flex-1 ml-2">
                            {notification.body}
                          </span>
                        </div>
                        
                        {notification.scheduledTime && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Scheduled:</span>
                            <div className="flex items-center space-x-1 text-gray-900">
                              <Clock className="w-3 h-3" />
                              <span className="font-medium text-xs">
                                {new Date(notification.scheduledTime).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Repeating:</span>
                          <span className={`font-medium ${
                            notification.isRepeating ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {notification.isRepeating ? 'Yes' : 'No'}
                          </span>
                        </div>

                        {notification.data && Object.keys(notification.data).length > 0 && (
                          <div className="pt-2 border-t border-gray-200">
                            <span className="text-gray-600 text-xs">Data:</span>
                            <pre className="text-xs text-gray-600 mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
                              {JSON.stringify(notification.data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 p-4 text-xs text-gray-500">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Environment:</strong> {bridge.isInReactNative() ? 'React Native' : 'Web'}
            </div>
            <div>
              <strong>Migration:</strong> {
                typeof window !== 'undefined' && 
                localStorage.getItem('notificationIdMigrationCompleted') === 'true' 
                  ? 'Completed' 
                  : 'Pending'
              }
            </div>
          </div>
          <div className="mt-2">
            <strong>Bridge Status:</strong> {
              bridge.isInReactNative() 
                ? '✓ Connected' 
                : '✗ Not in React Native'
            }
          </div>
        </div>
      </div>
    </Modal>
  );
}