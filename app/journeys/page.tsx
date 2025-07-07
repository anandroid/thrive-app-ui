'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Edit3, Calendar, TrendingUp, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { WellnessJourney } from '@/src/services/openai/types/journey';
import { getJourneysFromStorage, getDaysSinceLastEntry } from '@/src/utils/journeyStorage';
import { JourneyChat } from '@/components/features/JourneyChat';

export default function JourneysPage() {
  const router = useRouter();
  const [journeys, setJourneys] = useState<WellnessJourney[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<WellnessJourney | null>(null);

  useEffect(() => {
    loadJourneys();
    
    // Check if there's a selected journey from navigation
    const selectedJourneyId = sessionStorage.getItem('selectedJourneyId');
    if (selectedJourneyId) {
      sessionStorage.removeItem('selectedJourneyId');
      const journey = getJourneysFromStorage().find(j => j.id === selectedJourneyId);
      if (journey) {
        setSelectedJourney(journey);
      }
    }
  }, []);

  const loadJourneys = () => {
    const storedJourneys = getJourneysFromStorage();
    setJourneys(storedJourneys);
  };

  const handleJourneyUpdated = (updatedJourney: WellnessJourney) => {
    loadJourneys();
    return updatedJourney;
  };

  const getJourneyIcon = (type: string) => {
    switch (type) {
      case 'pain':
        return '🩹';
      case 'mental_health':
        return '🧠';
      case 'chronic_condition':
        return '🏥';
      default:
        return '📝';
    }
  };

  const getJourneyColor = (type: string) => {
    switch (type) {
      case 'pain':
        return 'from-rose/20 to-burgundy/15';
      case 'mental_health':
        return 'from-lavender/20 to-purple-500/15';
      case 'chronic_condition':
        return 'from-amber-400/20 to-orange-500/15';
      default:
        return 'from-sage-light/20 to-sage/15';
    }
  };

  if (selectedJourney) {
    return (
      <JourneyChat
        journey={selectedJourney}
        onBack={() => setSelectedJourney(null)}
        onJourneyUpdated={(updated) => {
          handleJourneyUpdated(updated);
          setSelectedJourney(updated);
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="app-header bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.push('/')}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-secondary-text">My Journeys</h1>
            <p className="text-xs text-secondary-text-thin">Track your story</p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {journeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sage-light/30 to-sage/20 flex items-center justify-center mb-4">
              <Edit3 className="w-10 h-10 text-sage-dark" />
            </div>
            <h2 className="text-xl font-semibold text-primary-text mb-2">No Journeys Yet</h2>
            <p className="text-secondary-text-thin text-center max-w-xs mb-2">
              Create your wellness journal to track health progress over time
            </p>
            <p className="text-xs text-secondary-text-thin text-center max-w-xs mb-6">
              Daily reflections, mood tracking, and personalized insights
            </p>
            <button
              onClick={() => router.push('/chat')}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sage to-sage-dark text-white font-medium shadow-lg hover:shadow-xl transition-all"
            >
              Start a Conversation
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {journeys.map((journey) => {
              const daysSince = getDaysSinceLastEntry(journey.id);
              const lastEntry = journey.entries[journey.entries.length - 1];
              
              return (
                <button
                  key={journey.id}
                  onClick={() => setSelectedJourney(journey)}
                  className="w-full text-left"
                >
                  <div className={`rounded-3xl bg-gradient-to-r ${getJourneyColor(journey.type)} p-6 shadow-lg hover:shadow-xl transition-all border border-gray-200/50`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">{getJourneyIcon(journey.type)}</div>
                        <div>
                          <h3 className="text-xl font-bold text-primary-text">{journey.title}</h3>
                          <p className="text-sm text-secondary-text-thin mt-1">{journey.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4 text-secondary-text-thin" />
                          <span className="text-secondary-text-thin">
                            {journey.entries.length} entries
                          </span>
                        </div>
                        {lastEntry && (
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-4 h-4 text-secondary-text-thin" />
                            <span className="text-secondary-text-thin">
                              Last: {daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince} days ago`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {journey.entries.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200/30">
                        <div className="flex space-x-2">
                          {journey.entries.slice(-5).map((entry) => (
                            <div
                              key={entry.id}
                              className="w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center text-sm"
                            >
                              {entry.mood === 'great' && '😊'}
                              {entry.mood === 'good' && '🙂'}
                              {entry.mood === 'okay' && '😐'}
                              {entry.mood === 'not_great' && '😔'}
                              {entry.mood === 'struggling' && '😢'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}