'use client';

import React, { useState, useEffect } from 'react';
import { Info, Moon, ChevronRight, Plus, Leaf, MessageSquare, Trash2, Bell, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TouchLink } from '@/components/ui/TouchLink';
import { AppLayout } from '@/components/layout/AppLayout';
import bridge from '@/src/lib/react-native-bridge';
import { NotificationHelper } from '@/src/utils/notificationHelper';
import { NotificationPermissionModal } from '@/components/features/NotificationPermissionModal';
import { NotificationDebugModal } from '@/components/features/NotificationDebugModal';
import Button from '@/components/ui/Button';

export default function SettingsPage() {
  const router = useRouter();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<'unknown' | 'enabled' | 'disabled'>('unknown');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showNotificationDebugModal, setShowNotificationDebugModal] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = () => {
    // Check if in React Native and if permissions were granted
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
        localStorage.setItem('notificationAskCount', '0'); // Reset ask count
        setNotificationStatus('enabled');
        
        // Schedule notifications for existing thrivings
        const thrivings = JSON.parse(localStorage.getItem('thrive_thrivings') || '[]');
        if (thrivings.length > 0) {
          await NotificationHelper.scheduleRoutineReminders(thrivings);
        }
      } else {
        localStorage.setItem('notificationPermissionGranted', 'false');
        setNotificationStatus('disabled');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  return (
    <>
      <AppLayout
        header={{
          showBackButton: true,
          backHref: "/",
          title: "Settings"
        }}
      >
      <div className="relative min-h-full">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-soft-blush via-white to-soft-lavender/20 -z-10" />
        
        {/* Decorative Elements */}
        <div className="absolute top-20 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-sage-light/10 to-sage/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-gradient-to-tr from-rose/10 to-burgundy/10 blur-3xl" />
        
        {/* Settings Content */}
        <div className="px-[min(5vw,1.25rem)] py-[min(4vw,1.5rem)] pb-20 relative">
          {/* Bottom fade gradient */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-transparent via-transparent to-white pointer-events-none" />
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-primary-text mb-3">Quick Actions</h2>
              <div className="space-y-3">
                {/* Create Thriving */}
                <TouchLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    sessionStorage.setItem('initialMessage', 'Create a wellness thriving for me');
                    router.push('/chat/new?intent=create_thriving');
                  }}
                  scale={0.97}
                  shadow="md"
                  cardGlow
                  hoverScale={1.01}
                  haptic="medium"
                  variant="card"
                  className="w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-rose/20 p-[min(5vw,1.25rem)] hover:shadow-lg transition-all block relative overflow-hidden shadow-sm group"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-rose/0 via-rose/5 to-burgundy/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Decorative elements */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-br from-rose/20 to-burgundy/15 blur-3xl opacity-60" />
                  <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-gradient-to-tr from-burgundy/15 to-rose/10 blur-2xl opacity-50" />
                  
                  <div className="flex items-center justify-between relative">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose to-burgundy flex items-center justify-center shadow-lg relative group-hover:shadow-xl transition-all">
                        <div className="absolute inset-0 bg-gradient-to-t from-burgundy/20 to-transparent rounded-full" />
                        <Plus className="w-5 h-5 text-white relative z-10" strokeWidth={2} />
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-primary-text text-sm">Create Thriving</h3>
                        <p className="text-xs text-primary-text/60">New wellness plan</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </TouchLink>

                {/* Pantry - Full Width with Enhanced Design */}
                <TouchLink
                  href="/pantry"
                  scale={0.97}
                  shadow="md"
                  cardGlow
                  hoverScale={1.01}
                  haptic="medium"
                  variant="card"
                  className="w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-dusty-rose/20 p-[min(5vw,1.25rem)] hover:shadow-lg transition-all block relative overflow-hidden shadow-sm group"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-dusty-rose/0 via-dusty-rose/5 to-rose/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Decorative elements */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-br from-dusty-rose/20 to-rose/15 blur-3xl opacity-60" />
                  <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-gradient-to-tr from-burgundy/15 to-dusty-rose/10 blur-2xl opacity-50" />
                  
                  <div className="flex items-center justify-between relative">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sage-light/80 to-sage flex items-center justify-center shadow-lg relative group-hover:shadow-xl transition-all">
                        <div className="absolute inset-0 bg-gradient-to-t from-sage-dark/20 to-transparent rounded-full" />
                        <span className="text-2xl relative z-10 filter brightness-110">🧺</span>
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-primary-text text-sm">My Pantry</h3>
                        <p className="text-xs text-primary-text/60">Your supplements & remedies</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </TouchLink>

                {/* Chat History - Full Width with Enhanced Design */}
                <TouchLink
                  href="/chat-history"
                  scale={0.97}
                  shadow="md"
                  cardGlow
                  hoverScale={1.01}
                  haptic="medium"
                  variant="card"
                  className="w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-sage/20 p-[min(5vw,1.25rem)] hover:shadow-lg transition-all block relative overflow-hidden shadow-sm group"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-sage-light/0 via-sage/5 to-sage-dark/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Decorative elements */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-br from-sage/20 to-sage-dark/15 blur-3xl opacity-60" />
                  <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-gradient-to-tr from-sage-dark/15 to-sage/10 blur-2xl opacity-50" />
                  
                  <div className="flex items-center justify-between relative">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center shadow-lg relative group-hover:shadow-xl transition-all">
                        <div className="absolute inset-0 bg-gradient-to-t from-sage-dark/20 to-transparent rounded-full" />
                        <MessageSquare className="w-5 h-5 text-white relative z-10" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-primary-text text-sm">Chat History</h3>
                        <p className="text-xs text-primary-text/60">View past conversations</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </TouchLink>
              </div>
            </div>

            {/* Wellness Profile - Hidden for now */}
            
            {/* Notifications */}
            {bridge.isInReactNative() && (
              <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-rose/20 p-[min(5vw,1.25rem)] shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose to-burgundy flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-primary-text">Notifications</h3>
                      <p className="text-sm text-primary-text/60">
                        {notificationStatus === 'enabled' ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                  {notificationStatus === 'disabled' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowNotificationModal(true)}
                        variant="gradient"
                        gradient={{
                          from: 'dusty-rose',
                          to: 'dusty-rose',
                          hoverFrom: 'burgundy',
                          hoverTo: 'burgundy',
                          activeFrom: 'dusty-rose/80',
                          activeTo: 'dusty-rose/80'
                        }}
                        springAnimation
                        gradientOverlay
                        cardGlow
                        haptic="light"
                        size="sm"
                        className="text-sm font-medium"
                      >
                        Modal
                      </Button>
                      <Button
                        onClick={() => setShowNotificationDebugModal(true)}
                        variant="gradient"
                        gradient={{
                          from: 'blue-500',
                          to: 'purple-600',
                          hoverFrom: 'blue-600',
                          hoverTo: 'purple-700',
                          activeFrom: 'blue-400',
                          activeTo: 'purple-500'
                        }}
                        springAnimation
                        gradientOverlay
                        cardGlow
                        haptic="light"
                        size="sm"
                        className="text-sm font-medium text-white"
                      >
                        Debug
                      </Button>
                      <Button
                        onClick={handleEnableNotifications}
                        disabled={isRequestingPermission}
                        loading={isRequestingPermission}
                        variant="gradient"
                        gradient={{
                          from: 'rose',
                          to: 'rose',
                          hoverFrom: 'burgundy',
                          hoverTo: 'burgundy',
                          activeFrom: 'rose/80',
                          activeTo: 'rose/80'
                        }}
                        springAnimation
                        gradientOverlay
                        cardGlow
                        haptic="medium"
                        size="sm"
                        className="text-sm font-medium"
                      >
                        {isRequestingPermission ? 'Requesting...' : 'Enable'}
                      </Button>
                    </div>
                  )}
                  {notificationStatus === 'enabled' && (
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => setShowNotificationDebugModal(true)}
                        variant="gradient"
                        gradient={{
                          from: 'blue-500',
                          to: 'purple-600',
                          hoverFrom: 'blue-600',
                          hoverTo: 'purple-700',
                          activeFrom: 'blue-400',
                          activeTo: 'purple-500'
                        }}
                        springAnimation
                        gradientOverlay
                        cardGlow
                        haptic="light"
                        size="sm"
                        className="text-sm font-medium text-white"
                      >
                        Debug
                      </Button>
                      <span className="text-sm text-sage-dark">✓</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Health Data - Only show in React Native */}
            {bridge.isInReactNative() && (
              <TouchLink
                href="/settings/health"
                scale={0.97}
                shadow="md"
                cardGlow
                hoverScale={1.01}
                haptic="medium"
                variant="card"
                className="w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-rose/20 p-[min(5vw,1.25rem)] hover:shadow-lg transition-all block relative overflow-hidden shadow-sm group"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-rose/0 via-rose/5 to-burgundy/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Decorative elements */}
                <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-br from-rose/20 to-burgundy/15 blur-3xl opacity-60" />
                <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-gradient-to-tr from-burgundy/15 to-rose/10 blur-2xl opacity-50" />
                
                <div className="flex items-center justify-between relative">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose to-burgundy flex items-center justify-center shadow-lg relative group-hover:shadow-xl transition-all">
                      <div className="absolute inset-0 bg-gradient-to-t from-burgundy/20 to-transparent rounded-full" />
                      <Heart className="w-5 h-5 text-white relative z-10" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-primary-text text-sm">Health Data</h3>
                      <p className="text-xs text-primary-text/60">
                        {typeof window !== 'undefined' && localStorage.getItem('healthDataConnected') === 'true'
                          ? navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad') 
                            ? 'Apple Health connected' 
                            : 'Google Fit connected'
                          : 'Connect health apps'
                        }
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </TouchLink>
            )}
            
            {/* Privacy & Security - Hidden for now */}
            
            {/* Dark Mode */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-soft-lavender/20 p-[min(5vw,1.25rem)] shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-soft-lavender to-burgundy flex items-center justify-center">
                    <Moon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-primary-text">Dark Mode</h3>
                    <p className="text-sm text-primary-text/60">Coming soon</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* About */}
            <TouchLink
              href="/settings/about"
              scale={0.97}
              shadow="md"
              cardGlow
              hoverScale={1.01}
              haptic="medium"
              variant="card"
              className="w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-dusty-rose/20 p-[min(5vw,1.25rem)] hover:shadow-lg transition-all block relative overflow-hidden shadow-sm group"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-dusty-rose/0 via-dusty-rose/5 to-rose/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Decorative elements */}
              <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-br from-dusty-rose/20 to-rose/15 blur-3xl opacity-60" />
              <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-gradient-to-tr from-rose/15 to-dusty-rose/10 blur-2xl opacity-50" />
              
              <div className="flex items-center justify-between relative">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dusty-rose to-rose flex items-center justify-center shadow-lg relative group-hover:shadow-xl transition-all">
                    <div className="absolute inset-0 bg-gradient-to-t from-rose/20 to-transparent rounded-full" />
                    <Info className="w-5 h-5 text-white relative z-10" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-primary-text text-sm">About Thrive</h3>
                    <p className="text-xs text-primary-text/60">Learn about our philosophy</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </TouchLink>
          </div>
          
          {/* Footer */}
          <div className="mt-12 text-center pb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-rose to-burgundy flex items-center justify-center">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <p className="text-sm text-primary-text/60">
              Made with love for you to thrive
            </p>
            
            {/* Delete Data - Subtle Option */}
            <Button
              onClick={() => setShowDeleteConfirmation(true)}
              variant="ghost"
              springAnimation
              haptic="light"
              className="mt-8 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Delete All Data
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-[min(5vw,1.25rem)] bg-black/50 animate-fade-in">
          <div className="bg-white rounded-3xl p-[min(5vw,1.5rem)] max-w-sm w-full shadow-2xl animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-primary-text mb-2">Delete All Data?</h2>
              <p className="text-sm text-secondary-text">
                This will permanently delete all your data including:
              </p>
              <ul className="text-sm text-secondary-text mt-3 space-y-1 text-left max-w-[250px] mx-auto">
                <li>• All wellness routines and journals</li>
                <li>• Your pantry items</li>
                <li>• Chat history and conversations</li>
                <li>• All personal settings</li>
              </ul>
              <p className="text-sm text-red-600 mt-4 font-medium">
                This action cannot be undone!
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowDeleteConfirmation(false)}
                variant="gradient"
                gradient={{
                  from: 'gray-100',
                  to: 'gray-100',
                  hoverFrom: 'gray-200',
                  hoverTo: 'gray-200',
                  activeFrom: 'gray-300',
                  activeTo: 'gray-300'
                }}
                springAnimation
                gradientOverlay
                haptic="light"
                className="flex-1 text-gray-700 font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Clear all data
                  localStorage.clear();
                  sessionStorage.clear();
                  
                  // Clear IndexedDB if used
                  if ('indexedDB' in window) {
                    indexedDB.databases().then(databases => {
                      databases.forEach(db => {
                        if (db.name) {
                          indexedDB.deleteDatabase(db.name);
                        }
                      });
                    });
                  }
                  
                  // Navigate to home page (will show welcome screen)
                  window.location.href = '/';
                }}
                variant="gradient"
                gradient={{
                  from: 'red-600',
                  to: 'red-600',
                  hoverFrom: 'red-700',
                  hoverTo: 'red-700',
                  activeFrom: 'red-800',
                  activeTo: 'red-800'
                }}
                springAnimation
                gradientOverlay
                cardGlow
                haptic="heavy"
                className="flex-1 text-white font-medium"
              >
                Delete Everything
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notification Permission Modal */}
        <NotificationPermissionModal
          isOpen={showNotificationModal}
          onClose={() => {
            setShowNotificationModal(false);
            checkNotificationStatus(); // Refresh status after modal closes
          }}
          onPermissionGranted={() => {
            // Schedule notifications for existing thrivings
            const thrivings = JSON.parse(localStorage.getItem('thrive_thrivings') || '[]');
            if (thrivings.length > 0) {
              NotificationHelper.scheduleRoutineReminders(thrivings);
            }
          }}
        />

      {/* Notification Debug Modal */}
      <NotificationDebugModal
        isOpen={showNotificationDebugModal}
        onClose={() => setShowNotificationDebugModal(false)}
      />
      </AppLayout>
    </>
  );
}