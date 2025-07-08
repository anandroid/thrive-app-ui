'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, Shield, Info, Moon, Heart, ChevronRight, Plus, Leaf, MessageSquare } from 'lucide-react';
import { AboutSection } from '@/components/features/AboutSection';
import { useRouter } from 'next/navigation';
import { getTouchClasses } from '@/hooks/useTouchFeedback';
import { TouchButton } from '@/components/ui/TouchButton';

export default function SettingsPage() {
  const [showAbout, setShowAbout] = useState(false);
  const router = useRouter();

  if (showAbout) {
    return (
      <div className="app-screen bg-gray-50">
        {/* Status Bar Area */}
        <div className="safe-area-top" />
        
        {/* Header */}
        <div className="app-header bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 h-14">
            <TouchButton 
              onClick={() => setShowAbout(false)}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100"
              variant="ghost"
              size="sm"
              haptic="light"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </TouchButton>
            <h1 className="text-lg font-semibold text-secondary-text">About</h1>
            <div className="w-10" />
          </div>
        </div>
        
        {/* About Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-6">
            <AboutSection />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-screen relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-soft-blush via-white to-soft-lavender/20" />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-sage-light/10 to-sage/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-gradient-to-tr from-rose/10 to-burgundy/10 blur-3xl" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Status Bar Area */}
        <div className="safe-area-top" />
        
        {/* Header */}
        <div className="app-header backdrop-blur-xl bg-white/70 border-b-0">
          <div className="flex items-center justify-between px-4 h-14">
            <Link 
              href="/"
              className={getTouchClasses(
                "w-10 h-10 rounded-full flex items-center justify-center bg-white/50 hover:bg-white/80 native-transition shadow-sm",
                { feedback: true, nativePress: true }
              )}
            >
              <ArrowLeft className="w-5 h-5 text-burgundy" />
            </Link>
            <h1 className="text-lg font-semibold text-primary-text">Settings</h1>
            <div className="w-10" />
          </div>
        </div>
        
        {/* Settings Content */}
        <div className="flex-1 app-content px-4 py-6">
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-primary-text mb-3">Quick Actions</h2>
              <div className="space-y-3">
                {/* First Row */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      sessionStorage.setItem('initialMessage', 'Create a wellness thriving for me');
                      router.push('/chat/new?intent=create_thriving');
                    }}
                    className={getTouchClasses(
                      "flex-1 rounded-2xl bg-gradient-to-br from-rose/10 to-burgundy/5 border border-rose/20 p-4 hover:shadow-md transition-all",
                      { feedback: true, ripple: true }
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose to-burgundy flex items-center justify-center flex-shrink-0">
                        <Plus className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-primary-text text-sm">Create Thriving</h3>
                        <p className="text-xs text-primary-text/60">New wellness plan</p>
                      </div>
                    </div>
                  </button>
                  
                </div>

                {/* Pantry - Full Width with Enhanced Design */}
                <Link
                  href="/pantry"
                  className={getTouchClasses(
                    "w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-dusty-rose/20 p-4 hover:shadow-lg transition-all block relative overflow-hidden shadow-sm group",
                    { feedback: true }
                  )}
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
                </Link>

                {/* Chat History - Full Width with Enhanced Design */}
                <Link
                  href="/chat-history"
                  className={getTouchClasses(
                    "w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-sage/20 p-4 hover:shadow-lg transition-all block relative overflow-hidden shadow-sm group",
                    { feedback: true }
                  )}
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
                </Link>
              </div>
            </div>

            {/* Wellness Profile - Hidden for now */}
            
            {/* Notifications - Hidden for now */}
            
            {/* Privacy & Security - Hidden for now */}
            
            {/* Dark Mode */}
            <div className={getTouchClasses(
              "rounded-2xl bg-white/80 backdrop-blur-sm border border-soft-lavender/20 p-4 shadow-sm",
              { feedback: true }
            )}>
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
            <button 
              onClick={() => setShowAbout(true)}
              className={getTouchClasses(
                "w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-dusty-rose/20 p-4 shadow-sm hover:shadow-md transition-all text-left",
                { feedback: true }
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dusty-rose to-rose flex items-center justify-center">
                    <Info className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-primary-text">About Thrive</h3>
                    <p className="text-sm text-primary-text/60">Learn about our philosophy</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          </div>
          
          {/* Footer */}
          <div className="mt-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-rose to-burgundy flex items-center justify-center shadow-xl shadow-rose/50">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <p className="text-sm text-primary-text/60">
              Made with love for you to thrive
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}