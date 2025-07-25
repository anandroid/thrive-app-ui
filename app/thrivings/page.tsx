'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
  Clock, 
  Bell, Edit2, Trash2,
  Plus, Target, Settings,
  ChevronDown, ChevronUp, ChevronRight, Lightbulb, Package, Play, CheckCircle2, BookOpen, Heart, Info,
  Pause
} from 'lucide-react';
import { Thriving } from '@/src/types/thriving';
import { getThrivingsFromStorage, updateThrivingInStorage, deleteThrivingFromStorage } from '@/src/utils/thrivingStorage';
import { sortThrivingSteps, findSortedStepIndex } from '@/src/utils/thrivingHelpers';
import { CelebrationShower } from '@/components/ui/CelebrationShower';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdjustmentTutorial } from '@/components/features/AdjustmentTutorial';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { ThrivingNotificationCard } from '@/components/features/ThrivingNotificationCard';
import HealthInsights from '@/components/features/HealthInsights';
import { ThrivingExpertHelp } from '@/components/features/ThrivingExpertHelp';
import Button from '@/components/ui/Button';
import { useStreamingRoutineParser, PartialRoutineData } from '@/src/utils/routine/streamingParser';
import { THRIVING_STREAMING_CONFIG } from '@/src/config/thrivingStreamingConfig';
import { saveThrivingToStorage } from '@/src/utils/thrivingStorage';
import { NotificationHelper } from '@/src/utils/notificationHelper';
import bridge from '@/src/lib/react-native-bridge';

export default function ThrivingsPage() {
  // Initialize with empty array to prevent hydration mismatch
  const [thrivings, setThrivings] = useState<Thriving[]>([]);
  
  // Track where the user came from for proper back navigation
  const [cameFromChatThreadId, setCameFromChatThreadId] = useState<string | null>(null);
  const [selectedThriving, setSelectedThriving] = useState<Thriving | null>(null);
  const [expandedTips, setExpandedTips] = useState<Set<number>>(new Set());
  const [isRecommendationsCollapsed, setIsRecommendationsCollapsed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showAdjustmentEditor, setShowAdjustmentEditor] = useState(false);
  const [adjustmentText, setAdjustmentText] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [highlightedStep, setHighlightedStep] = useState<number | null>(null);
  const [showAdjustmentTutorial, setShowAdjustmentTutorial] = useState(false);
  const [isStreamingCreation, setIsStreamingCreation] = useState(false);
  const [streamingRoutineData, setStreamingRoutineData] = useState<PartialRoutineData | null>(null);
  const [streamingElementsVisible, setStreamingElementsVisible] = useState<Set<string>>(new Set());
  const [showCompletionIndicator, setShowCompletionIndicator] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const adjustButtonRef = useRef<HTMLButtonElement | null>(null);
  const hasShownTutorialInSession = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamingContainerRef = useRef<HTMLDivElement>(null);

  // Streaming routine parser
  const { startStreaming } = useStreamingRoutineParser(
    (data: PartialRoutineData) => {
      setStreamingRoutineData(data);
      
      // Show elements progressively based on available data
      const newVisible = new Set(streamingElementsVisible);
      
      if (data.title) newVisible.add('thriving-title');
      if (data.description) newVisible.add('thriving-description');
      if (data.steps) {
        data.steps.forEach((step, index) => {
          if (step && (step as { title?: string }).title) {
            newVisible.add(`step-${index + 1}`);
          }
        });
      }
      if (data.additionalRecommendations) newVisible.add('additional-recommendations');
      if (data.expectedOutcomes) newVisible.add('expected-outcomes');
      if (data.proTips) newVisible.add('pro-tips');
      if (data.safetyNotes) newVisible.add('safety-notes');
      if (data.isComplete) newVisible.add('action-buttons');
      
      setStreamingElementsVisible(newVisible);
      
      // Auto-scroll to the latest visible element
      if (streamingContainerRef.current) {
        const elements = Array.from(newVisible);
        const lastElement = elements[elements.length - 1];
        let elementConfig = THRIVING_STREAMING_CONFIG.find(config => config.id === lastElement);
        
        // For steps beyond 5, create dynamic config
        if (!elementConfig && lastElement.startsWith('step-')) {
          const stepNum = parseInt(lastElement.replace('step-', ''));
          if (!isNaN(stepNum)) {
            elementConfig = {
              id: lastElement,
              type: 'step',
              selector: `[data-step="${stepNum}"]`,
              delay: 0,
              duration: 600,
              order: stepNum + 3 // Offset for other elements
            };
          }
        }
        
        if (elementConfig?.selector) {
          const element = streamingContainerRef.current.querySelector(elementConfig.selector);
          if (element) {
            // Wait a bit for the element to animate in, then scroll
            setTimeout(() => {
              // Get the container's scroll position
              const container = streamingContainerRef.current!;
              const rect = element.getBoundingClientRect();
              const containerRect = container.getBoundingClientRect();
              
              // Calculate if we need to scroll
              const elementBottom = rect.bottom;
              const containerBottom = containerRect.bottom;
              
              // Only scroll if element is below the visible area or partially hidden
              if (elementBottom > containerBottom - 50) { // 50px buffer
                element.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'end',
                  inline: 'nearest'
                });
              }
              
              // Ensure the element is fully visible after animation
              setTimeout(() => {
                const newRect = element.getBoundingClientRect();
                const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
                
                // If element is still not fully visible, scroll again
                if (newRect.bottom > viewHeight - 100 || newRect.top < 100) {
                  element.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                  });
                }
              }, 600); // After animation completes
            }, 200); // Initial delay for element to render
          }
        }
      }
    },
    (routine: Thriving) => {
      // Debug: Log the routine before saving
      console.log('Saving routine:', {
        id: routine.id,
        title: routine.title,
        hasJournalTemplate: !!routine.journalTemplate,
        journalTemplateType: routine.journalTemplate?.journalType,
        journalTemplate: routine.journalTemplate
      });
      
      // Save the completed routine
      saveThrivingToStorage(routine);
      
      // Schedule notifications if in React Native
      if (NotificationHelper.isSupported()) {
        // Cast to WellnessRoutine for compatibility with notification helper
        NotificationHelper.scheduleRoutineReminders([routine as unknown as import('@/src/services/openai/types').WellnessRoutine]).then((result) => {
          if (result.success) {
            console.log('Routine reminders scheduled successfully');
          }
        });
      }
      
      // Notify React Native that a thriving was created
      bridge.notifyThrivingCreated();
      
      // Mark that user has created a thriving
      localStorage.setItem('hasCreatedThriving', 'true');
      
      // Update the thrivings list
      setThrivings(prev => [routine, ...prev]);
      setSelectedThriving(routine);
      
      // Reset streaming state
      setIsStreamingCreation(false);
      setStreamingRoutineData(null);
      setStreamingElementsVisible(new Set());
      streamingInitiatedRef.current = false; // Reset the flag
      
      // Get the creation data to check if it came from chat
      const routineCreationData = sessionStorage.getItem('routineCreationData');
      
      if (routineCreationData) {
        try {
          const data = JSON.parse(routineCreationData);
          if (data.threadId) {
            // Store the post-action message data for the chat
            const postAction = {
              type: 'routine_created',
              context: {
                routineName: routine.title,
                routineType: routine.type
              }
            };
            sessionStorage.setItem('routineCreatedPostAction', JSON.stringify(postAction));
          }
        } catch (error) {
          console.error('Error parsing routine creation data:', error);
        }
      }
      
      // Clear the routine creation data
      sessionStorage.removeItem('routineCreationData');
      
      // Clear the streaming flag from URL and update to show the created routine
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('streaming');
      newUrl.searchParams.set('id', routine.id);
      window.history.replaceState({}, '', newUrl.toString());
      
      // Don't auto-redirect - let user explore the routine
      // They can use the back button to return to chat if they came from there
      
      // Show completion indicator for a few seconds
      setShowCompletionIndicator(true);
      setTimeout(() => {
        setShowCompletionIndicator(false);
      }, 5000); // Hide after 5 seconds
    },
    (error: string) => {
      console.error('Streaming error:', error);
      alert('Failed to create thriving. Please try again.');
      setIsStreamingCreation(false);
      setStreamingRoutineData(null);
      setStreamingElementsVisible(new Set());
      sessionStorage.removeItem('routineCreationData');
      streamingInitiatedRef.current = false; // Reset the flag on error
    }
  );

  // Track if streaming has been initiated to prevent multiple calls
  const streamingInitiatedRef = useRef(false);

  // Load thrivings data on client side to prevent hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadedThrivings = getThrivingsFromStorage();
      setThrivings(loadedThrivings);
    }
  }, []);

  useEffect(() => {
    // Check if there's a specific thriving to show from query params
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const thrivingId = urlParams.get('id');
    const stepIndex = urlParams.get('step');
    const isStreaming = urlParams.get('streaming') === 'true';
    
    // Handle streaming creation
    if (isStreaming && !streamingInitiatedRef.current) {
      const routineCreationData = sessionStorage.getItem('routineCreationData');
      if (routineCreationData) {
        try {
          streamingInitiatedRef.current = true; // Prevent multiple calls
          const data = JSON.parse(routineCreationData);
          
          // Check if this came from chat and store the thread ID
          if (data.threadId) {
            setCameFromChatThreadId(data.threadId);
          }
          
          setIsStreamingCreation(true);
          startStreaming(data);
        } catch (error) {
          console.error('Failed to parse routine creation data:', error);
          sessionStorage.removeItem('routineCreationData');
          streamingInitiatedRef.current = false;
        }
      }
      return; // Don't continue with normal initialization during streaming
    }
    
    // Only scroll to top when navigating from external pages (not from home page cards)
    // Check if we came from home page with specific step
    const fromHome = sessionStorage.getItem('navigateFromHome');
    if (!stepIndex && !fromHome) {
      window.scrollTo(0, 0);
    }
    // Clear the flag after checking
    sessionStorage.removeItem('navigateFromHome');
    
    // Set active step if provided
    if (stepIndex !== null) {
      setActiveStep(parseInt(stepIndex));
    }
    
    // Load recommendations collapsed state from localStorage
    if (typeof window !== 'undefined') {
      const savedCollapsedState = localStorage.getItem('recommendationsCollapsed');
      if (savedCollapsedState !== null) {
        setIsRecommendationsCollapsed(savedCollapsedState === 'true');
      }
    }
    
    // Check for adjustment request from chat
    const showAdjustment = urlParams.get('showAdjustment');
    if (showAdjustment === 'true' && thrivingId) {
      const adjustmentRequest = sessionStorage.getItem('adjustmentRequest');
      if (adjustmentRequest) {
        try {
          const { adjustmentInstructions } = JSON.parse(adjustmentRequest);
          if (adjustmentInstructions) {
            setAdjustmentText(adjustmentInstructions);
            
            // Find and select the thriving after a delay
            setTimeout(() => {
              const targetThriving = thrivings.find(t => t.id === thrivingId);
              if (targetThriving) {
                setSelectedThriving(targetThriving);
                
                // Scroll to the adjust button area after selecting thriving
                setTimeout(() => {
                  const adjustSection = document.querySelector('[data-adjust-section]');
                  if (adjustSection) {
                    adjustSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Open the adjustment editor after scrolling
                    setTimeout(() => {
                      setShowAdjustmentEditor(true);
                      
                      // Auto-click the adjust button after another delay
                      setTimeout(() => {
                        const adjustButton = document.querySelector('[data-adjust-button]');
                        if (adjustButton && adjustButton instanceof HTMLButtonElement) {
                          adjustButton.click();
                        }
                      }, 1000);
                    }, 1500);
                  }
                }, 500);
              }
            }, 500);
          }
          sessionStorage.removeItem('adjustmentRequest');
        } catch (e) {
          console.error('Error parsing adjustment request:', e);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startStreaming]); // Remove thrivings dependency to prevent re-running

  // Handle initial thriving selection from URL (only once when thrivings are loaded)
  useEffect(() => {
    if (thrivings.length === 0) return;
    
    // Only run this once when thrivings are first loaded
    if (selectedThriving) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const thrivingId = urlParams.get('id');
    
    if (thrivingId) {
      const thriving = thrivings.find(t => t.id === thrivingId);
      if (thriving) {
        setSelectedThriving(thriving);
      } else {
        setSelectedThriving(thrivings[0]);
      }
    } else {
      setSelectedThriving(thrivings[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thrivings.length]); // Only depend on length to run once when loaded

  // Show adjustment tutorial when appropriate
  useEffect(() => {
    if (selectedThriving && !showAdjustmentTutorial && !hasShownTutorialInSession.current && typeof window !== 'undefined') {
      const tutorialCount = parseInt(localStorage.getItem('adjustmentTutorialCount') || '0');
      const shouldShowFromNotification = sessionStorage.getItem('showAdjustmentTutorial') === 'true';
      
      // Show tutorial if:
      // 1. User has created a thriving (selectedThriving exists)
      // 2. Tutorial has been shown less than 2 times
      // 3. Not already shown in this session
      // 4. Either flagged from notification modal OR it's the second time
      if (tutorialCount < 2) {
        let delay = 4000; // Default 4 seconds for second time
        
        if (shouldShowFromNotification) {
          // First time - show after notification modal with extra delay
          delay = 2000; // 2 seconds after notification modal
          sessionStorage.removeItem('showAdjustmentTutorial');
        }
        
        // Show tutorial after appropriate delay
        const timer = setTimeout(() => {
          setShowAdjustmentTutorial(true);
          hasShownTutorialInSession.current = true;
        }, delay);
        
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThriving]); // Intentionally exclude showAdjustmentTutorial to prevent re-runs

  const toggleTips = (stepOrder: number) => {
    setExpandedTips(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepOrder)) {
        newSet.delete(stepOrder);
      } else {
        newSet.add(stepOrder);
      }
      return newSet;
    });
  };

  const toggleRecommendations = () => {
    const newState = !isRecommendationsCollapsed;
    setIsRecommendationsCollapsed(newState);
    localStorage.setItem('recommendationsCollapsed', newState.toString());
  };

  const handleThrivingToggle = (thrivingId: string) => {
    const thriving = thrivings.find(r => r.id === thrivingId);
    if (thriving) {
      const updatedThriving = { ...thriving, isActive: !thriving.isActive };
      updateThrivingInStorage(thrivingId, { isActive: !thriving.isActive });
      setThrivings(prev => prev.map(r => 
        r.id === thrivingId ? updatedThriving : r
      ));
    }
  };

  const handleDeleteThriving = (thrivingId: string) => {
    if (confirm('Are you sure you want to delete this thriving?')) {
      deleteThrivingFromStorage(thrivingId);
      const remainingThrivings = thrivings.filter(r => r.id !== thrivingId);
      setThrivings(remainingThrivings);
      
      if (selectedThriving?.id === thrivingId) {
        setSelectedThriving(remainingThrivings[0] || null);
      }
    }
  };

  const handleCompleteThriving = (thrivingId: string) => {
    const thriving = thrivings.find(r => r.id === thrivingId);
    if (thriving) {
      // Show celebration animation
      setShowCelebration(true);
      
      // After celebration, remove the thriving
      setTimeout(() => {
        deleteThrivingFromStorage(thrivingId);
        const remainingThrivings = thrivings.filter(r => r.id !== thrivingId);
        setThrivings(remainingThrivings);
        
        // Select next thriving if available
        if (selectedThriving?.id === thrivingId) {
          setSelectedThriving(remainingThrivings[0] || null);
        }
      }, 3500); // Wait for celebration to finish
    }
  };

  const handleAdjustThriving = async () => {
    if (!selectedThriving || !adjustmentText.trim()) return;
    
    setIsAdjusting(true);
    try {
      const response = await fetch('/api/routine/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentRoutine: selectedThriving,
          userFeedback: adjustmentText,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to adjust thriving');
      
      const adjustedThriving = await response.json();
      
      // Update the thriving in storage
      updateThrivingInStorage(adjustedThriving.id, adjustedThriving);
      
      // Update local state
      setThrivings(prev => prev.map(r => 
        r.id === adjustedThriving.id ? adjustedThriving : r
      ));
      setSelectedThriving(adjustedThriving);
      
      // Reset editor
      setShowAdjustmentEditor(false);
      setAdjustmentText('');
    } catch (error) {
      console.error('Error adjusting thriving:', error);
      alert('Failed to adjust thriving. Please try again.');
    } finally {
      setIsAdjusting(false);
    }
  };

  // Format time to ensure proper AM/PM display
  const formatReminderTime = (time: string | undefined | null) => {
    if (!time) return '';
    
    // Convert to string in case it's not
    const timeStr = String(time);
    
    // If time already includes AM/PM, return as is
    if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
      return timeStr;
    }
    
    // Parse time and add AM/PM
    const timeParts = timeStr.split(':');
    if (timeParts.length !== 2) return timeStr; // Return as is if not in HH:MM format
    
    const hours = Number(timeParts[0]);
    const minutes = Number(timeParts[1]);
    
    if (isNaN(hours) || isNaN(minutes)) return timeStr; // Return as is if not valid numbers
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Handle scroll selection with proper snap detection
  const handleScrollSelection = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    
    // Calculate card dimensions
    const firstCard = container.querySelector('.thriving-card') as HTMLElement;
    if (!firstCard) return;
    
    const cardStyle = window.getComputedStyle(firstCard);
    const cardWidth = firstCard.offsetWidth;
    const cardMargin = parseInt(cardStyle.marginRight) || 16;
    const totalCardWidth = cardWidth + cardMargin;
    
    // Find which card is currently visible
    // Add half card width to get the center point
    const currentIndex = Math.round((scrollLeft + containerWidth / 2 - cardWidth / 2) / totalCardWidth);
    
    // Ensure index is within bounds
    const boundedIndex = Math.max(0, Math.min(currentIndex, thrivings.length - 1));
    
    // Update selection if different
    if (thrivings[boundedIndex] && thrivings[boundedIndex].id !== selectedThriving?.id) {
      setSelectedThriving(thrivings[boundedIndex]);
    }
  }, [thrivings, selectedThriving]);

  // Get the next upcoming step based on current time
  const getNextUpcomingStep = (thriving: Thriving) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

    // Find steps with reminder times
    const stepsWithTimes = thriving.steps
      .filter((step) => step.time)
      .map((step) => {
        const [hours, minutes] = step.time!.split(':').map(Number);
        const stepTime = hours * 60 + minutes;
        return { ...step, stepTime };
      })
      .sort((a, b) => a.stepTime - b.stepTime);

    // Find next upcoming step
    const nextStep = stepsWithTimes.find((step) => step.stepTime > currentTime);

    // If no steps later today, return first step tomorrow
    return nextStep || stepsWithTimes[0];
  };

  // Get count of remaining reminders today
  const getRemainingStepsToday = (thriving: Thriving) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    return thriving.steps.filter((step) => {
      if (!step.time) return false;
      const [hours, minutes] = step.time.split(':').map(Number);
      const stepTime = hours * 60 + minutes;
      return stepTime > currentTime;
    }).length;
  };

  // Calculate progress percentage
  const calculateProgress = (thriving: Thriving) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const stepsWithTimes = thriving.steps.filter(step => step.time);
    const completedSteps = stepsWithTimes.filter(step => {
      if (!step.time) return false;
      const [hours, minutes] = step.time.split(':').map(Number);
      const stepTime = hours * 60 + minutes;
      return stepTime <= currentTime;
    }).length;
    
    return stepsWithTimes.length > 0 ? (completedSteps / stepsWithTimes.length) * 100 : 0;
  };

  // Handle scroll end detection
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScrollEnd = () => {
      handleScrollSelection();
    };

    // Also handle when scrolling programmatically settles
    container.addEventListener('scrollend', handleScrollEnd);
    
    return () => {
      container.removeEventListener('scrollend', handleScrollEnd);
    };
  }, [handleScrollSelection]);

  // Scroll to active step only when coming from external navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stepParam = urlParams.get('step');
    
    // Only scroll if we have a step parameter from URL (from home page navigation)
    if (stepParam !== null && selectedThriving && stepRefs.current[activeStep] && activeStep >= 0) {
      setTimeout(() => {
        stepRefs.current[activeStep]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        
        // Highlight the step temporarily
        setHighlightedStep(activeStep);
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          setHighlightedStep(null);
        }, 3000);
        
        // Clear the URL parameter after scrolling
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('step');
        window.history.replaceState({}, '', newUrl.toString());
      }, 100);
    }
  }, [activeStep, selectedThriving]);


  return (
    <AppLayout
      header={{
        showBackButton: true,
        backHref: cameFromChatThreadId ? `/chat/${cameFromChatThreadId}` : '/',
        title: (
          <div className="flex items-center" style={{ gap: 'min(3vw,0.75rem)' }}>
            <span className="font-bold bg-clip-text text-transparent" style={{ fontSize: 'min(5.5vw,1.375rem)', backgroundImage: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>Thrivings</span>
            <div className="shadow-lg" style={{ width: 'min(11vw,2.75rem)', height: 'min(11vw,2.75rem)', borderRadius: 'min(3vw,0.75rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--secondary), var(--secondary-dark))' }}>
              <Heart className="text-white" style={{ width: 'min(5.5vw,1.375rem)', height: 'min(5.5vw,1.375rem)' }} />
            </div>
          </div>
        )
      }}
    >
      {/* Remove the blocking overlay - we want to see the streaming creation */}

        <div className="max-w-7xl mx-auto p-4 lg:p-8">

          {/* Streaming Creation View */}
          {isStreamingCreation && streamingRoutineData && (
            <div 
              ref={streamingContainerRef}
              className="space-y-6"
            >
              {/* Small Pill Streaming Progress Indicator */}
              {isStreamingCreation && !streamingRoutineData?.isComplete && (
                <div className="fixed top-[min(3vh,1rem)] left-0 right-0 z-50 flex justify-center">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full px-[min(3vw,0.75rem)] py-[min(1.5vw,0.375rem)] shadow-sm border border-gray-100 flex items-center space-x-[min(2vw,0.5rem)]">
                    <svg
                      className="w-[min(4vw,1rem)] h-[min(4vw,1rem)]"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <style>
                        {`
                          @keyframes svg-spin {
                            100% {
                              transform: rotate(360deg);
                            }
                          }
                          .svg-spinner {
                            animation: svg-spin 1s linear infinite;
                            transform-origin: center;
                          }
                        `}
                      </style>
                      <circle
                        className="svg-spinner"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="rgb(147 51 234 / 0.2)"
                        strokeWidth="3"
                        fill="none"
                      />
                      <path
                        className="svg-spinner"
                        d="M12 2a10 10 0 0 1 10 10"
                        stroke="rgb(147 51 234)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                    <span className="text-[min(3vw,0.75rem)] font-medium text-gray-600">Creating...</span>
                  </div>
                </div>
              )}
              
              {/* Completion Indicator */}
              {showCompletionIndicator && (
                <div className="fixed top-4 right-4 z-50 bg-pink-100 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-pink-200 flex items-center space-x-2 animate-bounce-subtle">
                  <CheckCircle2 className="w-4 h-4 text-rose-600" />
                  <span className="text-sm font-medium text-rose-600">Your thriving is ready!</span>
                </div>
              )}
              {/* Streaming Title */}
              <div 
                data-thriving-title
                className={`transform transition-all duration-500 ${
                  streamingElementsVisible.has('thriving-title') 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-4 opacity-0'
                }`}
              >
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {streamingRoutineData.title || 'Creating Your Thriving...'}
                  </h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className="animate-pulse">⚡</span>
                    <span>Personalizing your wellness journey</span>
                  </div>
                </div>
              </div>

              {/* Streaming Description */}
              <div 
                data-thriving-description
                className={`transform transition-all duration-500 ${
                  streamingElementsVisible.has('thriving-description') 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-4 opacity-0'
                }`}
              >
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
                  <p className="text-gray-700 leading-relaxed">
                    {streamingRoutineData.description || 'Generating personalized description...'}
                  </p>
                </div>
              </div>

              {/* Streaming Steps - Only show when steps are available */}
              {streamingRoutineData.steps && streamingRoutineData.steps.length > 0 && (
                <div className="space-y-[min(4vw,1rem)]">
                  <h2 className="text-[min(5vw,1.25rem)] font-semibold text-gray-900">Daily Steps</h2>
                {streamingRoutineData.steps?.map((step, index) => {
                  const stepData = step as { title: string; description: string; time?: string; duration?: number };
                  return (
                  <div
                    key={index}
                    data-step={index + 1}
                    className={`transform transition-all duration-600 ${
                      streamingElementsVisible.has(`step-${index + 1}`) 
                        ? 'translate-y-0 opacity-100' 
                        : 'translate-y-4 opacity-0'
                    }`}
                  >
                    <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center text-rose-600">
                            <Bell className="w-4 h-4 mr-1.5" />
                            <span className="text-sm font-medium">
                              {stepData.time || `Step ${index + 1}`}
                            </span>
                          </div>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500 flex items-center">
                            <Clock className="w-4 h-4 mr-1.5" />
                            {stepData.duration} min
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {stepData.title}
                        </h4>
                      </div>
                      <div className="px-6 py-4">
                        <p className="text-gray-600 leading-relaxed">
                          {stepData.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  );
                })}
                
                {/* Loading placeholder for next step */}
                {streamingRoutineData.steps && streamingRoutineData.steps.length < 5 && !streamingRoutineData.isComplete && (
                  <div className="rounded-[min(5vw,1.25rem)] bg-white shadow-sm border border-gray-100 p-[min(6vw,1.5rem)] opacity-50">
                    <div className="animate-pulse">
                      <div className="h-[min(4vw,1rem)] bg-gray-200 rounded w-1/3 mb-[min(3vw,0.75rem)]"></div>
                      <div className="h-[min(6vw,1.5rem)] bg-gray-200 rounded w-2/3 mb-[min(3vw,0.75rem)]"></div>
                      <div className="h-[min(4vw,1rem)] bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                  )}
                </div>
              )}

              {/* Streaming Additional Recommendations */}
              <div 
                data-recommendations
                className={`transform transition-all duration-600 ${
                  streamingElementsVisible.has('additional-recommendations') 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-4 opacity-0'
                }`}
              >
                {streamingRoutineData.additionalRecommendations && (
                  <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Recommendations</h2>
                    <div className="space-y-3">
                      {streamingRoutineData.additionalRecommendations.map((rec: unknown, index: number) => {
                        const recommendation = rec as { title?: string; description?: string } | string;
                        const title = typeof recommendation === 'string' ? recommendation : recommendation.title || '';
                        const description = typeof recommendation === 'string' ? '' : recommendation.description || '';
                        
                        return (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <p className="font-medium text-gray-900">{title}</p>
                              {description && (
                                <p className="text-sm text-gray-600 mt-1">{description}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Streaming Expected Outcomes */}
              <div 
                data-outcomes
                className={`transform transition-all duration-600 ${
                  streamingElementsVisible.has('expected-outcomes') 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-4 opacity-0'
                }`}
              >
                {streamingRoutineData.expectedOutcomes && (
                  <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Expected Outcomes</h2>
                    <div className="space-y-2">
                      {streamingRoutineData.expectedOutcomes.map((outcome: string, index: number) => (
                        <div key={index} className="flex items-start space-x-3">
                          <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                          <p className="text-gray-700">{outcome}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Streaming Pro Tips */}
              <div 
                data-pro-tips
                className={`transform transition-all duration-600 ${
                  streamingElementsVisible.has('pro-tips') 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-4 opacity-0'
                }`}
              >
                {streamingRoutineData.proTips && (
                  <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                      Pro Tips
                    </h2>
                    <div className="space-y-2">
                      {streamingRoutineData.proTips.map((tip: string, index: number) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-gray-700">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Streaming Safety Notes */}
              <div 
                data-safety-notes
                className={`transform transition-all duration-600 ${
                  streamingElementsVisible.has('safety-notes') 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-4 opacity-0'
                }`}
              >
                {streamingRoutineData.safetyNotes && (
                  <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <Info className="w-5 h-5 mr-2 text-blue-500" />
                      Safety Notes
                    </h2>
                    <div className="space-y-2">
                      {streamingRoutineData.safetyNotes.map((note: string, index: number) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-gray-700">{note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Completion Message */}
              <div 
                data-action-buttons
                className={`transform transition-all duration-400 ${
                  streamingElementsVisible.has('action-buttons') 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-4 opacity-0'
                }`}
              >
                {streamingRoutineData.isComplete && (
                  <div className="rounded-2xl bg-pink-50 p-6 border border-pink-200">
                    <div className="flex items-center justify-center space-x-3">
                      <CheckCircle2 className="w-6 h-6 text-rose-600" />
                      <p className="text-lg font-semibold text-gray-900">
                        Your thriving has been created successfully!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isStreamingCreation && thrivings.length === 0 && (
            <div className="flex flex-col items-center justify-center" style={{ paddingTop: 'min(20vw,5rem)', paddingBottom: 'min(20vw,5rem)' }}>
              <div className="rounded-full flex items-center justify-center shadow-md" style={{ width: 'min(20vw,5rem)', height: 'min(20vw,5rem)', marginBottom: 'min(4vw,1rem)', background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-light))' }}>
                <Plus style={{ width: 'min(10vw,2.5rem)', height: 'min(10vw,2.5rem)', color: 'var(--primary)' }} />
              </div>
              <h2 className="font-semibold text-gray-900" style={{ fontSize: 'min(5vw,1.25rem)', marginBottom: 'min(2vw,0.5rem)' }}>No Thrivings Yet</h2>
              <p className="text-gray-600 text-center max-w-xs" style={{ fontSize: 'min(4vw,1rem)', marginBottom: 'min(6vw,1.5rem)' }}>
                Create personalized wellness thrivings to support your healing journey
              </p>
              <Button
                onClick={() => window.location.href = '/chat/new'}
                variant="gradient"
                springAnimation
                gradientOverlay
                cardGlow
                haptic="medium"
                shadow="lg"
                className="text-white font-semibold"
                style={{
                  fontSize: 'min(4vw,1rem)',
                  padding: 'min(3vw,0.75rem) min(6vw,1.5rem)',
                  borderRadius: 'min(12vw,3rem)',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))'
                }}
              >
                Create Your First Thriving
              </Button>
            </div>
          )}

          {/* Existing Thrivings */}
          {!isStreamingCreation && thrivings.length > 0 && (
            <>
              {/* Thriving Cards - Horizontal Scroll */}
              <div className="relative mb-8">
                {/* Scroll Indicators - Dots at bottom */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center z-10" style={{ bottom: 'min(-2vw,-0.5rem)', gap: 'min(1.5vw,0.375rem)' }}>
                  {[...thrivings, { id: 'add-new' }].map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (scrollContainerRef.current && index < thrivings.length) {
                          const container = scrollContainerRef.current;
                          const cards = container.querySelectorAll('.thriving-card');
                          const targetCard = cards[index] as HTMLElement;
                          
                          if (targetCard) {
                            // Scroll to the exact position of the card
                            container.scrollTo({
                              left: targetCard.offsetLeft - 16, // Account for padding
                              behavior: 'smooth'
                            });
                            
                            // Update selection immediately
                            setSelectedThriving(thrivings[index]);
                          }
                        } else if (index === thrivings.length) {
                          // Handle "add new" card
                          const container = scrollContainerRef.current;
                          const addNewCard = container?.lastElementChild as HTMLElement;
                          if (addNewCard) {
                            container?.scrollTo({
                              left: addNewCard.offsetLeft - 16,
                              behavior: 'smooth'
                            });
                          }
                        }
                      }}
                      className={`rounded-full transition-all ${
                        item.id !== 'add-new' && selectedThriving?.id === item.id
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      style={{ 
                        width: item.id !== 'add-new' && selectedThriving?.id === item.id ? 'min(6vw,1.5rem)' : 'min(2vw,0.5rem)',
                        height: 'min(2vw,0.5rem)'
                      }}
                    />
                  ))}
                </div>

                <div 
                  ref={scrollContainerRef}
                  className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory scroll-smooth -mx-4 px-4"
                  style={{ 
                    scrollbarWidth: 'none', 
                    msOverflowStyle: 'none',
                    scrollSnapType: 'x mandatory',
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch'
                  }}
                  onScroll={() => {
                    // Clear any existing timeout
                    if (scrollTimeoutRef.current) {
                      clearTimeout(scrollTimeoutRef.current);
                    }
                    
                    // Update selection after scrolling stops
                    scrollTimeoutRef.current = setTimeout(() => {
                      handleScrollSelection();
                    }, 150); // Wait for scroll to settle
                  }}
                >
                  {thrivings.map((thriving) => (
                    <div
                      key={thriving.id}
                      onClick={() => setSelectedThriving(thriving)}
                      className={`thriving-card flex-shrink-0 w-[min(85vw,20rem)] rounded-[min(6vw,1.5rem)] p-[min(5vw,1.25rem)] cursor-pointer transition-all snap-center snap-always relative overflow-hidden backdrop-blur-sm bg-white ${
                        selectedThriving?.id === thriving.id 
                          ? '' 
                          : 'shadow-sm hover:shadow-md border border-gray-100'
                      }`}
                      style={{ 
                        scrollSnapAlign: 'center', 
                        scrollSnapStop: 'always',
                        boxShadow: selectedThriving?.id === thriving.id 
                          ? '0 0 0 1px rgba(100, 210, 160, 0.15), 0 0 12px rgba(100, 210, 160, 0.2), 0 2px 8px rgba(100, 210, 160, 0.15)' 
                          : undefined 
                      }}
                    >
                      
                      {/* Content wrapper */}
                      <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="h-[4.5rem] flex items-start">
                            <div className="rounded-[min(3.5vw,0.875rem)] bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center flex-shrink-0 shadow-md" style={{ width: 'min(11vw,2.75rem)', height: 'min(11vw,2.75rem)', marginRight: 'min(3vw,0.75rem)' }}>
                              <Heart className="text-white" style={{ width: 'min(5.5vw,1.375rem)', height: 'min(5.5vw,1.375rem)' }} />
                            </div>
                            <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug text-[min(4.5vw,1.125rem)]">
                              {thriving.title}
                            </h3>
                          </div>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleThrivingToggle(thriving.id);
                          }}
                          variant="ghost"
                          size="sm"
                          haptic="light"
                          icon={thriving.isActive ? 
                            <Pause className="w-[min(3.5vw,0.875rem)] h-[min(3.5vw,0.875rem)]" /> : 
                            <Bell className="w-[min(3.5vw,0.875rem)] h-[min(3.5vw,0.875rem)]" />
                          }
                          className={`font-medium ${thriving.isActive ? 'text-orange-600' : 'text-gray-600'}`}
                        >
                          {thriving.isActive ? 'Pause' : 'Activate'}
                        </Button>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center" style={{ marginBottom: 'min(2vw,0.5rem)' }}>
                          <span className="text-gray-500" style={{ fontSize: 'min(3.5vw,0.875rem)' }}>Today&apos;s Progress</span>
                          <span className="font-semibold text-rose-600" style={{ fontSize: 'min(3.5vw,0.875rem)' }}>
                            {getRemainingStepsToday(thriving) === 0 
                              ? '✓ All done!' 
                              : `${getRemainingStepsToday(thriving)} more ${getRemainingStepsToday(thriving) === 1 ? 'step' : 'steps'}`
                            }
                          </span>
                        </div>
                        <div className="bg-gray-100 rounded-full overflow-hidden" style={{ height: 'min(1.5vw,0.375rem)' }}>
                          <div 
                            className="h-full bg-gradient-to-r from-sage-400 to-sage-500 transition-all duration-500"
                            style={{ width: `${calculateProgress(thriving)}%` }}
                          />
                        </div>
                      </div>

                      {/* What's Next */}
                      {(() => {
                        const nextStep = getNextUpcomingStep(thriving);
                        const remainingToday = getRemainingStepsToday(thriving);
                        
                        return nextStep ? (
                          <div 
                            className="cursor-pointer transition-all backdrop-blur-sm hover:shadow-md"
                            style={{ borderRadius: 'min(4vw,1rem)', padding: 'min(4vw,1rem)', marginBottom: 'min(3vw,0.75rem)', background: 'linear-gradient(135deg, rgba(100, 210, 160, 0.1), rgba(255, 182, 193, 0.1))', border: '1px solid rgba(100, 210, 160, 0.3)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedThriving(thriving);
                              // Find the index of this step in the sorted steps array
                              const stepIndex = findSortedStepIndex(thriving.steps, nextStep.id);
                              setActiveStep(stepIndex);
                              
                              // Manually scroll to the step
                              setTimeout(() => {
                                if (stepRefs.current[stepIndex]) {
                                  stepRefs.current[stepIndex]?.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'center',
                                  });
                                  
                                  // Highlight the step temporarily
                                  setHighlightedStep(stepIndex);
                                  
                                  // Remove highlight after 3 seconds
                                  setTimeout(() => {
                                    setHighlightedStep(null);
                                  }, 3000);
                                }
                              }, 100);
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-500" style={{ fontSize: 'min(3.5vw,0.875rem)' }}>
                                Next: {nextStep.time ? formatReminderTime(nextStep.time) : 'Soon'}
                              </span>
                              {remainingToday > 1 && (
                                <span className="text-gray-400" style={{ fontSize: 'min(3vw,0.75rem)' }}>
                                  +{remainingToday - 1} more
                                </span>
                              )}
                            </div>
                            <p className="font-semibold text-gray-900" style={{ fontSize: 'min(4vw,1rem)' }}>{nextStep.title}</p>
                          </div>
                        ) : (
                          <div className="text-gray-500 italic" style={{ fontSize: 'min(3vw,0.75rem)' }}>
                            No scheduled reminders
                          </div>
                        );
                      })()}
                      
                      {/* Journal Button */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/thrivings/${thriving.id}/journal`;
                        }}
                        size="sm"
                        fullWidth
                        className="mt-[min(3vw,0.75rem)] relative overflow-hidden font-medium"
                        style={{
                          backgroundColor: '#f3f4f6', // gray-100
                          color: '#ec4899' // rose-500
                        }}
                        icon={<BookOpen className="w-[min(4vw,1rem)] h-[min(4vw,1rem)]" />}
                        springAnimation
                        haptic="medium"
                      >
                        Journal
                      </Button>
                      </div>
                    </div>
                  ))}

                  {/* Add New Thriving Card */}
                  <button
                    onClick={() => {
                      sessionStorage.setItem('initialMessage', 'Create a wellness thriving for me');
                      window.location.href = '/chat/new?intent=create_thriving';
                    }}
                    className="flex-shrink-0 w-[calc(85vw)] max-w-sm rounded-[min(6vw,1.5rem)] border-2 border-dashed border-pink-300 p-[min(6vw,1.5rem)] flex flex-col items-center justify-center cursor-pointer hover:border-rose-400 hover:bg-gradient-to-br hover:from-pink-50 hover:to-rose-50 transition-all snap-center snap-always active:scale-95"
                    style={{ scrollSnapAlign: 'center', scrollSnapStop: 'always' }}
                  >
                    <Plus className="text-pink-400 mb-[min(3vw,0.75rem)]" style={{ width: 'min(12vw,3rem)', height: 'min(12vw,3rem)' }} />
                    <p className="text-gray-900 font-medium" style={{ fontSize: 'min(4vw,1rem)' }}>Create New Thriving</p>
                    <p className="text-gray-600 text-center mt-[min(1vw,0.25rem)]" style={{ fontSize: 'min(3.5vw,0.875rem)' }}>
                      Add a personalized thriving to your wellness journey
                    </p>
                  </button>
                </div>
              </div>
              
              {/* Swipe Indicator - Below Cards */}
              {thrivings.length > 1 && (
                <div className="flex items-center justify-center text-gray-400 animate-pulse" style={{ fontSize: 'min(3vw,0.75rem)', marginBottom: 'min(6vw,1.5rem)' }}>
                  <span>swipe to see more</span>
                  <ChevronRight style={{ width: 'min(3vw,0.75rem)', height: 'min(3vw,0.75rem)', marginLeft: 'min(0.5vw,0.125rem)' }} />
                </div>
              )}

              {/* Selected Thriving Details */}
              {selectedThriving && (
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Steps Section */}
                    <div className="lg:col-span-2 space-y-4">
                    {/* Daily Reminders Section */}
                    <div className="rounded-[min(6vw,1.5rem)] bg-white shadow-md border border-gray-100 relative overflow-hidden" style={{ padding: 'min(6vw,1.5rem)' }}>
                      {/* Subtle gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-50/20 via-transparent to-transparent pointer-events-none" />
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-center mb-6">
                          <div className="flex items-center" style={{ gap: 'min(3vw,0.75rem)' }}>
                            <div className="rounded-[min(3vw,0.75rem)] bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg" style={{ width: 'min(10vw,2.5rem)', height: 'min(10vw,2.5rem)' }}>
                              <Bell className="text-white" style={{ width: 'min(5vw,1.25rem)', height: 'min(5vw,1.25rem)' }} />
                            </div>
                            <div>
                              <h2 className="font-semibold text-gray-900" style={{ fontSize: 'min(5vw,1.25rem)' }}>Daily Rituals</h2>
                              <p className="text-gray-500 mt-[min(1vw,0.25rem)]" style={{ fontSize: 'min(3vw,0.75rem)' }}>Gentle reminders for your wellness journey</p>
                            </div>
                          </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              // Scroll to adjust button and click it
                              if (adjustButtonRef.current) {
                                adjustButtonRef.current.scrollIntoView({ 
                                  behavior: 'smooth', 
                                  block: 'center' 
                                });
                                
                                // Add visual indication
                                adjustButtonRef.current.classList.add('animate-pulse');
                                
                                // Click after 2 seconds
                                setTimeout(() => {
                                  if (adjustButtonRef.current) {
                                    adjustButtonRef.current.classList.remove('animate-pulse');
                                    adjustButtonRef.current.click();
                                  }
                                }, 2000);
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-gray-50 transition-all touch-feedback touch-manipulation active:scale-95"
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteThriving(selectedThriving.id)}
                            className="p-2 rounded-lg hover:bg-gray-50 transition-all touch-feedback touch-manipulation active:scale-95"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>

                      {/* 
                        Alternative Design Options:
                        
                        1. Current Design: Card with header section
                        2. Minimal Timeline: Vertical timeline with dots
                        3. Compact Cards: Simple cards with inline time
                      */}
                      
                      <div className="space-y-4">
                        {sortThrivingSteps(selectedThriving.steps).map((step, index) => (
                          <div 
                            key={step.id || index} 
                            ref={el => {stepRefs.current[index] = el;}}
                            className="group">
                            <div className={`rounded-[min(5vw,1.25rem)] bg-white shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden relative ${
                              highlightedStep === index 
                                ? 'ring-2 ring-offset-2 ring-pink-400 border-2 border-transparent shadow-lg shadow-pink-200' 
                                : 'border border-gray-100 hover:border-gray-200'
                            }`}>
                              {/* Subtle gradient overlay */}
                              <div className="absolute inset-0 bg-gradient-to-br from-rose-50/20 via-transparent to-transparent pointer-events-none" />
                              
                              <div className="relative z-10">
                              {/* Header with time and title */}
                              <div className="border-b border-gray-100" style={{ padding: 'min(4vw,1rem) min(6vw,1.5rem)' }}>
                                <div className="flex items-center" style={{ gap: 'min(3vw,0.75rem)', marginBottom: 'min(2vw,0.5rem)' }}>
                                  <div className="flex items-center text-rose-600">
                                    <Bell style={{ width: 'min(4vw,1rem)', height: 'min(4vw,1rem)', marginRight: 'min(1.5vw,0.375rem)' }} />
                                    <span className="font-medium" style={{ fontSize: 'min(3.5vw,0.875rem)' }}>
                                      {step.time ? formatReminderTime(step.time) : `Step ${index + 1}`}
                                    </span>
                                  </div>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-gray-500 flex items-center" style={{ fontSize: 'min(3.5vw,0.875rem)' }}>
                                    <Clock style={{ width: 'min(4vw,1rem)', height: 'min(4vw,1rem)', marginRight: 'min(1.5vw,0.375rem)' }} />
                                    {step.duration} min
                                  </span>
                                </div>
                                <h4 className="font-semibold text-gray-900" style={{ fontSize: 'min(4.5vw,1.125rem)' }}>
                                  {step.title}
                                </h4>
                              </div>

                              {/* Content */}
                              <div style={{ padding: 'min(4vw,1rem) min(6vw,1.5rem)' }}>
                                <p className="text-gray-500 leading-relaxed" style={{ fontSize: 'min(3.5vw,0.875rem)' }}>
                                  {step.description}
                                </p>
                                
                                {/* Action buttons area - only show if there are buttons to display */}
                                {((step.tips && step.tips.length > 0) || step.videoUrl || step.will_video_tutorial_help) && (
                                  <div className="mt-4 flex items-center justify-between">
                                    {/* Pro Tips button */}
                                    {step.tips && step.tips.length > 0 ? (
                                      <button
                                        onClick={() => toggleTips(index + 1)}
                                        className="flex items-center transition-colors"
                                        style={{ fontSize: 'min(3.5vw,0.875rem)', color: 'var(--primary)' }}
                                      >
                                        <Lightbulb style={{ width: 'min(4vw,1rem)', height: 'min(4vw,1rem)', marginRight: 'min(1.5vw,0.375rem)' }} />
                                        Pro Tips
                                        {expandedTips.has(index + 1) ? (
                                          <ChevronUp style={{ width: 'min(4vw,1rem)', height: 'min(4vw,1rem)', marginLeft: 'min(1vw,0.25rem)' }} />
                                        ) : (
                                          <ChevronDown style={{ width: 'min(4vw,1rem)', height: 'min(4vw,1rem)', marginLeft: 'min(1vw,0.25rem)' }} />
                                        )}
                                      </button>
                                    ) : (
                                      <div /> // Empty div to maintain flex layout
                                    )}
                                    
                                    {/* Tutorial button - aligned to the right */}
                                    {(step.videoUrl || step.will_video_tutorial_help) && (
                                      <button
                                        onClick={() => {
                                          if (step.videoUrl && step.videoUrl.includes('youtube.com') || step.videoUrl?.includes('youtu.be')) {
                                            window.open(step.videoUrl, '_blank');
                                          } else {
                                            window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(step.title + ' tutorial')}`, '_blank');
                                          }
                                        }}
                                        className="inline-flex items-center rounded-full font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
                                        style={{ padding: 'min(1vw,0.25rem) min(3vw,0.75rem)', fontSize: 'min(3vw,0.75rem)', background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-light))', color: 'white', border: '1px solid var(--primary-light)' }}
                                      >
                                        <Play className="fill-current" style={{ width: 'min(3vw,0.75rem)', height: 'min(3vw,0.75rem)', marginRight: 'min(1.5vw,0.375rem)' }} />
                                        Tutorial
                                      </button>
                                    )}
                                  </div>
                                )}
                                
                                {/* Pro Tips Content - Collapsible */}
                                {step.tips && step.tips.length > 0 && expandedTips.has(index + 1) && (
                                  <div className="" style={{ marginTop: 'min(3vw,0.75rem)', padding: 'min(4vw,1rem)', borderRadius: 'min(2vw,0.5rem)', background: 'linear-gradient(135deg, rgba(255, 228, 132, 0.15), rgba(255, 199, 95, 0.15))', border: '1px solid rgba(255, 199, 95, 0.3)' }}>
                                    <ul style={{ display: 'flex', flexDirection: 'column', gap: 'min(2vw,0.5rem)' }}>
                                      {step.tips.map((tip, idx) => (
                                        <li key={idx} className="text-gray-600 flex items-start" style={{ fontSize: 'min(3.5vw,0.875rem)' }}>
                                          <span className="rounded-full flex-shrink-0 bg-yellow-500" style={{ width: 'min(1.5vw,0.375rem)', height: 'min(1.5vw,0.375rem)', marginTop: 'min(1.5vw,0.375rem)', marginRight: 'min(2vw,0.5rem)' }} />
                                          {tip}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      </div>
                    </div>

                    {/* Additional Recommendations Section */}
                    {selectedThriving.additionalRecommendations && selectedThriving.additionalRecommendations.length > 0 && (
                      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center">
                            <Package className="w-5 h-5 mr-2 text-purple-500" />
                            <h2 className="text-xl font-semibold text-gray-900">Additional Recommendations</h2>
                          </div>
                          <button
                            onClick={toggleRecommendations}
                            className="p-2 rounded-lg hover:bg-gray-50 transition-all touch-feedback touch-manipulation active:scale-95"
                          >
                            {isRecommendationsCollapsed ? (
                              <ChevronDown className="w-5 h-5 text-gray-600" />
                            ) : (
                              <ChevronUp className="w-5 h-5 text-gray-600" />
                            )}
                          </button>
                        </div>
                        
                        {isRecommendationsCollapsed ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedThriving.additionalRecommendations.map((rec, index) => {
                              const title = typeof rec === 'string' ? rec : rec.title;
                              return (
                                <span
                                  key={index}
                                  className="inline-flex items-center text-sm text-gray-600"
                                >
                                  <span className="font-medium">{title}</span>
                                  {index < (selectedThriving.additionalRecommendations?.length ?? 0) - 1 && (
                                    <span className="mx-2 text-gray-400">•</span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {selectedThriving.additionalRecommendations.map((rec, index) => {
                              const isString = typeof rec === 'string';
                              const title = isString ? rec : rec.title;
                              const description = isString ? 'Consider adding this to your wellness routine for enhanced benefits.' : rec.description;
                              const tips = isString ? [] : (rec.tips || []);
                              const frequency = isString ? undefined : rec.frequency;
                              
                              // Icon mapping based on recommendation type
                              const getIcon = () => {
                                const titleLower = title.toLowerCase();
                                if (titleLower.includes('humidifier') || titleLower.includes('air')) return '💨';
                                if (titleLower.includes('exercise') || titleLower.includes('equipment')) return '🏋️';
                                if (titleLower.includes('filter') || titleLower.includes('clean')) return '🧹';
                                if (titleLower.includes('supplement') || titleLower.includes('vitamin')) return '💊';
                                if (titleLower.includes('sleep') || titleLower.includes('bed')) return '🛏️';
                                if (titleLower.includes('water') || titleLower.includes('hydrat')) return '💧';
                                return '📦';
                              };

                              return (
                                <div
                                  key={index}
                                  className="group relative rounded-2xl bg-white border border-gray-100 hover:border-purple-300 hover:shadow-lg transition-all overflow-hidden"
                                >
                                  <div className="p-5">
                                    {/* Header with Icon and Title */}
                                    <div className="flex items-start gap-4">
                                      <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0 text-2xl shadow-sm">
                                        {getIcon()}
                                      </div>
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 text-lg">{title}</h4>
                                        {frequency && (
                                          <span className="inline-block mt-1 text-xs font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                                            {frequency.replace('_', ' ')}
                                          </span>
                                        )}
                                        {description && (
                                          <p className="text-sm text-gray-600 mt-2">
                                            {description}
                                          </p>
                                        )}
                                        {tips.length > 0 && (
                                          <div className="mt-3">
                                            <p className="text-xs font-medium text-gray-700 mb-2">Tips:</p>
                                            <ul className="space-y-1">
                                              {tips.map((tip, tipIndex) => (
                                                <li key={tipIndex} className="text-sm text-gray-600 flex items-start">
                                                  <span className="text-purple-500 mr-2">•</span>
                                                  <span>{tip}</span>
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                        {!isString && (rec.videoSearchQuery || rec.will_video_tutorial_help) && (
                                          <div className="mt-4">
                                            <button
                                              onClick={() => {
                                                const searchQuery = rec.videoSearchQuery || title + ' tutorial';
                                                window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`, '_blank');
                                              }}
                                              className="inline-flex items-center rounded-full font-medium transition-all shadow-sm hover:shadow-md touch-feedback active:scale-95"
                                              style={{ background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-light))', color: 'white', border: '1px solid var(--primary-light)', padding: 'min(2vw,0.5rem) min(4vw,1rem)', fontSize: 'min(3.5vw,0.875rem)' }}
                                            >
                                              <Play className="fill-current" style={{ width: 'min(3.5vw,0.875rem)', height: 'min(3.5vw,0.875rem)', marginRight: 'min(2vw,0.5rem)' }} />
                                              Tutorial
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Info Section */}
                  <div className="space-y-4">
                    {/* Complete and Delete Buttons */}
                    <div className="" style={{ borderRadius: 'min(4vw,1rem)', padding: 'min(4vw,1rem)', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))', border: '1px solid var(--primary-light)' }}>
                      <div className="flex" style={{ gap: 'min(3vw,0.75rem)' }}>
                        <button
                          onClick={() => handleCompleteThriving(selectedThriving.id)}
                          className="flex-1 text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center touch-feedback touch-manipulation active:scale-95"
                          style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', padding: 'min(2.5vw,0.625rem) min(4vw,1rem)', borderRadius: 'min(3vw,0.75rem)', gap: 'min(2vw,0.5rem)', fontSize: 'min(3.5vw,0.875rem)' }}
                        >
                          <CheckCircle2 style={{ width: 'min(4vw,1rem)', height: 'min(4vw,1rem)' }} />
                          <span>Complete</span>
                        </button>
                        
                        <button
                          onClick={() => handleDeleteThriving(selectedThriving.id)}
                          className="flex-1 bg-white/80 backdrop-blur-sm text-gray-700 font-medium border border-gray-200 hover:bg-white/90 transition-all flex items-center justify-center touch-feedback touch-manipulation active:scale-95"
                          style={{ padding: 'min(2.5vw,0.625rem) min(4vw,1rem)', borderRadius: 'min(3vw,0.75rem)', gap: 'min(2vw,0.5rem)', fontSize: 'min(3.5vw,0.875rem)' }}
                        >
                          <Trash2 style={{ width: 'min(4vw,1rem)', height: 'min(4vw,1rem)' }} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Thriving Adjustment */}
                    <div className="bg-white shadow-sm border border-gray-200" data-adjust-section style={{ borderRadius: 'min(4vw,1rem)', padding: 'min(6vw,1.5rem)' }}>
                      <h3 className="font-semibold text-gray-900 flex items-center" style={{ fontSize: 'min(4.5vw,1.125rem)', marginBottom: 'min(4vw,1rem)' }}>
                        <Settings style={{ width: 'min(5vw,1.25rem)', height: 'min(5vw,1.25rem)', marginRight: 'min(2vw,0.5rem)', color: 'var(--primary)' }} />
                        Adjust Thriving
                      </h3>
                      
                      {!showAdjustmentEditor ? (
                        <div>
                          <p className="text-gray-600" style={{ fontSize: 'min(3.5vw,0.875rem)', marginBottom: 'min(4vw,1rem)' }}>
                            Need to adjust this thriving to better fit your schedule or preferences?
                          </p>
                          <button
                            ref={adjustButtonRef}
                            data-adjust-button
                            onClick={() => setShowAdjustmentEditor(true)}
                            className="w-full font-medium transition-all active:scale-95"
                            style={{ background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-light))', color: 'white', padding: 'min(3vw,0.75rem) min(4vw,1rem)', borderRadius: 'min(3vw,0.75rem)', fontSize: 'min(3.5vw,0.875rem)' }}
                          >
                            Adjust Thriving
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <textarea
                            value={adjustmentText}
                            onChange={(e) => setAdjustmentText(e.target.value)}
                            placeholder="Describe how you'd like to adjust this thriving. For example: 'My work hours are 9 AM to 6 PM, so please adjust the thriving timing accordingly...'"
                            className="w-full border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 resize-none"
                            style={{ padding: 'min(4vw,1rem)', borderRadius: 'min(3vw,0.75rem)', fontSize: 'min(3.5vw,0.875rem)' }}
                            rows={4}
                          />
                          <div className="flex gap-2">
                            <LoadingButton
                              onClick={handleAdjustThriving}
                              disabled={!adjustmentText.trim()}
                              isLoading={isAdjusting}
                              className="flex-1 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all active:scale-95"
                              style={{ padding: 'min(2.5vw,0.625rem) min(4vw,1rem)', borderRadius: 'min(3vw,0.75rem)', fontSize: 'min(3.5vw,0.875rem)', background: 'linear-gradient(135deg, #64d2a0, #5fb88f)' }}
                              loadingMessages={[
                                'Adjusting...',
                                'Analyzing...',
                                'Updating...',
                                'Personalizing...',
                                'Finalizing...'
                              ]}
                              messageInterval={2500}
                            >
                              Apply Adjustments
                            </LoadingButton>
                            <button
                              onClick={() => {
                                setShowAdjustmentEditor(false);
                                setAdjustmentText('');
                              }}
                              disabled={isAdjusting}
                              className="border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all active:scale-95"
                              style={{ padding: 'min(2.5vw,0.625rem) min(4vw,1rem)', borderRadius: 'min(3vw,0.75rem)', fontSize: 'min(3.5vw,0.875rem)' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Thriving Description & Expected Outcomes */}
                    <div className="bg-white shadow-sm border border-gray-200" style={{ borderRadius: 'min(4vw,1rem)', padding: 'min(6vw,1.5rem)' }}>
                      <h3 className="font-semibold text-gray-900 flex items-center" style={{ fontSize: 'min(4.5vw,1.125rem)', marginBottom: 'min(4vw,1rem)' }}>
                        <Target style={{ width: 'min(5vw,1.25rem)', height: 'min(5vw,1.25rem)', marginRight: 'min(2vw,0.5rem)', color: 'var(--primary)' }} />
                        About This Thriving
                      </h3>
                      
                      {/* Description */}
                      <p className="text-gray-600 leading-relaxed" style={{ fontSize: 'min(3.5vw,0.875rem)' }}>
                        {selectedThriving.description}
                      </p>
                    </div>
                    
                    {/* Pro Tips */}
                    {selectedThriving.proTips && selectedThriving.proTips.length > 0 && (
                      <div className="bg-white shadow-sm border border-gray-200" style={{ borderRadius: 'min(4vw,1rem)', padding: 'min(6vw,1.5rem)' }}>
                        <h3 className="font-semibold text-gray-900 flex items-center" style={{ fontSize: 'min(4.5vw,1.125rem)', marginBottom: 'min(4vw,1rem)' }}>
                          <Lightbulb className="text-yellow-500" style={{ width: 'min(5vw,1.25rem)', height: 'min(5vw,1.25rem)', marginRight: 'min(2vw,0.5rem)' }} />
                          Pro Tips
                        </h3>
                        
                        <ul className="space-y-2">
                          {selectedThriving.proTips.map((tip, index) => (
                            <li key={index} className="flex items-start">
                              <span style={{ marginRight: 'min(2vw,0.5rem)', color: 'var(--primary)' }}>•</span>
                              <span className="text-gray-600" style={{ fontSize: 'min(3.5vw,0.875rem)' }}>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Notification Settings */}
                    {selectedThriving.reminderTimes && selectedThriving.reminderTimes.length > 0 && (
                      <ThrivingNotificationCard 
                        thriving={selectedThriving}
                        onSettingsUpdate={async (settings) => {
                          // Update the thriving with new notification settings
                          await updateThrivingInStorage(selectedThriving.id, {
                            notificationSettings: settings
                          });
                          
                          // Update local state
                          setThrivings(prev => prev.map(t => 
                            t.id === selectedThriving.id 
                              ? { ...t, notificationSettings: settings }
                              : t
                          ));
                          setSelectedThriving(prev => 
                            prev?.id === selectedThriving.id 
                              ? { ...prev, notificationSettings: settings }
                              : prev
                          );
                          
                          toast.success('Notification settings updated');
                        }}
                      />
                    )}
                    
                    {/* Expert Help Section */}
                    <ThrivingExpertHelp thriving={selectedThriving} />
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Health Insights Section - Hide during streaming creation */}
          {!isStreamingCreation && thrivings.length > 0 && (
            <HealthInsights />
          )}
        </div>
      
      {/* Celebration Animation */}
      {showCelebration && (
        <CelebrationShower 
          onComplete={() => setShowCelebration(false)}
          duration={3000}
        />
      )}
      
      {/* Adjustment Tutorial */}
      {showAdjustmentTutorial && (
        <AdjustmentTutorial
          onClose={() => {
            setShowAdjustmentTutorial(false);
            const currentCount = parseInt(localStorage.getItem('adjustmentTutorialCount') || '0');
            localStorage.setItem('adjustmentTutorialCount', String(currentCount + 1));
          }}
          onArrowClick={() => {
            // Scroll to the adjust button and click it after 2 seconds
            if (adjustButtonRef.current) {
              // Scroll the button into view
              adjustButtonRef.current.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
              
              // Add a visual indication that the button will be clicked
              adjustButtonRef.current.classList.add('animate-pulse');
              
              // Click the button after 2 seconds
              setTimeout(() => {
                if (adjustButtonRef.current) {
                  adjustButtonRef.current.classList.remove('animate-pulse');
                  adjustButtonRef.current.click();
                }
              }, 2000);
            }
          }}
        />
      )}
    </AppLayout>
  );
}