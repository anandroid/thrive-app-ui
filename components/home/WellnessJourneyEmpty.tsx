'use client';

import { useRouter } from 'next/navigation';
import { Sparkles, Heart, Brain, Moon, Sun, Leaf, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';

export function WellnessJourneyEmpty() {
  const router = useRouter();

  return (
    <div className="wellness-journey-empty relative bg-white rounded-[min(5vw,1.25rem)] p-[min(5vw,1.25rem)] shadow-lg border border-gray-100 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[min(35vw,8.75rem)] h-[min(35vw,8.75rem)] bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[min(30vw,7.5rem)] h-[min(30vw,7.5rem)] bg-gradient-to-tr from-pink-200/20 to-purple-200/20 rounded-full blur-3xl"></div>
      
      {/* Shimmer overlay effect */}
      <div className="absolute inset-0 shimmer-effect opacity-30 pointer-events-none rounded-[min(6vw,1.5rem)]"></div>
      
      {/* Header with sparkle */}
      <div className="relative z-10 flex items-start justify-between mb-[min(3vw,0.75rem)]">
        <div>
          <h2 className="text-[min(5.5vw,1.375rem)] font-extrabold gradient-text-animated mb-[min(1vw,0.25rem)] tracking-tight">
            Your Wellness Journey Awaits
          </h2>
          <p className="text-[min(3.75vw,0.9375rem)] text-gray-600 font-medium">
            Custom-built for your unique needs
          </p>
        </div>
        <Sparkles className="w-[min(6vw,1.5rem)] h-[min(6vw,1.5rem)] text-purple-500 floating-icon" />
      </div>
      
      {/* Preview timeline with enhanced visual design */}
      <div className="relative mb-[min(5vw,1.25rem)]">
        {/* Timeline activities with better spacing and colors */}
        <div className="space-y-[min(3vw,0.75rem)]">
          {/* Morning Activity */}
          <div className="flex gap-[min(3vw,0.75rem)]">
            <div className="flex flex-col items-center">
              <div className="timeline-dot w-[min(4vw,1rem)] h-[min(4vw,1rem)] bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full shadow-sm"></div>
              <div className="w-[min(0.5vw,0.125rem)] h-[min(20vw,5rem)] bg-gradient-to-b from-orange-200 to-purple-200"></div>
            </div>
            <div className="flex-1 opacity-60">
              <div className="activity-card bg-white/90 backdrop-blur-sm border border-orange-200/50 rounded-[min(3.5vw,0.875rem)] p-[min(3.5vw,0.875rem)] shadow-md hover:shadow-lg transition-all">
                <div className="flex items-center gap-[min(3vw,0.75rem)]">
                  <div className="w-[min(10vw,2.5rem)] h-[min(10vw,2.5rem)] bg-gradient-to-br from-yellow-100 to-orange-100 rounded-[min(3vw,0.75rem)] flex items-center justify-center">
                    <Sun className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-orange-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-[min(3.75vw,0.9375rem)] text-gray-800">Morning Energy Boost</p>
                    <p className="text-[min(3.25vw,0.8125rem)] text-gray-600">Vitamins & Natural Energy</p>
                  </div>
                </div>
              </div>
              <p className="text-[min(3vw,0.75rem)] text-gray-500 mt-[min(1.5vw,0.375rem)] ml-[min(2vw,0.5rem)] font-medium">7:00 AM</p>
            </div>
          </div>

          {/* Afternoon Activity */}
          <div className="flex gap-[min(3vw,0.75rem)] -mt-[min(3vw,0.75rem)]">
            <div className="flex flex-col items-center">
              <div className="timeline-dot delay-100 w-[min(4vw,1rem)] h-[min(4vw,1rem)] bg-gradient-to-br from-purple-400 to-pink-400 rounded-full shadow-sm"></div>
              <div className="w-[min(0.5vw,0.125rem)] h-[min(20vw,5rem)] bg-gradient-to-b from-purple-200 to-pink-200"></div>
            </div>
            <div className="flex-1 opacity-60">
              <div className="activity-card bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50 rounded-[min(3.5vw,0.875rem)] p-[min(3.5vw,0.875rem)] shadow-md hover:shadow-lg transition-all">
                <div className="flex items-center gap-[min(3vw,0.75rem)]">
                  <div className="w-[min(10vw,2.5rem)] h-[min(10vw,2.5rem)] bg-gradient-to-br from-purple-100 to-pink-100 rounded-[min(3vw,0.75rem)] flex items-center justify-center">
                    <Heart className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-pink-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-[min(3.75vw,0.9375rem)] text-gray-800">Stress Relief Blend</p>
                    <p className="text-[min(3.25vw,0.8125rem)] text-gray-600">Adaptogens & Calm</p>
                  </div>
                </div>
              </div>
              <p className="text-[min(3vw,0.75rem)] text-gray-500 mt-[min(1.5vw,0.375rem)] ml-[min(2vw,0.5rem)] font-medium">2:00 PM</p>
            </div>
          </div>

          {/* Evening Activity */}
          <div className="flex gap-[min(3vw,0.75rem)] -mt-[min(3vw,0.75rem)]">
            <div className="flex flex-col items-center">
              <div className="timeline-dot delay-200 w-[min(4vw,1rem)] h-[min(4vw,1rem)] bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full shadow-sm"></div>
            </div>
            <div className="flex-1 opacity-60">
              <div className="activity-card bg-white/90 backdrop-blur-sm border border-indigo-200/50 rounded-[min(3.5vw,0.875rem)] p-[min(3.5vw,0.875rem)] shadow-md hover:shadow-lg transition-all">
                <div className="flex items-center gap-[min(3vw,0.75rem)]">
                  <div className="w-[min(10vw,2.5rem)] h-[min(10vw,2.5rem)] bg-gradient-to-br from-indigo-100 to-purple-100 rounded-[min(3vw,0.75rem)] flex items-center justify-center">
                    <Moon className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-indigo-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-[min(3.75vw,0.9375rem)] text-gray-800">Sleep Sanctuary</p>
                    <p className="text-[min(3.25vw,0.8125rem)] text-gray-600">Melatonin & Relaxation</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-[min(1.5vw,0.375rem)] ml-[min(2vw,0.5rem)]">
                <p className="text-[min(3vw,0.75rem)] text-gray-500 font-medium">9:00 PM</p>
                <span className="text-[min(3vw,0.75rem)] bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 px-[min(3vw,0.75rem)] py-[min(1vw,0.25rem)] rounded-full font-medium">
                  +3 more personalized activities
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Personalization emphasis section */}
      <div className="relative z-10 bg-gradient-to-br from-purple-500/90 to-pink-500/90 rounded-[min(4vw,1rem)] p-[min(4vw,1rem)] mb-[min(4vw,1rem)] shadow-md">
        <div className="text-white text-center">
          <h3 className="text-[min(4vw,1rem)] font-bold mb-[min(2vw,0.5rem)]">
            Personalized Just for You
          </h3>
          <div className="grid grid-cols-2 gap-[min(2vw,0.5rem)] mb-[min(3vw,0.75rem)]">
            <div className="bg-white/25 backdrop-blur-sm rounded-[min(2.5vw,0.625rem)] p-[min(2.5vw,0.625rem)] border border-white/20 shadow-sm">
              <Brain className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] mx-auto mb-[min(1vw,0.25rem)] drop-shadow-sm" />
              <p className="text-[min(2.75vw,0.6875rem)] font-semibold">Your Goals</p>
            </div>
            <div className="bg-white/25 backdrop-blur-sm rounded-[min(2.5vw,0.625rem)] p-[min(2.5vw,0.625rem)] border border-white/20 shadow-sm">
              <Heart className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] mx-auto mb-[min(1vw,0.25rem)] drop-shadow-sm" />
              <p className="text-[min(2.75vw,0.6875rem)] font-semibold">Your Needs</p>
            </div>
            <div className="bg-white/25 backdrop-blur-sm rounded-[min(2.5vw,0.625rem)] p-[min(2.5vw,0.625rem)] border border-white/20 shadow-sm">
              <Leaf className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] mx-auto mb-[min(1vw,0.25rem)] drop-shadow-sm" />
              <p className="text-[min(2.75vw,0.6875rem)] font-semibold">Your Schedule</p>
            </div>
            <div className="bg-white/25 backdrop-blur-sm rounded-[min(2.5vw,0.625rem)] p-[min(2.5vw,0.625rem)] border border-white/20 shadow-sm">
              <Sparkles className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] mx-auto mb-[min(1vw,0.25rem)] drop-shadow-sm" />
              <p className="text-[min(2.75vw,0.6875rem)] font-semibold">Your Progress</p>
            </div>
          </div>
          <p className="text-[min(3vw,0.75rem)] text-white/90 font-medium">
            AI-powered wellness routines that adapt to your life
          </p>
        </div>
      </div>
      
      {/* CTA Section with enhanced design */}
      <div className="relative z-10 text-center">
        <div className="mb-[min(3vw,0.75rem)]">
          <p className="text-[min(4vw,1rem)] text-gray-800 font-bold mb-[min(2vw,0.5rem)]">
            Build Your Custom Journey For:
          </p>
          <div className="flex flex-wrap justify-center gap-[min(2vw,0.5rem)] mb-[min(3vw,0.75rem)]">
            <span className="bg-purple-50 text-purple-700 px-[min(3.5vw,0.875rem)] py-[min(1.5vw,0.375rem)] rounded-full text-[min(3.25vw,0.8125rem)] font-medium border border-purple-200/30">
              Sleep
            </span>
            <span className="bg-pink-50 text-pink-700 px-[min(3.5vw,0.875rem)] py-[min(1.5vw,0.375rem)] rounded-full text-[min(3.25vw,0.8125rem)] font-medium border border-pink-200/30">
              Anxiety
            </span>
            <span className="bg-orange-50 text-orange-700 px-[min(3.5vw,0.875rem)] py-[min(1.5vw,0.375rem)] rounded-full text-[min(3.25vw,0.8125rem)] font-medium border border-orange-200/30">
              Energy
            </span>
            <span className="bg-indigo-50 text-indigo-700 px-[min(3.5vw,0.875rem)] py-[min(1.5vw,0.375rem)] rounded-full text-[min(3.25vw,0.8125rem)] font-medium border border-indigo-200/30">
              ADHD
            </span>
            <span className="bg-red-50 text-red-700 px-[min(3.5vw,0.875rem)] py-[min(1.5vw,0.375rem)] rounded-full text-[min(3.25vw,0.8125rem)] font-medium border border-red-200/30">
              Pain
            </span>
            <span className="bg-rose-50 text-rose-700 px-[min(3.5vw,0.875rem)] py-[min(1.5vw,0.375rem)] rounded-full text-[min(3.25vw,0.8125rem)] font-medium border border-rose-200/30">
              PCOS
            </span>
          </div>
        </div>
        
        <Button 
          variant="gradient"
          springAnimation
          gradientOverlay
          cardGlow
          haptic="medium"
          gradient={{
            from: 'purple-500',
            to: 'pink-500',
            direction: 'to-r'
          }}
          className="text-[min(4vw,1rem)] font-semibold px-[min(8vw,2rem)] py-[min(3vw,0.75rem)] shadow-lg text-white"
          onClick={() => router.push('/chat/new?mode=thriving')}
        >
          Start My Personalized Journey
          <ChevronRight className="w-[min(4vw,1rem)] h-[min(4vw,1rem)] ml-[min(2vw,0.5rem)]" />
        </Button>
        
        <p className="text-[min(2.75vw,0.6875rem)] text-gray-500 mt-[min(2vw,0.5rem)]">
          Takes just 2 minutes • 100% personalized
        </p>
      </div>
    </div>
  );
}