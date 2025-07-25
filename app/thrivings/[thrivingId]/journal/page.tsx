'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Pencil } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
  getThrivingById, 
  getJournalByThrivingId, 
  createJournalForThriving,
  addJournalEntry
} from '@/src/utils/thrivingStorage';
import { Thriving, ThrivingJournal, JournalEntry, UserLearningProfile } from '@/src/types/thriving';
import { JournalEditor } from '@/components/ui/JournalEditor';
import { SmartJournalModal } from '@/components/journal/SmartJournalModal';
import { UserLearningProfileManager } from '@/src/lib/userLearningProfile';
import { JournalInsightsEngine } from '@/src/lib/journalInsights';
import Button from '@/components/ui/Button';

const moodOptions = [
  { type: 'great', emoji: '😊', label: 'Great', color: 'text-green-600' },
  { type: 'good', emoji: '🙂', label: 'Good', color: 'text-blue-600' },
  { type: 'okay', emoji: '😐', label: 'Okay', color: 'text-gray-600' },
  { type: 'difficult', emoji: '😔', label: 'Difficult', color: 'text-orange-600' },
  { type: 'challenging', emoji: '😰', label: 'Challenging', color: 'text-red-500' }
] as const;

export default function JournalPage({ params }: { params: Promise<{ thrivingId: string }> }) {
  const router = useRouter();
  const { thrivingId } = use(params);
  const [thriving, setThriving] = useState<Thriving | null>(null);
  const [journal, setJournal] = useState<ThrivingJournal | null>(null);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [showSmartJournal, setShowSmartJournal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserLearningProfile | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [newEntry, setNewEntry] = useState({
    mood: '' as JournalEntry['mood'],
    moodEmoji: '',
    content: '',
    painLevel: undefined as number | undefined,
    symptoms: [] as string[],
    gratitude: [] as string[]
  });
  const [currentGratitude, setCurrentGratitude] = useState('');
  const [currentSymptom, setCurrentSymptom] = useState('');

  useEffect(() => {
    // Load thriving
    const thrivingData = getThrivingById(thrivingId);
    if (!thrivingData) {
      router.push('/');
      return;
    }
    setThriving(thrivingData);
    
    // Debug: Log the journal template
    console.log('Thriving loaded:', {
      id: thrivingData.id,
      title: thrivingData.title,
      hasJournalTemplate: !!thrivingData.journalTemplate,
      journalTemplate: thrivingData.journalTemplate
    });

    // Load or create journal
    let journalData = getJournalByThrivingId(thrivingId);
    if (!journalData) {
      journalData = createJournalForThriving(thrivingId);
    }
    setJournal(journalData);

    // Load user learning profile
    const profile = UserLearningProfileManager.getUserProfile();
    setUserProfile(profile);

    // Generate insights if we have enough data
    if (journalData && journalData.entries.length >= 5) {
      const insights = JournalInsightsEngine.generateJournalInsights(journalData.entries, thrivingData);
      // Update journal with insights
      journalData.insights = insights;
      setJournal({...journalData});
    }
  }, [thrivingId, router]);

  const handleMoodSelect = (mood: typeof moodOptions[number]) => {
    setNewEntry({
      ...newEntry,
      mood: mood.type as JournalEntry['mood'],
      moodEmoji: mood.emoji
    });
  };

  const handleAddGratitude = () => {
    if (currentGratitude.trim()) {
      setNewEntry({
        ...newEntry,
        gratitude: [...newEntry.gratitude, currentGratitude.trim()]
      });
      setCurrentGratitude('');
    }
  };

  const handleAddSymptom = () => {
    if (currentSymptom.trim()) {
      setNewEntry({
        ...newEntry,
        symptoms: [...newEntry.symptoms, currentSymptom.trim()]
      });
      setCurrentSymptom('');
    }
  };

  const handleSaveEntry = () => {
    if (!newEntry.mood) return;

    addJournalEntry(thrivingId, {
      date: new Date().toISOString(),
      mood: newEntry.mood,
      moodEmoji: newEntry.moodEmoji,
      content: newEntry.content,
      painLevel: newEntry.painLevel,
      symptoms: newEntry.symptoms,
      gratitude: newEntry.gratitude,
      tags: []
    });

    // Refresh journal and update learning profile
    refreshJournalData();

    // Reset form
    setNewEntry({
      mood: '' as JournalEntry['mood'],
      moodEmoji: '',
      content: '',
      painLevel: undefined,
      symptoms: [],
      gratitude: []
    });
    setShowNewEntry(false);
  };

  const handleSmartJournalClose = () => {
    setShowSmartJournal(false);
    refreshJournalData();
  };

  const refreshJournalData = () => {
    // Refresh journal
    const updatedJournal = getJournalByThrivingId(thrivingId);
    setJournal(updatedJournal);

    // Update learning profile
    if (updatedJournal && thriving) {
      const updatedProfile = UserLearningProfileManager.updateProfileFromJournalEntries(
        updatedJournal.entries,
        [thriving]
      );
      setUserProfile(updatedProfile);

      // Generate new insights
      if (updatedJournal.entries.length >= 5) {
        const insights = JournalInsightsEngine.generateJournalInsights(updatedJournal.entries, thriving);
        updatedJournal.insights = insights;
        setJournal({...updatedJournal});
      }
    }
  };


  if (!thriving || !journal) {
    return null;
  }

  const recentEntries = journal.entries.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <AppLayout
      header={{
        showBackButton: true,
        backHref: `/thrivings?id=${thrivingId}`,
        title: 'Journal'
      }}
    >
      {/* Thriving Badge Section */}
      <div className="px-[min(5vw,1.25rem)] pt-[min(6vw,1.5rem)]">
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-[min(2vw,0.5rem)] px-[min(5vw,1.25rem)] py-[min(2.5vw,0.625rem)] bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full border border-orange-200">
            <span className="text-[min(5vw,1.25rem)]">☀️</span>
            <span className="text-[min(3.75vw,0.9375rem)] font-medium text-gray-800">{thriving.title}</span>
          </div>
        </div>
        
        {/* Week Summary */}
        <div className="mt-[min(4vw,1rem)] text-center">
          <p className="text-[min(4vw,1rem)] text-green-600 font-medium">
            {journal.totalEntries} {journal.totalEntries === 1 ? 'entry' : 'entries'} this week • Keep it up!
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-[min(5vw,1.25rem)] py-[min(6vw,1.5rem)] space-y-[min(4vw,1rem)]">

        {/* AI Journal Prompt Card */}
        {!showNewEntry && (
          <div className="relative overflow-hidden rounded-[min(6vw,1.5rem)] bg-gradient-to-br from-purple-500 via-purple-400 to-pink-400 p-[min(6vw,1.5rem)]">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-[min(5vw,1.25rem)] font-semibold text-white mb-[min(1vw,0.25rem)]">
                  Ready to reflect?
                </h3>
                <p className="text-[min(4vw,1rem)] text-white/90">
                  AI guides your journey
                </p>
              </div>
              <Button
                onClick={() => setShowSmartJournal(true)}
                springAnimation
                gradientOverlay
                cardGlow
                haptic="medium"
                className="bg-white text-purple-600 font-semibold px-[min(6vw,1.5rem)] py-[min(3vw,0.75rem)] rounded-full flex items-center gap-[min(2vw,0.5rem)] shadow-lg"
              >
                <span className="text-[min(4.5vw,1.125rem)]">✨</span>
                <span className="text-[min(4vw,1rem)]">Start Entry</span>
              </Button>
            </div>
          </div>
        )}

        {/* Quick Action Button */}
        {!showNewEntry && (
          <div className="flex justify-center">
            <Button
              onClick={() => setShowNewEntry(true)}
              variant="outline"
              springAnimation
              gradientOverlay
              cardGlow
              haptic="light"
              className="bg-white border border-gray-200 text-gray-700 px-[min(8vw,2rem)] py-[min(3.5vw,0.875rem)] rounded-[min(4vw,1rem)] flex items-center justify-center gap-[min(2vw,0.5rem)] shadow-sm"
            >
              <Pencil className="w-[min(4vw,1rem)] h-[min(4vw,1rem)]" />
              <span className="text-[min(3.75vw,0.9375rem)] font-medium">Quick Note</span>
            </Button>
          </div>
        )}

        {/* Progress Insights - Show First When Available */}
        {journal.totalEntries > 0 && journal.insights && userProfile && userProfile.dataPoints >= 5 && !showNewEntry && (
          <div className="mb-[min(6vw,1.5rem)]">
            <div className="rounded-[min(4vw,1rem)] bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-[min(5vw,1.25rem)]">
              <div className="flex items-center justify-between mb-[min(4vw,1rem)]">
                <div className="flex items-center gap-[min(3vw,0.75rem)]">
                  <div className="w-[min(10vw,2.5rem)] h-[min(10vw,2.5rem)] rounded-[min(2.5vw,0.625rem)] bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                    <TrendingUp className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[min(4vw,1rem)] text-gray-900">Your Progress</h3>
                    <p className="text-[min(3vw,0.75rem)] text-gray-600">AI-powered insights</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInsights(!showInsights)}
                  className="text-[min(3.5vw,0.875rem)] text-blue-600 font-medium touch-feedback"
                >
                  {showInsights ? 'Less' : 'More'}
                </button>
              </div>
              
              {journal.insights.celebratoryInsights.length > 0 && (
                <div className="space-y-[min(3vw,0.75rem)]">
                  {journal.insights.celebratoryInsights.slice(0, showInsights ? undefined : 1).map((insight, index) => (
                    <div key={index} className="bg-white/70 backdrop-blur-sm p-[min(4vw,1rem)] rounded-[min(3vw,0.75rem)]">
                      <p className="text-[min(3.5vw,0.875rem)] text-gray-700 leading-relaxed">
                        {insight}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {showInsights && journal.insights.recommendations.length > 0 && (
                <div className="mt-[min(4vw,1rem)] space-y-[min(3vw,0.75rem)]">
                  <h4 className="font-medium text-[min(3.5vw,0.875rem)] text-gray-700">Personalized Recommendations</h4>
                  {journal.insights.recommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="bg-white/70 backdrop-blur-sm p-[min(4vw,1rem)] rounded-[min(3vw,0.75rem)] space-y-[min(2vw,0.5rem)]">
                      <p className="text-[min(3.5vw,0.875rem)] text-gray-800 font-medium">{rec.suggestion}</p>
                      <p className="text-[min(3vw,0.75rem)] text-gray-600">{rec.reasoning}</p>
                      <div className="flex items-center gap-[min(2vw,0.5rem)]">
                        <div className="flex-1 bg-gray-200 rounded-full h-[min(1.5vw,0.375rem)]">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-indigo-600 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${rec.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-[min(3vw,0.75rem)] text-gray-600 font-medium">
                          {Math.round(rec.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Beautiful Entry Form */}
        {showNewEntry && (
          <div className="pb-[min(6vw,1.5rem)]">
            <div className="bg-white rounded-[min(5vw,1.25rem)] p-[min(6vw,1.5rem)] space-y-[min(5vw,1.25rem)] shadow-lg border border-gray-100">
              <div className="text-center mb-[min(2vw,0.5rem)]">
                <h3 className="font-bold text-[min(5.5vw,1.375rem)] text-gray-900">How are you feeling?</h3>
                <p className="text-[min(3.5vw,0.875rem)] text-gray-600 mt-[min(1vw,0.25rem)]">Select your mood to begin</p>
              </div>
            
            {/* Mood Selection - Beautiful grid */}
            <div className="grid grid-cols-5 gap-[min(2vw,0.5rem)]">
              {moodOptions.map((mood) => (
                <button
                  key={mood.type}
                  onClick={() => handleMoodSelect(mood)}
                  className={`relative flex flex-col items-center justify-center rounded-[min(3vw,0.75rem)] transition-all active:scale-95 touch-feedback ${
                    newEntry.mood === mood.type 
                      ? 'bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-300 shadow-md' 
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                  style={{ padding: 'min(2vw,0.5rem)', minHeight: 'min(18vw,4.5rem)' }}
                >
                  {newEntry.mood === mood.type && (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-[min(3vw,0.75rem)]" />
                  )}
                  <div className="relative flex items-center justify-center mb-[min(1vw,0.25rem)]">
                    <span className="text-[min(6vw,1.5rem)]">{mood.emoji}</span>
                  </div>
                  <span className={`relative text-[min(2.5vw,0.625rem)] font-semibold ${newEntry.mood === mood.type ? 'text-purple-700' : 'text-gray-700'} text-center`}>{mood.label}</span>
                </button>
              ))}
            </div>

            {/* Journal Content */}
            <JournalEditor
              value={newEntry.content}
              onChange={(content) => setNewEntry({ ...newEntry, content })}
              placeholder="Write about your day, how you're feeling, any observations... (optional)"
              rows={6}
            />

            {/* Pain Level (if relevant) */}
            {thriving.type === 'pain_management' && (
              <div>
                <label className="text-[min(3.5vw,0.875rem)] font-medium text-gray-700 mb-[min(2vw,0.5rem)] block">
                  Pain Level (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={newEntry.painLevel || 5}
                  onChange={(e) => setNewEntry({ ...newEntry, painLevel: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-[min(3vw,0.75rem)] text-gray-500 mt-[min(1vw,0.25rem)]">
                  <span>Low</span>
                  <span className="font-medium text-rose-600">{newEntry.painLevel || 5}</span>
                  <span>High</span>
                </div>
              </div>
            )}

            {/* Symptoms */}
            <div>
              <label className="text-[min(3.5vw,0.875rem)] font-medium text-gray-700 mb-[min(2vw,0.5rem)] block">
                Symptoms (optional)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentSymptom}
                  onChange={(e) => setCurrentSymptom(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSymptom()}
                  placeholder="Add a symptom"
                  className="flex-1 rounded-[min(2vw,0.5rem)] border border-gray-200 focus:border-purple-300 focus:ring-1 focus:ring-purple-200"
                  style={{ padding: 'min(2vw,0.5rem) min(3vw,0.75rem)' }}
                />
                <Button
                  onClick={handleAddSymptom}
                  size="sm"
                  haptic="light"
                  className="font-medium min-w-[min(16vw,4rem)]"
                  style={{
                    backgroundColor: '#e5e7eb',
                    color: '#374151'
                  }}
                >
                  Add
                </Button>
              </div>
              {newEntry.symptoms.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newEntry.symptoms.map((symptom, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-gray-100 text-gray-700 border border-gray-200"
                      style={{ padding: 'min(1.5vw,0.375rem) min(3vw,0.75rem)', fontSize: 'min(3.5vw,0.875rem)' }}
                    >
                      {symptom}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Gratitude */}
            <div>
              <label className="text-[min(3.5vw,0.875rem)] font-medium text-gray-700 mb-[min(2vw,0.5rem)] block">
                Gratitude (optional)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentGratitude}
                  onChange={(e) => setCurrentGratitude(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddGratitude()}
                  placeholder="What are you grateful for?"
                  className="flex-1 rounded-[min(2vw,0.5rem)] border border-gray-200 focus:border-purple-300 focus:ring-1 focus:ring-purple-200"
                  style={{ padding: 'min(2vw,0.5rem) min(3vw,0.75rem)' }}
                />
                <Button
                  onClick={handleAddGratitude}
                  size="sm"
                  haptic="light"
                  className="font-medium min-w-[min(16vw,4rem)]"
                  style={{
                    backgroundColor: '#e5e7eb',
                    color: '#374151'
                  }}
                >
                  Add
                </Button>
              </div>
              {newEntry.gratitude.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newEntry.gratitude.map((item, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200"
                      style={{ padding: 'min(1.5vw,0.375rem) min(3vw,0.75rem)', fontSize: 'min(3.5vw,0.875rem)' }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-[min(3vw,0.75rem)] pt-[min(2vw,0.5rem)]">
              <Button
                onClick={handleSaveEntry}
                disabled={!newEntry.mood}
                fullWidth
                springAnimation
                gradientOverlay
                cardGlow
                haptic="medium"
                className="font-semibold h-[min(12vw,3rem)]"
                style={{
                  background: 'linear-gradient(135deg, #c084fc, #f9a8d4)',
                  color: '#ffffff'
                }}
              >
                <span className="text-[min(4vw,1rem)]">Save Entry</span>
              </Button>
              <Button
                onClick={() => setShowNewEntry(false)}
                haptic="light"
                className="min-w-[min(30vw,7.5rem)] h-[min(12vw,3rem)] font-medium"
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#4b5563'
                }}
              >
                <span className="text-[min(4vw,1rem)]">Cancel</span>
              </Button>
            </div>
          </div>
          </div>
        )}

        {/* Empty State Message */}
        {journal.totalEntries === 0 && !showNewEntry && (
          <div className="text-center py-[min(8vw,2rem)]">
            <p className="text-[min(4vw,1rem)] text-gray-500">
              No entries yet. Start your wellness journey today!
            </p>
          </div>
        )}

        {/* Journal Entries Section */}
        {journal.totalEntries > 0 && !showNewEntry && (
          <div className="pb-[min(8vw,2rem)]">
            <div className="flex items-center justify-between mb-[min(4vw,1rem)]">
              <h2 className="text-[min(5.5vw,1.375rem)] font-bold text-gray-900">Your Entries</h2>
              <div className="flex gap-[min(2vw,0.5rem)]">
                <button className="text-[min(3.75vw,0.9375rem)] font-medium text-purple-600 px-[min(4vw,1rem)] py-[min(2vw,0.5rem)] rounded-full bg-purple-50 border border-purple-200">
                  All
                </button>
              </div>
            </div>
            
            {/* Entries List */}
            <div className="space-y-[min(4vw,1rem)]">
              {recentEntries.map((entry, index) => (
                <div key={entry.id} className="bg-white rounded-[min(5vw,1.25rem)] border border-gray-100 p-[min(5vw,1.25rem)] shadow-md">
                  {/* Entry Header */}
                  <div className="flex items-center justify-between mb-[min(3vw,0.75rem)]">
                    <div>
                      <p className="text-[min(4vw,1rem)] font-semibold text-gray-900">
                        {new Date(entry.createdAt).toLocaleDateString('en-US', { 
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-[min(3vw,0.75rem)] text-gray-500">
                        {new Date(entry.createdAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                    {entry.mood && (
                      <div className="flex items-center gap-[min(2vw,0.5rem)]">
                        <span className="text-[min(5vw,1.25rem)]">{entry.moodEmoji || moodOptions.find(m => m.type === entry.mood)?.emoji}</span>
                        <span className="text-[min(3.75vw,0.9375rem)] font-medium capitalize" 
                          style={{ color: entry.mood === 'difficult' ? '#ea580c' : moodOptions.find(m => m.type === entry.mood)?.color.replace('text-', '').replace('-600', '').replace('-500', '') || '#666' }}>
                          {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Entry Content Preview */}
                  {entry.content && (
                    <p className="text-[min(3.5vw,0.875rem)] text-gray-700 line-clamp-3 mb-[min(3vw,0.75rem)]">
                      {typeof entry.content === 'string' ? entry.content : 'Journal entry'}
                    </p>
                  )}
                  
                  {/* Entry Tags */}
                  <div className="flex flex-wrap gap-[min(2vw,0.5rem)]">
                    {/* Default tags for demo - Energy and Workout */}
                    <span className="inline-flex items-center px-[min(3.5vw,0.875rem)] py-[min(1.5vw,0.375rem)] bg-green-50 text-green-600 rounded-full text-[min(3.25vw,0.8125rem)] font-medium border border-green-100">
                      Energy
                    </span>
                    <span className="inline-flex items-center px-[min(3.5vw,0.875rem)] py-[min(1.5vw,0.375rem)] bg-green-50 text-green-600 rounded-full text-[min(3.25vw,0.8125rem)] font-medium border border-green-100">
                      Workout
                    </span>
                    {entry.symptoms?.map((symptom, i) => (
                      <span key={i} className="inline-flex items-center px-[min(3.5vw,0.875rem)] py-[min(1.5vw,0.375rem)] bg-orange-50 text-orange-600 rounded-full text-[min(3.25vw,0.8125rem)] font-medium border border-orange-100">
                        {symptom}
                      </span>
                    ))}
                    {index === 0 && (
                      <span className="inline-flex items-center px-[min(3.5vw,0.875rem)] py-[min(1.5vw,0.375rem)] bg-purple-50 text-purple-600 rounded-full text-[min(3.25vw,0.8125rem)] font-medium border border-purple-100">
                        <span className="w-[min(1.5vw,0.375rem)] h-[min(1.5vw,0.375rem)] bg-purple-500 rounded-full mr-[min(1.5vw,0.375rem)]"></span>
                        Latest
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Smart Journal Modal */}
      {thriving && (
        <SmartJournalModal
          thriving={thriving}
          isOpen={showSmartJournal}
          onClose={handleSmartJournalClose}
          onSave={(entry) => {
            // Convert SmartJournalEntry to JournalEntry format
            const newEntry = addJournalEntry(thrivingId, {
              date: entry.date,
              mood: 'okay', // Default mood since SmartJournal doesn't have mood field
              moodEmoji: '😊',
              content: JSON.stringify(entry.fieldValues), // Store field values as JSON string
              painLevel: undefined,
              symptoms: [],
              gratitude: [],
              tags: [],
              customData: entry.fieldValues, // Store field values in customData
              aiInsights: entry.aiInsight // Note: plural 'aiInsights'
            });
            console.log('Smart journal entry saved:', newEntry);
          }}
        />
      )}
    </AppLayout>
  );
}