'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Thriving } from '@/src/types/thriving';
import { WellnessJourneyEmpty } from './WellnessJourneyEmpty';

interface JourneyItem {
  id: string;
  time: string;
  title: string;
  subtitle: string;
  status: 'completed' | 'current' | 'upcoming';
  icon: string;
  additionalInfo?: string;
}

interface WellnessJourneyProps {
  thrivings: Thriving[];
}

export function WellnessJourney({ thrivings }: WellnessJourneyProps) {
  const [journeyItems, setJourneyItems] = useState<JourneyItem[]>([]);
  const [hasMoreItems, setHasMoreItems] = useState(false);

  useEffect(() => {
    // Convert thrivings to journey items
    const items: JourneyItem[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    // Get all active thriving steps for today
    thrivings.forEach(thriving => {
      if (thriving.isActive && thriving.steps) {
        thriving.steps.forEach(step => {
          if (step.time) {
            const [hours, minutes] = step.time.split(':').map(Number);
            const isPast = hours < currentHour || (hours === currentHour && minutes <= currentMinutes);
            const isCurrent = hours === currentHour && minutes > currentMinutes - 30 && minutes <= currentMinutes + 30;
            
            items.push({
              id: `${thriving.id}-${step.id}`,
              time: step.time,
              title: step.title,
              subtitle: thriving.title,
              status: isPast ? 'completed' : isCurrent ? 'current' : 'upcoming',
              icon: step.icon || '✨'
            });
          }
        });
      }
    });

    // Sort by time
    items.sort((a, b) => {
      const [aHours, aMinutes] = a.time.split(':').map(Number);
      const [bHours, bMinutes] = b.time.split(':').map(Number);
      return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
    });

    // Find the most recent past item and next 2 upcoming
    const currentTime = currentHour * 60 + currentMinutes;
    const pastItems: JourneyItem[] = [];
    const upcomingItems: JourneyItem[] = [];
    
    items.forEach(item => {
      const [hours, minutes] = item.time.split(':').map(Number);
      const itemTime = hours * 60 + minutes;
      if (itemTime < currentTime) {
        pastItems.push(item);
      } else {
        upcomingItems.push(item);
      }
    });
    
    // Get 1 most recent past and 2 upcoming
    const displayItems = [
      ...pastItems.slice(-1),
      ...upcomingItems.slice(0, 2)
    ];

    // Check if there are more items for today
    const totalTodayItems = pastItems.length + upcomingItems.length;
    setHasMoreItems(totalTodayItems > displayItems.length);

    setJourneyItems(displayItems);
  }, [thrivings]);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          dot: { background: 'var(--accent-green)' },
          line: 'bg-gray-200',
          bg: 'bg-white shadow-sm border border-gray-100',
          text: 'text-gray-700',
          icon: { background: 'rgba(16, 185, 129, 0.1)' }
        };
      case 'current':
        return {
          dot: { background: 'var(--primary)', animation: 'pulse 2s infinite' },
          line: 'bg-gray-200',
          bg: 'bg-white shadow-md',
          border: { borderWidth: '2px', borderColor: 'var(--primary-light)' },
          text: 'text-gray-900',
          icon: { background: 'rgba(139, 92, 246, 0.1)' }
        };
      case 'upcoming':
        return {
          dot: { background: '#d1d5db' },
          line: 'bg-gray-200',
          bg: 'bg-white shadow-sm border border-gray-100',
          text: 'text-gray-600',
          icon: { background: '#f9fafb' }
        };
      default:
        return {
          dot: { background: '#d1d5db' },
          line: 'bg-gray-200',
          bg: 'bg-gray-50',
          text: 'text-gray-500',
          icon: { background: '#f3f4f6' }
        };
    }
  };

  // Show empty state if no thrivings
  if (thrivings.length === 0) {
    return <WellnessJourneyEmpty />;
  }

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: '4vh' }}>
        <h2 className="font-bold text-gray-900" style={{ fontSize: '5vw' }}>Today&apos;s Wellness Journey</h2>
        <Link href="/thrivings" className="transition-colors" style={{ fontSize: '3.5vw', color: 'var(--secondary)' }}>
          See all →
        </Link>
      </div>
      
      <div className="space-y-4">
        {journeyItems.map((item, index) => {
          const styles = getStatusStyles(item.status);
          const isLast = index === journeyItems.length - 1;
          
          return (
            <div key={item.id} className="relative flex items-start" style={{ gap: '4vw' }}>
              {/* Timeline */}
              <div className="flex flex-col items-center" style={{ width: '3vw' }}>
                <div className="rounded-full" style={{ width: '3vw', height: '3vw', ...styles.dot }} />
                {!isLast && (
                  <div className={`${styles.line} w-full`} style={{ width: '0.4vw', height: '100%', marginTop: '1vw', minHeight: '8vh' }} />
                )}
                {/* Show dots for last item if there are more items */}
                {isLast && hasMoreItems && (
                  <div className="flex flex-col items-center" style={{ marginTop: '1vw' }}>
                    <div className="bg-gray-200" style={{ width: '0.4vw', height: '6vh' }} />
                    <div className="flex flex-col items-center" style={{ gap: '0.8vh' }}>
                      <div className="bg-gray-300 rounded-full" style={{ width: '1vw', height: '1vw' }}></div>
                      <div className="bg-gray-300 rounded-full" style={{ width: '1vw', height: '1vw' }}></div>
                      <div className="bg-gray-300 rounded-full" style={{ width: '1vw', height: '1vw' }}></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Content Card */}
              <div className="flex-1" style={{ paddingBottom: isLast ? 0 : '2vh' }}>
                <button 
                  className={`w-full text-left ${styles.bg} transition-all hover:shadow-md`} 
                  style={{ borderRadius: '4vw', padding: '4vw', ...(styles.border || {}) }}
                  onClick={() => {
                    // Navigate to the thriving with step parameter
                    const thrivingId = item.id.split('-')[0];
                    const stepId = item.id.split('-')[1];
                    window.location.href = `/thrivings?id=${thrivingId}&step=${stepId}`;
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center flex-shrink-0" style={{ width: '10vw', height: '10vw', borderRadius: '2.5vw', ...styles.icon }}>
                      <span style={{ fontSize: '5vw' }}>{item.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${styles.text}`} style={{ fontSize: '4vw' }}>{item.title}</p>
                      <p className="text-gray-500" style={{ fontSize: '3vw' }}>{item.subtitle}</p>
                    </div>
                    {item.status === 'completed' && (
                      <div className="flex items-center" style={{ gap: '1vw' }}>
                        <div className="text-green-500">
                          <svg style={{ width: '5vw', height: '5vw' }} viewBox="0 0 24 24" fill="none">
                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between" style={{ marginTop: '3vw' }}>
                    <p className="text-gray-600" style={{ fontSize: '3.5vw' }}>{item.time}</p>
                    {item.additionalInfo && (
                      <span className="px-3 py-1 rounded-full" style={{ fontSize: '3vw', background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-light))', color: 'white' }}>
                        {item.additionalInfo}
                      </span>
                    )}
                  </div>
                </button>
                
                {/* Journal Button - Positioned outside main card */}
                {item.status === 'current' && (
                  <button 
                    className="absolute text-white rounded-full flex items-center justify-center transition-all shadow-md active:scale-95"
                    style={{ width: '10vw', height: '10vw', top: '50%', right: '-2vw', transform: 'translateY(-50%)', background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Navigate to journal for this thriving
                      const thrivingId = item.id.split('-')[0];
                      window.location.href = `/thrivings/${thrivingId}/journal`;
                    }}
                  >
                    <svg className="text-white" style={{ width: '5vw', height: '5vw' }} viewBox="0 0 24 24" fill="none">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
    </div>
  );
}