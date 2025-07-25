'use client';

import React, { useState, useEffect } from 'react';
import { Info, ChevronRight, Plus, Leaf, MessageSquare, Trash2, Bell, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BottomNavLayout } from '@/components/layout/BottomNavLayout';
import bridge from '@/src/lib/react-native-bridge';
import { NotificationHelper } from '@/src/utils/notificationHelper';
import { NotificationPermissionModal } from '@/components/features/NotificationPermissionModal';
import { NotificationDebugModal } from '@/components/features/NotificationDebugModal';
import { ProfileImageUpload } from '@/components/features/ProfileImageUpload';
import { useAuth } from '@/src/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/config';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<'unknown' | 'enabled' | 'disabled'>('unknown');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showNotificationDebugModal, setShowNotificationDebugModal] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    checkNotificationStatus();
    
    const fetchUserProfile = async () => {
      if (!user || !db) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfileImageUrl(userData.photoURL || null);
          setDisplayName(userData.displayName || user.displayName || 'Anonymous');
        } else {
          setDisplayName(user.displayName || 'Anonymous');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const checkNotificationStatus = () => {
    if (bridge.isInReactNative()) {
      const granted = localStorage.getItem('notificationPermissionGranted') === 'true';
      setNotificationStatus(granted ? 'enabled' : 'disabled');
    }
  };

  const handleEnableNotifications = async () => {
    setIsRequestingPermission(true);
    try {
      const granted = await bridge.requestNotificationPermission();
      if (granted) {
        localStorage.setItem('notificationPermissionGranted', 'true');
        localStorage.setItem('notificationAskCount', '0');
        setNotificationStatus('enabled');
        
        const thrivings = JSON.parse(localStorage.getItem('thrive_thrivings') || '[]');
        if (thrivings.length > 0) {
          await NotificationHelper.scheduleRoutineReminders(thrivings);
        }
      } else {
        localStorage.setItem('notificationPermissionGranted', 'false');
        setNotificationStatus('disabled');
      }
    } catch (error) {
      console.error('Error requesting notifications:', error);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleClearData = () => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('thrive_'));
    keys.forEach(key => localStorage.removeItem(key));
    router.push('/');
  };

  return (
    <BottomNavLayout
      header={{
        title: "Settings",
        showBackButton: false
      }}
      contentClassName="bg-gray-50"
      className="settings-layout"
    >
      <div style={{ padding: '5vw' }}>
        {/* Profile Section */}
        <div style={{ marginBottom: '6vh' }}>
          <div className="bg-white shadow-sm" style={{ borderRadius: '4vw', padding: '4vw' }}>
            <div className="flex items-center" style={{ gap: '4vw' }}>
              <ProfileImageUpload
                currentImageUrl={profileImageUrl}
                onImageUpdate={(url) => setProfileImageUrl(url)}
              />
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900" style={{ fontSize: '5vw' }}>
                  {displayName}
                </h2>
                <p className="text-gray-600" style={{ fontSize: '3.5vw' }}>
                  {user?.email || user?.phoneNumber || 'Not signed in'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Your Wellness Section */}
        <div style={{ marginBottom: '6vh' }}>
          <h2 className="font-semibold text-gray-900" style={{ fontSize: '4vw', marginBottom: '3vh' }}>Your Wellness</h2>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/thrivings')}
              className="w-full bg-white shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left"
              style={{ borderRadius: '4vw', padding: '4vw' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center" style={{ gap: '3vw' }}>
                  <div className="bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow" 
                    style={{ width: '10vw', height: '10vw', borderRadius: '2.5vw' }}>
                    <Leaf className="text-white" style={{ width: '5vw', height: '5vw' }} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900" style={{ fontSize: '4vw' }}>My Thrivings</h3>
                    <p className="text-gray-600" style={{ fontSize: '3vw' }}>Your wellness routines</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400" style={{ width: '5vw', height: '5vw' }} />
              </div>
            </button>

            <button
              onClick={() => router.push('/thrivings?create=true')}
              className="w-full bg-white shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left"
              style={{ borderRadius: '4vw', padding: '4vw' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center" style={{ gap: '3vw' }}>
                  <div className="bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow" 
                    style={{ width: '10vw', height: '10vw', borderRadius: '2.5vw' }}>
                    <Plus className="text-white" style={{ width: '5vw', height: '5vw' }} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900" style={{ fontSize: '4vw' }}>Create Thriving</h3>
                    <p className="text-gray-600" style={{ fontSize: '3vw' }}>New wellness plan</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400" style={{ width: '5vw', height: '5vw' }} />
              </div>
            </button>

            <button
              onClick={() => router.push('/shop')}
              className="w-full bg-white shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left"
              style={{ borderRadius: '4vw', padding: '4vw' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center" style={{ gap: '3vw' }}>
                  <div className="bg-gradient-to-br from-rose to-burgundy flex items-center justify-center shadow" 
                    style={{ width: '10vw', height: '10vw', borderRadius: '2.5vw' }}>
                    <span style={{ fontSize: '6vw' }}>🛍️</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900" style={{ fontSize: '4vw' }}>Shop</h3>
                    <p className="text-gray-600" style={{ fontSize: '3vw' }}>Premium wellness supplements</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400" style={{ width: '5vw', height: '5vw' }} />
              </div>
            </button>

            <button
              onClick={() => router.push('/admin')}
              className="w-full bg-white shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left"
              style={{ borderRadius: '4vw', padding: '4vw' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center" style={{ gap: '3vw' }}>
                  <div className="bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow" 
                    style={{ width: '10vw', height: '10vw', borderRadius: '2.5vw' }}>
                    <span style={{ fontSize: '6vw' }}>⚙️</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900" style={{ fontSize: '4vw' }}>Shop Admin</h3>
                    <p className="text-gray-600" style={{ fontSize: '3vw' }}>Manage products & vendors</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400" style={{ width: '5vw', height: '5vw' }} />
              </div>
            </button>

            <button
              onClick={() => router.push('/chat-history')}
              className="w-full bg-white shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left"
              style={{ borderRadius: '4vw', padding: '4vw' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center" style={{ gap: '3vw' }}>
                  <div className="bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow" 
                    style={{ width: '10vw', height: '10vw', borderRadius: '2.5vw' }}>
                    <MessageSquare className="text-white" style={{ width: '5vw', height: '5vw' }} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900" style={{ fontSize: '4vw' }}>Chat History</h3>
                    <p className="text-gray-600" style={{ fontSize: '3vw' }}>View past conversations</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400" style={{ width: '5vw', height: '5vw' }} />
              </div>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {bridge.isInReactNative() && (
          <div style={{ marginBottom: '6vh' }}>
            <h2 className="font-semibold text-gray-900" style={{ fontSize: '4vw', marginBottom: '3vh' }}>Notifications</h2>
            
            <div className="bg-white shadow-sm" style={{ borderRadius: '4vw', padding: '4vw' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center" style={{ gap: '3vw' }}>
                  <div className="bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center" 
                    style={{ width: '10vw', height: '10vw', borderRadius: '2.5vw' }}>
                    <Bell className="text-white" style={{ width: '5vw', height: '5vw' }} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900" style={{ fontSize: '4vw' }}>Daily Reminders</h3>
                    <p className="text-gray-600" style={{ fontSize: '3vw' }}>
                      {notificationStatus === 'enabled' ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notificationStatus === 'enabled'}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (notificationStatus === 'disabled') {
                          handleEnableNotifications();
                        }
                      } else {
                        localStorage.setItem('notificationPermissionGranted', 'false');
                        setNotificationStatus('disabled');
                      }
                    }}
                    disabled={isRequestingPermission}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* About */}
        <div style={{ marginBottom: '6vh' }}>
          <h2 className="font-semibold text-gray-900" style={{ fontSize: '4vw', marginBottom: '3vh' }}>About</h2>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/settings/about')}
              className="w-full bg-white shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left"
              style={{ borderRadius: '4vw', padding: '4vw' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center" style={{ gap: '3vw' }}>
                  <div className="bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow" 
                    style={{ width: '10vw', height: '10vw', borderRadius: '2.5vw' }}>
                    <Info className="text-white" style={{ width: '5vw', height: '5vw' }} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900" style={{ fontSize: '4vw' }}>About Thrive</h3>
                    <p className="text-gray-600" style={{ fontSize: '3vw' }}>Version & privacy info</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400" style={{ width: '5vw', height: '5vw' }} />
              </div>
            </button>

            <button
              onClick={() => router.push('/settings/health')}
              className="w-full bg-white shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left"
              style={{ borderRadius: '4vw', padding: '4vw' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center" style={{ gap: '3vw' }}>
                  <div className="bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center shadow" 
                    style={{ width: '10vw', height: '10vw', borderRadius: '2.5vw' }}>
                    <Heart className="text-white" style={{ width: '5vw', height: '5vw' }} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900" style={{ fontSize: '4vw' }}>Health Connect</h3>
                    <p className="text-gray-600" style={{ fontSize: '3vw' }}>Sync health data</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400" style={{ width: '5vw', height: '5vw' }} />
              </div>
            </button>
          </div>
        </div>

        {/* Data */}
        <div>
          <h2 className="font-semibold text-gray-900" style={{ fontSize: '4vw', marginBottom: '3vh' }}>Data</h2>
          
          <button
            onClick={() => setShowDeleteConfirmation(true)}
            className="w-full bg-white shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left"
            style={{ borderRadius: '4vw', padding: '4vw' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center" style={{ gap: '3vw' }}>
                <div className="bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow" 
                  style={{ width: '10vw', height: '10vw', borderRadius: '2.5vw' }}>
                  <Trash2 className="text-white" style={{ width: '5vw', height: '5vw' }} />
                </div>
                <div>
                  <h3 className="font-medium text-red-600" style={{ fontSize: '4vw' }}>Clear All Data</h3>
                  <p className="text-gray-600" style={{ fontSize: '3vw' }}>Remove all local data</p>
                </div>
              </div>
              <ChevronRight className="text-gray-400" style={{ width: '5vw', height: '5vw' }} />
            </div>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Clear All Data?</h3>
            <p className="text-gray-600 mb-6">This will permanently delete all your wellness data, including routines, pantry items, and chat history.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modals */}
      <NotificationPermissionModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />

      <NotificationDebugModal
        isOpen={showNotificationDebugModal}
        onClose={() => setShowNotificationDebugModal(false)}
      />
    </BottomNavLayout>
  );
}