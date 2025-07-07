'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, Shield, Info, Moon, Sparkles, Heart } from 'lucide-react';

export default function SettingsPage() {
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
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 hover:bg-white/80 native-transition shadow-sm"
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
            {/* Wellness Profile */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-rose/10 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose to-burgundy flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-primary-text">Wellness Profile</h3>
                    <p className="text-sm text-primary-text/60">Manage your health goals</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Notifications */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-sage/10 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-primary-text">Notifications</h3>
                    <p className="text-sm text-primary-text/60">Routine reminders</p>
                  </div>
                </div>
                <div className="w-12 h-7 bg-gradient-to-r from-rose to-burgundy rounded-full p-1">
                  <div className="w-5 h-5 bg-white rounded-full translate-x-5 transition-transform" />
                </div>
              </div>
            </div>
            
            {/* Privacy */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-burgundy/10 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-burgundy to-dark-burgundy flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-primary-text">Privacy & Security</h3>
                    <p className="text-sm text-primary-text/60">Manage your data</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Dark Mode */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-soft-lavender/20 p-4 shadow-sm">
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
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-dusty-rose/20 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dusty-rose to-rose flex items-center justify-center">
                    <Info className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-primary-text">About Thrive</h3>
                    <p className="text-sm text-primary-text/60">Version 1.0.0</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-rose/20 to-burgundy/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-gradient-primary" />
            </div>
            <p className="text-sm text-primary-text/60">
              Made with love for your wellness journey
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}