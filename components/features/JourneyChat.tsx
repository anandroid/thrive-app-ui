'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Leaf, Edit3 } from 'lucide-react';
import { WellnessJourney, MoodType, MoodOption, JourneyEntry } from '@/src/services/openai/types/journey';
import { addJourneyEntry, getDaysSinceLastEntry, getRecentEntries } from '@/src/utils/journeyStorage';

interface JourneyChatProps {
  journey: WellnessJourney;
  onBack: () => void;
  onJourneyUpdated?: (journey: WellnessJourney) => void;
}

const DEFAULT_MOOD_OPTIONS: MoodOption[] = [
  { type: 'great', emoji: '😊', label: 'Great', color: 'from-green-400 to-green-500' },
  { type: 'good', emoji: '🙂', label: 'Good', color: 'from-sage-300 to-sage-400' },
  { type: 'okay', emoji: '😐', label: 'Okay', color: 'from-amber-400 to-amber-500' },
  { type: 'not_great', emoji: '😔', label: 'Not Great', color: 'from-orange-400 to-orange-500' },
  { type: 'struggling', emoji: '😢', label: 'Struggling', color: 'from-rose-500 to-burgundy-700' }
];

export const JourneyChat: React.FC<JourneyChatProps> = ({ journey, onBack, onJourneyUpdated }) => {
  const [checkInData, setCheckInData] = useState<{
    openingMessage: string;
    moodOptions: MoodOption[];
    followUpQuestions: string[];
  } | null>(null);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [painLevel, setPainLevel] = useState<number>(5);
  const [notes, setNotes] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);

  useEffect(() => {
    fetchCheckInData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey.id]);

  const fetchCheckInData = async () => {
    try {
      const daysSinceLastEntry = getDaysSinceLastEntry(journey.id);
      const recentEntries = getRecentEntries(journey.id, 7);
      const previousMood = recentEntries[0]?.mood;
      const recentSymptoms = recentEntries.flatMap(e => e.symptoms || []);

      const response = await fetch('/api/journey/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journeyType: journey.type,
          journeyTitle: journey.title,
          previousMood,
          daysSinceLastEntry,
          recentSymptoms: [...new Set(recentSymptoms)].slice(0, 5)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCheckInData(data);
      } else {
        // Use defaults if API fails
        setCheckInData({
          openingMessage: `How are you feeling today with your ${journey.title}?`,
          moodOptions: DEFAULT_MOOD_OPTIONS,
          followUpQuestions: []
        });
      }
    } catch (error) {
      console.error('Error fetching check-in data:', error);
      setCheckInData({
        openingMessage: `How are you feeling today with your ${journey.title}?`,
        moodOptions: DEFAULT_MOOD_OPTIONS,
        followUpQuestions: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoodSelect = (mood: MoodType) => {
    setSelectedMood(mood);
    setShowQuestions(true);
  };

  const handleSaveEntry = async () => {
    if (!selectedMood) return;

    setIsSaving(true);
    
    const entry: JourneyEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      mood: selectedMood,
      painLevel: journey.type === 'pain' ? painLevel : undefined,
      symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : undefined,
      notes
    };

    const success = addJourneyEntry(journey.id, entry);
    
    if (success) {
      // Reset form
      setSelectedMood(null);
      setNotes('');
      setSelectedSymptoms([]);
      setShowQuestions(false);
      
      // Refresh check-in data
      await fetchCheckInData();
      
      // Notify parent of update
      onJourneyUpdated?.({
        ...journey,
        entries: [...journey.entries, entry],
        updatedAt: new Date()
      });
    }
    
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sage-light to-sage opacity-50" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="app-header bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center space-x-2">
            <Edit3 className="w-5 h-5 text-sage-600" />
            <h1 className="text-lg font-semibold text-secondary-text">{journey.title}</h1>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6">
          {/* Wellness Companion Message */}
          <div className="mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sage-light to-sage flex items-center justify-center shadow-sm">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-burgundy-700">Wellness Companion</p>
                  <p className="text-xs text-secondary-text-thin italic">Track your story</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-md">
                  <p className="text-gray-700">{checkInData?.openingMessage}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mood Selection */}
          {!selectedMood && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4 text-center">How are you feeling right now?</p>
              <div className="grid grid-cols-5 gap-3">
                {(checkInData?.moodOptions || DEFAULT_MOOD_OPTIONS).map((option) => (
                  <button
                    key={option.type}
                    onClick={() => handleMoodSelect(option.type)}
                    className="flex flex-col items-center p-3 rounded-xl bg-white hover:shadow-lg transition-all group"
                  >
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${option.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                      <span className="text-2xl">{option.emoji}</span>
                    </div>
                    <span className="text-xs text-gray-600">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Mood & Questions */}
          {selectedMood && showQuestions && (
            <div className="space-y-4">
              {/* Selected Mood Display */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Your mood:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">
                      {checkInData?.moodOptions.find(m => m.type === selectedMood)?.emoji}
                    </span>
                    <span className="font-medium text-gray-700">
                      {checkInData?.moodOptions.find(m => m.type === selectedMood)?.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pain Level (for pain journeys) */}
              {journey.type === 'pain' && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <label className="block text-sm text-gray-600 mb-3">
                    Pain level (1-10):
                  </label>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">1</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={painLevel}
                      onChange={(e) => setPainLevel(parseInt(e.target.value))}
                      className="flex-1 mx-3"
                    />
                    <span className="text-sm">10</span>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-2xl font-bold text-gray-700">{painLevel}</span>
                  </div>
                </div>
              )}

              {/* Follow-up Questions */}
              {checkInData?.followUpQuestions && checkInData.followUpQuestions.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-sm text-gray-600 mb-3">
                    {checkInData.followUpQuestions[0]}
                  </p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all resize-none"
                    rows={4}
                  />
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSaveEntry}
                disabled={isSaving || !notes.trim()}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-sage to-sage-dark text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
              >
                {isSaving ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          )}

          {/* Recent Entries Preview */}
          {journey.entries.length > 0 && !showQuestions && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-600 mb-3">Recent Entries</h3>
              <div className="space-y-2">
                {journey.entries.slice(-3).reverse().map((entry) => (
                  <div key={entry.id} className="bg-white rounded-xl p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </span>
                      <span className="text-lg">
                        {DEFAULT_MOOD_OPTIONS.find(m => m.type === entry.mood)?.emoji}
                      </span>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-gray-600 line-clamp-2">{entry.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};