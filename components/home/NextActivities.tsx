'use client';

import { useState, useEffect } from 'react';
import { format, isAfter } from 'date-fns';
import Link from 'next/link';

interface Activity {
  id: string;
  name: string;
  time: Date;
  type: 'routine' | 'meditation' | 'supplement' | 'exercise';
  sanctuary?: string;
  completed?: boolean;
}

import type { Thriving } from '@/src/types/thriving';

interface NextActivitiesProps {
  thrivings: Thriving[];
}

export function NextActivities({ thrivings }: NextActivitiesProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [remainingStepsToday, setRemainingStepsToday] = useState(0);

  useEffect(() => {
    // Convert routines to activities
    const now = new Date();
    const todayActivities: Activity[] = [];

    thrivings.forEach(thriving => {
      if (thriving.isActive && thriving.steps) {
        thriving.steps.forEach((step) => {
          // Create activity time based on step time
          const [hours, minutes] = (step.time || '09:00').split(':');
          const activityTime = new Date();
          activityTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          todayActivities.push({
            id: `${thriving.id}-${step.id}`,
            name: step.title,
            time: activityTime,
            type: 'routine',
            sanctuary: thriving.title,
            completed: step.completed || false
          });
        });
      }
    });

    // Sort by time and get next 2 activities
    const upcomingActivities = todayActivities
      .filter(activity => isAfter(activity.time, now))
      .sort((a, b) => a.time.getTime() - b.time.getTime());
    
    // Calculate remaining steps after the shown ones
    const remainingAfterShown = upcomingActivities.length - 2;
    setRemainingStepsToday(remainingAfterShown > 0 ? remainingAfterShown : 0);
    setActivities(upcomingActivities.slice(0, 2));
  }, [thrivings]);

  if (activities.length === 0) {
    return null;
  }

  const nextActivity = activities[0];
  const timeUntilNext = Math.round((nextActivity.time.getTime() - currentTime.getTime()) / (1000 * 60 * 60));
  const timeDisplay = timeUntilNext > 0 ? `in ${timeUntilNext} hour${timeUntilNext > 1 ? 's' : ''}` : 'now';

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'meditation':
        return '🌙';
      case 'supplement':
        return '💊';
      case 'exercise':
        return '✨';
      default:
        return '🌙';
    }
  };

  return (
    <div className="relative overflow-hidden shadow-sm" style={{ borderRadius: '4vw', background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))' }}>
      <div style={{ padding: '5vw' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '3vh' }}>
          <h3 className="text-white font-medium opacity-90" style={{ fontSize: '3.5vw' }}>Next Activities</h3>
          {remainingStepsToday > 0 && (
            <span className="text-white/90 bg-white/20 backdrop-blur-sm" style={{ fontSize: '3vw', padding: '1vw 2.5vw', borderRadius: '5vw' }}>
              {remainingStepsToday} more steps today
            </span>
          )}
        </div>

        <div className="space-y-3">
          {activities.slice(0, 1).map((activity, index) => (
            <Link key={index} href={`/thrivings?id=${activity.id.split('-')[0]}&step=${activity.id.split('-')[1]}`} className="block">
              <div className="flex items-center justify-between">
                <div className="flex items-center" style={{ gap: '3vw' }}>
                  <div className="bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0" style={{ width: '12vw', height: '12vw', borderRadius: '3vw' }}>
                    <span style={{ fontSize: '6vw' }}>{getActivityIcon(activity.type)}</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold" style={{ fontSize: '4.5vw' }}>{activity.name}</p>
                    <p className="text-white/90" style={{ fontSize: '3vw' }}>
                      {activity.sanctuary || 'Daily Wellness'} • in {timeDisplay}
                    </p>
                  </div>
                </div>
                <div className="flex items-center" style={{ gap: '2vw' }}>
                  <button className="bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors" 
                    style={{ width: '8vw', height: '8vw' }}
                    onClick={(e) => {
                      e.preventDefault();
                      const thrivingId = activity.id.split('-')[0];
                      window.location.href = `/thrivings/${thrivingId}/journal`;
                    }}
                  >
                    <svg className="text-white" style={{ width: '4vw', height: '4vw' }} viewBox="0 0 24 24" fill="none">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                  <button className="bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors" 
                    style={{ width: '8vw', height: '8vw' }}
                  >
                    <svg className="text-white" style={{ width: '4vw', height: '4vw' }} viewBox="0 0 24 24" fill="none">
                      <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {remainingStepsToday > 0 && (
          <div className="pt-3 border-t border-white/20" style={{ marginTop: '3vh' }}>
            <p className="text-white/80" style={{ fontSize: '3vw' }}>
              {activities.length > 1 
                ? `Also at ${format(activities[0].time, 'h:mm a')}: ${activities[1].name}`
                : `${remainingStepsToday} more activities later today`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}