'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Plus, Brain, TrendingUp, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
  getThrivingById, 
  getJournalByThrivingId, 
  createJournalForThriving,
  addJournalEntry,
 
} from '@/src/utils/thrivingStorage';
import { Thriving, ThrivingJournal, JournalEntry, UserLearningProfile } from '@/src/types/thriving';
import { JournalEditor } from '@/components/ui/JournalEditor';
import { DynamicJournalModal } from '@/components/ui/DynamicJournalModal';
import { UserLearningProfileManager } from '@/src/lib/userLearningProfile';
import { JournalInsightsEngine } from '@/src/lib/journalInsights';

const moodOptions = [
  { type: 'great', emoji: '😊', label: 'Great', color: 'text-green-600' },
  { type: 'good', emoji: '🙂', label: 'Good', color: 'text-sage-dark' },
  { type: 'okay', emoji: '😐', label: 'Okay', color: 'text-yellow-600' },
  { type: 'difficult', emoji: '😔', label: 'Difficult', color: 'text-orange-600' },
  { type: 'challenging', emoji: '😰', label: 'Challenging', color: 'text-red-600' }
] as const;

export default function JournalPage({ params }: { params: Promise<{ thrivingId: string }> }) {
  const router = useRouter();
  const { thrivingId } = use(params);
  const [thriving, setThriving] = useState<Thriving | null>(null);
  const [journal, setJournal] = useState<ThrivingJournal | null>(null);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [showDynamicJournal, setShowDynamicJournal] = useState(false);
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
      mood: undefined,
      moodEmoji: '',
      content: '',
      painLevel: undefined,
      symptoms: [],
      gratitude: []
    });
    setShowNewEntry(false);
  };

  const handleDynamicJournalClose = () => {
    setShowDynamicJournal(false);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
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
        title: (
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-dusty-rose" />
            <span>Journal</span>
          </div>
        ),
        showBackButton: true,
        backHref: `/thrivings?id=${thrivingId}`,
        variant: 'blur'
      }}
      className="bg-gray-50"
    >
      {/* Thriving Info */}
      <div className="px-4 py-4 bg-white border-b border-gray-100">
        <h2 className="text-lg font-semibold text-primary-text">{thriving.title}</h2>
        <p className="text-sm text-secondary-text-thin">{journal.totalEntries} journal entries</p>
      </div>

      {/* Main Content */}
        <div className="px-4 py-6 space-y-4">
          {/* Add Entry Buttons */}
          {!showNewEntry && (
            <div className="space-y-3">
              {/* Smart Journal Button */}
              <button
                onClick={() => setShowDynamicJournal(true)}
                className="w-full rounded-2xl bg-gradient-to-r from-purple/5 via-dusty-rose/5 to-blue/5 border border-purple/10 py-4 px-6 flex items-center justify-between hover:from-purple/10 hover:via-dusty-rose/10 hover:to-blue/10 hover:border-purple/20 transition-all duration-300 group relative"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    {/* Subtle glow effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800 text-[15px] flex items-center space-x-2">
                      <span>Smart Journal</span>
                      {userProfile && userProfile.dataPoints > 5 && (
                        <Sparkles className="w-4 h-4 text-purple-500" />
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      {userProfile && userProfile.dataPoints > 5 
                        ? `Personalized for you • ${Math.round(userProfile.confidenceLevel * 100)}% insights`
                        : 'Guided prompts and tracking'
                      }
                    </div>
                  </div>
                </div>
                <div className="text-gray-400">
                  <span className="text-xs">Recommended</span>
                </div>
              </button>

              {/* Traditional Journal Button */}
              <button
                onClick={() => setShowNewEntry(true)}
                className="w-full rounded-2xl bg-gradient-to-r from-rose/5 via-dusty-rose/5 to-burgundy/5 border border-rose/10 py-3.5 px-6 flex items-center justify-center space-x-3 hover:from-rose/10 hover:via-dusty-rose/10 hover:to-burgundy/10 hover:border-rose/20 transition-all duration-300 group relative"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose to-burgundy flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                      <Plus className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-500" />
                    </div>
                    {/* Subtle glow effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-rose to-burgundy blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
                  </div>
                  <span className="font-medium text-gray-800 text-[15px]">Quick Entry</span>
                </div>
              </button>
            </div>
          )}

          {/* New Entry Form */}
          {showNewEntry && (
            <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-lg space-y-5">
              <h3 className="font-semibold text-primary-text">How are you feeling?</h3>
              
              {/* Mood Selection */}
              <div className="grid grid-cols-5 gap-1.5">
                {moodOptions.map((mood) => (
                  <button
                    key={mood.type}
                    onClick={() => handleMoodSelect(mood)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
                      newEntry.mood === mood.type 
                        ? 'bg-gradient-to-br from-rose/10 to-burgundy/10 border-2 border-rose' 
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="h-7 flex items-center justify-center">
                      <span className="text-xl">{mood.emoji}</span>
                    </div>
                    <span className={`text-[10px] font-medium ${mood.color} text-center leading-tight mt-0.5`}>{mood.label}</span>
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
                  <label className="text-sm font-medium text-primary-text mb-2 block">
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
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Low</span>
                    <span className="font-medium text-primary-text">{newEntry.painLevel || 5}</span>
                    <span>High</span>
                  </div>
                </div>
              )}

              {/* Symptoms */}
              <div>
                <label className="text-sm font-medium text-primary-text mb-2 block">
                  Symptoms (optional)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={currentSymptom}
                    onChange={(e) => setCurrentSymptom(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSymptom()}
                    placeholder="Add a symptom"
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-rose focus:ring-2 focus:ring-rose/20"
                  />
                  <button
                    onClick={handleAddSymptom}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {newEntry.symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newEntry.symptoms.map((symptom, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-sm"
                      >
                        {symptom}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Gratitude */}
              <div>
                <label className="text-sm font-medium text-primary-text mb-2 block">
                  Gratitude (optional)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={currentGratitude}
                    onChange={(e) => setCurrentGratitude(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddGratitude()}
                    placeholder="What are you grateful for?"
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-rose focus:ring-2 focus:ring-rose/20"
                  />
                  <button
                    onClick={handleAddGratitude}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {newEntry.gratitude.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newEntry.gratitude.map((item, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveEntry}
                  disabled={!newEntry.mood}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose/90 to-burgundy/90 text-white font-medium shadow-sm hover:from-rose hover:to-burgundy transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Entry
                </button>
                <button
                  onClick={() => setShowNewEntry(false)}
                  className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Privacy Notice - Only show when no entries exist */}
          {journal.totalEntries === 0 && !showNewEntry && (
            <div className="rounded-2xl bg-gradient-to-br from-sage-light/20 to-sage/10 border border-sage-light/30 p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🔒</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sage-dark mb-1">Your Privacy Matters</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Your journal entries are stored locally on your device for complete privacy. 
                    We never access, track, or share your personal reflections. 
                    Your healing journey remains yours alone.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Insights Section */}
          {journal.insights && userProfile && userProfile.dataPoints >= 5 && (
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-emerald-900">Your Progress Insights</h3>
                </div>
                <button
                  onClick={() => setShowInsights(!showInsights)}
                  className="text-xs text-emerald-700 hover:text-emerald-800"
                >
                  {showInsights ? 'Hide' : 'Show'} Details
                </button>
              </div>
              
              {journal.insights.celebratoryInsights.length > 0 && (
                <div className="space-y-2">
                  {journal.insights.celebratoryInsights.slice(0, 2).map((insight, index) => (
                    <p key={index} className="text-sm text-emerald-800 bg-emerald-50 p-3 rounded-lg">
                      {insight}
                    </p>
                  ))}
                </div>
              )}

              {showInsights && journal.insights.recommendations.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium text-emerald-900 text-sm">Personalized Recommendations:</h4>
                  {journal.insights.recommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="bg-white/60 p-3 rounded-lg">
                      <p className="text-sm text-emerald-800 font-medium">{rec.suggestion}</p>
                      <p className="text-xs text-emerald-600 mt-1">{rec.reasoning}</p>
                      <div className="flex items-center mt-2">
                        <div className="w-full bg-emerald-100 rounded-full h-1">
                          <div 
                            className="bg-emerald-500 h-1 rounded-full" 
                            style={{ width: `${rec.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-emerald-600 ml-2">
                          {Math.round(rec.confidence * 100)}% confident
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Journal Entries */}
          <div className="space-y-4">
            {recentEntries.map((entry) => (
              <div key={entry.id} className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-primary-text">
                      {formatDate(entry.date)}
                    </p>
                    <p className="text-xs text-gray-500">{formatTime(entry.createdAt)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{entry.moodEmoji}</span>
                    {entry.painLevel && (
                      <span className="px-2 py-1 rounded-full bg-red-50 text-red-600 text-xs font-medium">
                        Pain: {entry.painLevel}/10
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-700 mb-3">{entry.content}</p>

                {/* Symptoms */}
                {entry.symptoms && entry.symptoms.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Symptoms:</p>
                    <div className="flex flex-wrap gap-2">
                      {entry.symptoms.map((symptom, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 rounded-full bg-red-50 text-red-600 text-xs"
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gratitude */}
                {entry.gratitude && entry.gratitude.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Grateful for:</p>
                    <div className="flex flex-wrap gap-2">
                      {entry.gratitude.map((item, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 rounded-full bg-green-50 text-green-600 text-xs"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {recentEntries.length === 0 && !showNewEntry && (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No journal entries yet</p>
                <p className="text-sm text-gray-400">Start writing to track your wellness journey</p>
              </div>
            )}
          </div>
        </div>

      {/* Dynamic Journal Modal */}
      {thriving && (
        <DynamicJournalModal
          thriving={thriving}
          isOpen={showDynamicJournal}
          onClose={handleDynamicJournalClose}
        />
      )}
    </AppLayout>
  );
}