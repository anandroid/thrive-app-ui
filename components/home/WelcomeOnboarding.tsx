'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/form-inputs';

interface WelcomeOnboardingProps {
  onComplete: (name: string, concerns: string[]) => void;
}

type Screen = 'welcome' | 'concerns' | 'quickstart';

interface ConcernOption {
  id: string;
  text: string;
  recommended?: boolean;
}

export function WelcomeOnboarding({ onComplete }: WelcomeOnboardingProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [userName, setUserName] = useState('');
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [customConcern, setCustomConcern] = useState('');

  const concerns: ConcernOption[] = [
    { id: 'sleep', text: "I&apos;m having trouble sleeping", recommended: true },
    { id: 'anxiety', text: "I feel anxious all the time" },
    { id: 'energy', text: "I have no energy during the day" },
    { id: 'pain', text: "My back pain won&apos;t go away" }
  ];

  const handleConcernSelect = (concernId: string) => {
    if (selectedConcerns.includes(concernId)) {
      setSelectedConcerns(selectedConcerns.filter(id => id !== concernId));
    } else {
      setSelectedConcerns([...selectedConcerns, concernId]);
    }
  };

  const handleCustomConcernSubmit = () => {
    if (customConcern.trim()) {
      setSelectedConcerns([...selectedConcerns, customConcern]);
      setCustomConcern('');
    }
  };

  const handleContinue = () => {
    if (currentScreen === 'welcome') {
      setCurrentScreen('concerns');
    } else if (currentScreen === 'concerns' && selectedConcerns.length > 0) {
      setCurrentScreen('quickstart');
    }
  };

  const handleComplete = () => {
    onComplete(userName || 'Friend', selectedConcerns);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Welcome Screen */}
      {currentScreen === 'welcome' && (
        <div className="flex flex-col items-center justify-center min-h-screen text-center" style={{ padding: '0 6vw' }}>
          <div className="mb-8">
            <div className="relative mx-auto" style={{ width: '20vw', height: '20vw', marginBottom: '6vh' }}>
              <Image 
                src="/leaf_wireframe.png" 
                alt="Thrive Logo" 
                fill
                className="object-contain"
              />
            </div>
            <h1 className="font-bold text-gray-900" style={{ fontSize: '8vw', marginBottom: '2vh' }}>
              Thrive
            </h1>
            <p className="text-gray-600" style={{ fontSize: '4vw' }}>Welcome!</p>
          </div>

          <div className="relative mx-auto" style={{ width: '16vw', height: '16vw', marginBottom: '8vh' }}>
            <Image 
              src="/leaf_wireframe.png" 
              alt="Thrive Icon" 
              fill
              className="object-contain opacity-20"
            />
          </div>

          <h2 className="font-bold text-gray-900" style={{ fontSize: '6vw', marginBottom: '4vh' }}>
            Start Your Wellness Journey
          </h2>
          <p className="text-gray-600" style={{ fontSize: '4vw', marginBottom: '8vh' }}>
            Tell me what&apos;s bothering you and I&apos;ll create your personalized plan
          </p>

          <button
            onClick={handleContinue}
            className="w-full max-w-sm bg-purple-600 text-white rounded-2xl py-4 px-6 font-semibold hover:bg-purple-700 transition-all duration-200 shadow-sm"
          >
            Get Started
          </button>
        </div>
      )}

      {/* Concerns Screen */}
      {currentScreen === 'concerns' && (
        <div className="flex flex-col min-h-screen px-6 pt-12 pb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              What brings you here?
            </h2>
            <p className="text-gray-600">
              Select what concerns you most
            </p>
          </div>

          <div className="flex-1 space-y-3">
            {concerns.map((concern) => (
              <button
                key={concern.id}
                onClick={() => handleConcernSelect(concern.id)}
                className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left flex items-center justify-between ${
                  selectedConcerns.includes(concern.id)
                    ? 'bg-purple-600 text-white border-transparent'
                    : concern.recommended
                    ? 'bg-pink-50 border-pink-200 hover:border-pink-300'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="font-medium">{concern.text}</span>
                {concern.recommended && !selectedConcerns.includes(concern.id) && (
                  <span className="text-xs bg-pink-200 text-pink-700 px-2 py-1 rounded-full">
                    Recommended for you
                  </span>
                )}
                {selectedConcerns.includes(concern.id) && (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            ))}

            <div className="relative pt-8 pb-4">
              <div className="absolute top-12 left-0 right-0 border-t border-gray-200"></div>
              <p className="relative bg-white px-4 text-sm text-gray-500 text-center w-fit mx-auto">
                or
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Input
                  value={customConcern}
                  onChange={(e) => setCustomConcern(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomConcernSubmit()}
                  placeholder="Type your own concern"
                  className="w-full pl-10 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 transition-colors"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
                  <path d="M8 9H16M8 13H14M18 3H6C4.89543 3 4 3.89543 4 5V15C4 16.1046 4.89543 17 6 17H7L10 20V17H18C19.1046 17 20 16.1046 20 15V5C20 3.89543 19.1046 3 18 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <button
            onClick={handleContinue}
            disabled={selectedConcerns.length === 0}
            className={`w-full rounded-2xl py-4 px-6 font-semibold transition-all duration-200 shadow-lg mt-6 ${
              selectedConcerns.length > 0
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </div>
      )}

      {/* Quick Start Screen */}
      {currentScreen === 'quickstart' && (
        <div className="flex flex-col min-h-screen px-6 pt-12 pb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Quick Start
            </h2>
            <p className="text-gray-600">
              Let&apos;s get you set up quickly
            </p>
          </div>

          <div className="flex-1 space-y-4">
            <button
              onClick={handleComplete}
              className="w-full bg-green-50 border-2 border-green-200 rounded-2xl p-5 text-left hover:border-green-300 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 7V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V7" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 11V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M9 13.5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Add Your Supplements</h3>
                  <p className="text-sm text-gray-600 mt-1">Track what you already take</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
                  <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>

            <button
              onClick={handleComplete}
              className="w-full bg-purple-50 border-2 border-purple-200 rounded-2xl p-5 text-left hover:border-purple-300 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M3 9H21" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 2V6M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Create Wellness Routine</h3>
                  <p className="text-sm text-gray-600 mt-1">Build your first Thriving</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
                  <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>

            <button
              onClick={handleComplete}
              className="w-full bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 text-left hover:border-blue-300 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2ZM12 7C9.8 7 8 8.8 8 11C8 12.7 8.8 14.2 10 15.2V22H14V15.2C15.2 14.2 16 12.7 16 11C16 8.8 14.2 7 12 7Z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Browse Remedies</h3>
                  <p className="text-sm text-gray-600 mt-1">Discover natural solutions</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
                  <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
          </div>

          <div className="mt-8">
            <Input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="What should I call you? (optional)"
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-purple-400 transition-colors text-center"
            />
          </div>

          <button
            onClick={handleComplete}
            className="w-full bg-purple-600 text-white rounded-2xl py-4 px-6 font-semibold hover:bg-purple-700 transition-all duration-200 shadow-sm mt-4"
          >
            Start My Journey
          </button>
        </div>
      )}
    </div>
  );
}