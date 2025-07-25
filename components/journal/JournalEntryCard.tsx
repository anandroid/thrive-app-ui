import React from 'react';
import { JournalEntry, Thriving } from '@/src/types/thriving';
import { 
  Clock, 
  Moon, 
  Sun, 
  TrendingUp, 
  Zap,
  Brain,
  Heart,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface JournalEntryCardProps {
  entry: JournalEntry;
  thriving: Thriving;
  isLatest?: boolean;
}

export function JournalEntryCard({ entry, thriving, isLatest = false }: JournalEntryCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
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

  const renderFieldValue = (fieldId: string, value: unknown) => {
    const field = thriving.journalTemplate?.customFields.find(f => f.id === fieldId);
    if (!field) return null;

    // Special rendering for different field types
    if (field.type === 'emoji_picker') {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{String(value)}</span>
          <span className="text-sm text-gray-600">{field.label}</span>
        </div>
      );
    }

    if (field.type === 'slider') {
      const percentage = field.sliderConfig?.max 
        ? (Number(value) / field.sliderConfig.max) * 100 
        : Number(value);
      
      return (
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">{field.label}</span>
            <span className="text-sm font-bold text-gray-900">
              {String(value)}
            </span>
          </div>
          <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                percentage >= 70 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                percentage >= 40 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                'bg-gradient-to-r from-red-400 to-red-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      );
    }

    if (field.type === 'tag_selector' && Array.isArray(value)) {
      return (
        <div className="space-y-1">
          <span className="text-sm font-medium text-gray-700">{field.label}</span>
          <div className="flex flex-wrap gap-2">
            {value.map((tag, idx) => (
              <span 
                key={idx} 
                className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      );
    }

    if (field.type === 'magnitude_input') {
      return (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
          <span className="text-sm text-gray-600">{field.label}</span>
          <span className="text-lg font-semibold text-gray-900">
            {String(value)} {field.magnitudeConfig?.unit || ''}
          </span>
        </div>
      );
    }

    if (field.type === 'time_picker') {
      return (
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{field.label}:</span>
          <span className="text-sm font-medium">{String(value)}</span>
        </div>
      );
    }

    // Default rendering
    return (
      <div className="space-y-1">
        <span className="text-sm font-medium text-gray-700">{field.label}</span>
        <p className="text-sm text-gray-600">{String(value)}</p>
      </div>
    );
  };

  const getIconForRoutineType = () => {
    switch (thriving.type) {
      case 'sleep_wellness':
        return <Moon className="w-5 h-5" />;
      case 'exercise':
        return <Sun className="w-5 h-5" />;
      case 'stress_management':
        return <Brain className="w-5 h-5" />;
      case 'pain_management':
        return <Zap className="w-5 h-5" />;
      case 'mental_wellness':
        return <Heart className="w-5 h-5" />;
      case 'nutrition':
        return <Heart className="w-5 h-5" />;
      case 'general_wellness':
      default:
        return <Heart className="w-5 h-5" />;
    }
  };

  return (
    <div className={`
      rounded-2xl bg-white border overflow-hidden transition-all duration-300
      ${isLatest 
        ? 'border-purple-300/50 shadow-lg shadow-purple-500/10' 
        : 'border-gray-200 shadow-sm hover:shadow-md'
      }
    `}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center
              ${isLatest 
                ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-700' 
                : 'bg-gray-100 text-gray-600'
              }
            `}>
              {getIconForRoutineType()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {formatDate(entry.date)}
              </p>
              <p className="text-xs text-gray-500">
                {formatTime(entry.createdAt)}
              </p>
            </div>
          </div>
          {isLatest && (
            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
              Latest
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Smart Fields Display */}
        {entry.customData && (
          <div className="space-y-3">
            {Object.entries(entry.customData).map(([fieldId, value]) => (
              <React.Fragment key={fieldId}>
                {renderFieldValue(fieldId, value)}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Traditional Fields (for backward compatibility) */}
        {!entry.customData && (
          <>
            {entry.moodEmoji && (
              <div className="flex items-center space-x-2">
                <span className="text-3xl">{entry.moodEmoji}</span>
                <span className="text-sm font-medium text-gray-600 capitalize">
                  Feeling {entry.mood || 'okay'}
                </span>
              </div>
            )}

            {entry.content && (
              <p className="text-gray-700 leading-relaxed">{entry.content}</p>
            )}

            {entry.painLevel !== undefined && (
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">
                  Pain Level: {entry.painLevel}/10
                </span>
              </div>
            )}

            {entry.symptoms && entry.symptoms.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500">Symptoms:</p>
                <div className="flex flex-wrap gap-2">
                  {entry.symptoms.map((symptom, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs"
                    >
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {entry.gratitude && entry.gratitude.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500">Grateful for:</p>
                <div className="flex flex-wrap gap-2">
                  {entry.gratitude.map((item, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* AI Insights */}
        {entry.aiInsights && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 border border-purple-200 relative overflow-hidden">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple/5 via-transparent to-blue/5" />
            
            <div className="relative flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-purple-700 mb-1 uppercase tracking-wider">
                  AI Insight
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {entry.aiInsights}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trend Indicators (if comparing with previous entries) */}
      {entry.customData && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Track your progress daily</span>
            <div className="flex items-center space-x-1 text-emerald-600">
              <TrendingUp className="w-3 h-3" />
              <span className="font-medium">Improving</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}