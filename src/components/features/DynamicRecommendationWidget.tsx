'use client';

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { 
  ChevronRight, Clock, Calendar, ShoppingCart, Bell, 
  TrendingUp, Heart, Sparkles, AlertCircle, CheckCircle,
  Brain, Activity, Moon, Pill, Leaf, Star, RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getThrivingsFromStorage } from '@/src/utils/thrivingStorage';
import { getPantryItems } from '@/src/utils/pantryStorage';
import { getChatHistory } from '@/src/utils/chatStorage';
import { getJourneysFromStorage } from '@/src/utils/journeyStorage';
import { PantryAddModal } from '@/components/features/PantryAddModal';
import { HealthConnectModal } from '@/components/features/HealthConnectModal';

/**
 * Safe icon mapping for dynamically generated widgets
 */
const SAFE_ICONS = {
  ChevronRight, Clock, Calendar, ShoppingCart, Bell,
  TrendingUp, Heart, Sparkles, AlertCircle, CheckCircle,
  Brain, Activity, Moon, Pill, Leaf, Star
};

/**
 * Widget type styling configurations
 */
const WIDGET_STYLES = {
  action: 'widget-bg-action',
  purchase: 'widget-bg-purchase',
  appointment: 'widget-bg-appointment',
  content: 'widget-bg-content',
  reminder: 'widget-bg-reminder',
  insight: 'widget-bg-insight'
};

interface WidgetData {
  componentCode: string;
  widgetType: 'action' | 'purchase' | 'appointment' | 'content' | 'reminder' | 'insight';
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  dataUsed: string[];
  timing: {
    showFor: string;
    bestTime: string;
  };
}

/**
 * Secure sandbox environment for widget execution
 */
const createSandbox = (
  router: ReturnType<typeof useRouter>,
  openModal: (modalName: string, data?: unknown) => void
) => {
  return {
    // Safe window functions
    window: {
      navigateTo: (path: string) => {
        // Validate path to prevent XSS
        if (path.startsWith('/') && !path.includes('javascript:')) {
          router.push(path);
        }
      },
      openModal: (modalName: string, data?: unknown) => {
        // Handle thriving creation through chat navigation
        if (modalName === 'createThriving' && data && typeof data === 'object' && 'type' in data) {
          const modalData = data as { type: string; topic?: string };
          if (modalData.topic) {
            router.push(`/chat/new?intent=create_thriving&topic=${encodeURIComponent(modalData.topic)}&type=${modalData.type}`);
            return;
          }
        }
        // Handle notification settings navigation
        if (modalName === 'notificationSettings') {
          router.push('/settings/notifications');
          return;
        }
        openModal(modalName, data);
      },
      trackAction: (actionName: string) => {
        console.log('[Analytics] Track:', actionName);
        // Add analytics tracking here
      },
      openExternal: (url: string) => {
        // Validate URL
        try {
          const validUrl = new URL(url);
          if (validUrl.protocol === 'https:' || validUrl.protocol === 'http:') {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        } catch {
          console.error('Invalid URL:', url);
        }
      }
    },
    // Safe React and icons
    React,
    ...SAFE_ICONS,
    // Enable raw SVG creation
    svg: 'svg',
    path: 'path',
    circle: 'circle',
    rect: 'rect',
    line: 'line',
    polyline: 'polyline',
    polygon: 'polygon',
    g: 'g',
    defs: 'defs',
    clipPath: 'clipPath',
    linearGradient: 'linearGradient',
    radialGradient: 'radialGradient',
    stop: 'stop'
  };
};

/**
 * Parse and execute dynamic component code safely
 */
const executeDynamicCode = (code: string, sandbox: Record<string, unknown>): React.FC | null => {
  try {
    // Remove import statements as we provide these via sandbox
    const codeWithoutImports = code
      .split('\n')
      .filter(line => !line.trim().startsWith('import'))
      .join('\n');
    
    // Create a function that returns the component
    // Using Function constructor for controlled execution
    const componentFactory = new Function(
      ...Object.keys(sandbox),
      `
      ${codeWithoutImports}
      return RecommendationWidget;
      `
    );
    
    // Execute with sandbox context
    const Component = componentFactory(...Object.values(sandbox));
    
    // Validate the result is a React component
    if (typeof Component === 'function') {
      return Component;
    }
    
    return null;
  } catch (error) {
    console.error('Error executing dynamic widget code:', error);
    return null;
  }
};

interface DynamicRecommendationWidgetProps {
  className?: string;
  onRefresh?: () => void;
}

interface ModalState {
  isOpen: boolean;
  data: Record<string, unknown> | null;
}

/**
 * Dynamic Recommendation Widget Component
 * Fetches and renders AI-generated widget code
 */
export const DynamicRecommendationWidget: React.FC<DynamicRecommendationWidgetProps> = ({
  className = '',
  onRefresh
}) => {
  const router = useRouter();
  const [widgetData, setWidgetData] = useState<WidgetData | null>(() => {
    // Load cached widget data from localStorage
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('thrive_recommendation_widget');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.error('Failed to parse cached widget:', e);
        }
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(!widgetData); // Only show loading if no cached data
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastContextHash, setLastContextHash] = useState<string | null>(null);
  
  // Modal states
  const [modalStates, setModalStates] = useState<Record<string, ModalState>>({
    pantryAdd: { isOpen: false, data: null },
    journalQuick: { isOpen: false, data: null },
    healthConnect: { isOpen: false, data: null }
  });
  
  // Modal handler
  const handleOpenModal = useCallback((modalName: string, data?: unknown) => {
    setModalStates(prev => ({
      ...prev,
      [modalName]: { isOpen: true, data: data as Record<string, unknown> | null }
    }));
  }, []);

  // Create sandbox environment
  const sandbox = useMemo(() => createSandbox(router, handleOpenModal), [router, handleOpenModal]);

  // Generate the dynamic component
  const DynamicWidget = useMemo(() => {
    if (!widgetData?.componentCode) return null;
    const widget = executeDynamicCode(widgetData.componentCode, sandbox);
    if (!widget) {
      console.error('Failed to generate widget from code:', widgetData.componentCode);
    }
    return widget;
  }, [widgetData?.componentCode, sandbox]);

  // Create a simple hash of user context to detect changes
  const getContextHash = useCallback(() => {
    const context = {
      thrivingsCount: getThrivingsFromStorage().length,
      pantryCount: getPantryItems().length,
      chatCount: getChatHistory().length,
      journeyCount: getJourneysFromStorage().length
    };
    return JSON.stringify(context);
  }, []);

  // Fetch recommendation from API
  const fetchRecommendation = async () => {
    try {
      // Gather user data from localStorage
      const userData = {
        thrivings: getThrivingsFromStorage(),
        pantryItems: getPantryItems(),
        chatHistory: getChatHistory(),
        journeys: getJourneysFromStorage()
      };
      
      const response = await fetch('/api/recommendations/widget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            timeOfDay: new Date().getHours() < 12 ? 'morning' : 
                       new Date().getHours() < 17 ? 'afternoon' : 'evening',
            dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' })
          },
          userData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendation');
      }

      const data = await response.json();
      setWidgetData(data);
      
      // Cache the widget data for persistence
      if (typeof window !== 'undefined' && data) {
        try {
          localStorage.setItem('thrive_recommendation_widget', JSON.stringify(data));
        } catch (e) {
          console.error('Failed to cache widget:', e);
        }
      }
    } catch (err) {
      console.error('Error fetching recommendation:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const currentHash = getContextHash();
    const sessionFetched = sessionStorage.getItem('thrive_recommendation_fetched');
    const wasEmpty = sessionStorage.getItem('thrive_recommendation_was_empty');
    
    // Check if context has changed since last check
    const contextChanged = lastContextHash && lastContextHash !== currentHash;
    
    // Fetch if:
    // 1. We haven't fetched this session, OR
    // 2. Context was empty before and now has data, OR
    // 3. Context has significantly changed
    if (!sessionFetched || (wasEmpty === 'true' && currentHash !== '{"thrivingsCount":0,"pantryCount":0,"chatCount":0,"journeyCount":0}') || contextChanged) {
      fetchRecommendation();
      // Mark as fetched for this session
      sessionStorage.setItem('thrive_recommendation_fetched', 'true');
      
      // Store whether context was empty
      const isEmpty = currentHash === '{"thrivingsCount":0,"pantryCount":0,"chatCount":0,"journeyCount":0}';
      sessionStorage.setItem('thrive_recommendation_was_empty', isEmpty ? 'true' : 'false');
    }
    
    // Update the context hash
    setLastContextHash(currentHash);
  }, [getContextHash, lastContextHash]);

  // Set up periodic context checking (every 30 seconds when tab is active)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      // Only check if the tab is visible
      if (document.visibilityState === 'visible') {
        const currentHash = getContextHash();
        if (lastContextHash && lastContextHash !== currentHash) {
          // Context changed, trigger the main useEffect
          setLastContextHash(currentHash);
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkInterval);
  }, [getContextHash, lastContextHash]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRecommendation();
    // Update session storage to mark as fetched
    sessionStorage.setItem('thrive_recommendation_fetched', 'true');
    onRefresh?.();
  };

  // Loading state - only show if no cached data
  if (loading && !isRefreshing && !widgetData) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="rounded-2xl bg-gray-100 h-32"></div>
      </div>
    );
  }

  // Error state - don't show anything if no widget
  if (!DynamicWidget) {
    return null;
  }

  // Apply widget-specific styling
  const gradientClass = widgetData ? WIDGET_STYLES[widgetData.widgetType] : 'widget-bg-reminder';

  return (
    <div className={`${className} relative group`}>
      {/* Render the dynamic widget */}
      <div className={`dynamic-widget-container ${gradientClass}`}>
        <DynamicWidget />
      </div>
      
      {/* Refresh button (shows on hover) */}
      <button
        onClick={handleRefresh}
        className={`absolute top-2 right-2 p-2 rounded-lg bg-white/80 backdrop-blur-sm 
                   opacity-0 group-hover:opacity-100 transition-opacity shadow-sm
                   ${isRefreshing ? 'animate-spin' : ''}`}
        disabled={isRefreshing}
      >
        <RefreshCw className="w-4 h-4 text-gray-600" />
      </button>
      
      {/* Priority indicator */}
      {widgetData?.priority === 'high' && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}
      
      {/* Modals */}
      <PantryAddModal
        isOpen={modalStates.pantryAdd.isOpen}
        onClose={() => setModalStates(prev => ({ ...prev, pantryAdd: { isOpen: false, data: null } }))}
        onAddItem={(item) => {
          // Handle pantry item addition
          console.log('Add pantry item:', item);
          setModalStates(prev => ({ ...prev, pantryAdd: { isOpen: false, data: null } }));
        }}
        initialData={modalStates.pantryAdd.data as { name?: string; notes?: string; tags?: string[] } | undefined}
      />
      
      
      <HealthConnectModal
        isOpen={modalStates.healthConnect.isOpen}
        onClose={() => setModalStates(prev => ({ ...prev, healthConnect: { isOpen: false, data: null } }))}
        onConnect={() => {
          setModalStates(prev => ({ ...prev, healthConnect: { isOpen: false, data: null } }));
          router.push('/settings/health');
        }}
      />
    </div>
  );
};

/**
 * CSS classes for dynamic widgets (to be added to globals.css)
 */
export const WIDGET_CSS = `
.recommendation-widget {
  @apply p-5 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98];
}

.widget-header {
  @apply flex items-center justify-between mb-3;
}

.widget-icon {
  @apply w-10 h-10 rounded-xl flex items-center justify-center shadow-sm;
}

.widget-icon.gradient-rose {
  @apply bg-gradient-to-br from-rose to-burgundy;
}

.widget-icon.gradient-sage {
  @apply bg-gradient-to-br from-sage-light to-sage;
}

.widget-icon.gradient-lavender {
  @apply bg-gradient-to-br from-lavender to-dusty-rose;
}

.widget-content {
  @apply space-y-2;
}

.widget-title {
  @apply font-semibold text-gray-900 text-lg;
}

.widget-description {
  @apply text-sm text-gray-600;
}

.widget-action {
  @apply flex items-center justify-between mt-4 text-sm font-medium text-burgundy;
}

.widget-metric {
  @apply text-2xl font-bold text-gray-900;
}

.widget-tag {
  @apply px-2 py-1 text-xs font-medium rounded-full bg-white/80 text-gray-700;
}

.dynamic-widget-container {
  @apply rounded-2xl overflow-hidden;
}
`;