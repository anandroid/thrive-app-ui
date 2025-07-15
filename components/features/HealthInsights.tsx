'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, Heart, Moon, Footprints, 
  TrendingUp, TrendingDown, Minus,
  ChevronRight, Sparkles,
  Zap, Droplets, Brain
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { TouchLink } from '@/components/ui/TouchLink';
import { healthPermissionManager } from '@/src/utils/healthPermissionManager';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface HealthMetric {
  type: 'steps' | 'heart_rate' | 'sleep' | 'water' | 'calories' | 'mindfulness';
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  goal?: number;
  lastUpdated: Date;
}

interface HealthData {
  metrics: HealthMetric[];
  weeklyTrends: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }[];
  };
  correlations: {
    thriving: string;
    metric: string;
    correlation: number;
    insight: string;
  }[];
}

interface HealthInsightsProps {
  showFullView?: boolean; // New prop to control display mode
}


export default function HealthInsights({ showFullView = true }: HealthInsightsProps) {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [selectedMetric, setSelectedMetric] = useState<string>('steps');
  
  console.log('[HealthInsights] Component rendered with showFullView:', showFullView);

  // Detect platform
  const devicePlatform = typeof window !== 'undefined' && window.ReactNativeBridge ? 
    (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad') ? 'ios' : 'android') : 
    'web';

  const loadHealthData = useCallback(async () => {
    console.log('[HealthInsights] loadHealthData called');
    if (window.ReactNativeBridge?.getHealthData) {
      try {
        console.log('[HealthInsights] Calling bridge.getHealthData()...');
        // Focus on universal metrics that work across iOS and Android
        const data = await window.ReactNativeBridge.getHealthData({
          metrics: ['steps', 'heart_rate', 'sleep', 'calories', 'water'], // Only universal metrics
          timeRange: selectedTimeRange
        });
        console.log('[HealthInsights] Health data received:', data);
        setHealthData(data);
      } catch (error) {
        console.error('[HealthInsights] Error loading health data:', error);
      }
    } else {
      console.log('[HealthInsights] getHealthData method not available');
    }
  }, [selectedTimeRange]);

  const checkHealthPermissions = useCallback(async () => {
    // Use the health permission manager for session-based checking
    const permitted = await healthPermissionManager.getPermissionStatus();
    setHasPermission(permitted);
    if (permitted) {
      loadHealthData();
    }
    setIsLoading(false);
  }, [loadHealthData]);

  useEffect(() => {
    checkHealthPermissions();
  }, [checkHealthPermissions]);

  useEffect(() => {
    if (hasPermission) {
      loadHealthData();
    }
  }, [selectedTimeRange, hasPermission, loadHealthData]);

  const requestHealthPermission = async () => {
    console.log('[HealthInsights] requestHealthPermission called');
    
    try {
      const granted = await healthPermissionManager.requestPermission();
      console.log('[HealthInsights] Permission result:', granted);
      
      if (granted) {
        console.log('[HealthInsights] Permission granted, updating state and loading data');
        setHasPermission(true);
        healthPermissionManager.markPermissionPromptShown();
        
        // Force a fresh permission check to ensure we have the latest status
        const freshStatus = await healthPermissionManager.getPermissionStatus(true);
        console.log('[HealthInsights] Fresh permission status after grant:', freshStatus);
        
        if (freshStatus) {
          loadHealthData();
        }
      } else {
        console.log('[HealthInsights] Permission denied by user');
        // Still check the fresh status in case there was an error
        const freshStatus = await healthPermissionManager.getPermissionStatus(true);
        setHasPermission(freshStatus);
      }
    } catch (error) {
      console.error('[HealthInsights] Error requesting permission:', error);
      // Force refresh the permission status on error
      const freshStatus = await healthPermissionManager.getPermissionStatus(true);
      setHasPermission(freshStatus);
    }
  };

  const getMetricIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      steps: <Footprints className="w-6 h-6" />,
      heart_rate: <Heart className="w-6 h-6" />,
      sleep: <Moon className="w-6 h-6" />,
      water: <Droplets className="w-6 h-6" />,
      calories: <Zap className="w-6 h-6" />
    };
    return icons[type] || <Activity className="w-6 h-6" />;
  };

  const getMetricColor = (type: string) => {
    const colors: Record<string, { bg: string; border: string }> = {
      steps: { bg: 'from-sage-light to-sage', border: 'border-sage-light/30' },
      heart_rate: { bg: 'from-rose to-burgundy', border: 'border-rose/30' }, 
      sleep: { bg: 'from-soft-lavender to-dusty-rose', border: 'border-soft-lavender/30' },
      water: { bg: 'from-sage to-sage-dark', border: 'border-sage/30' },
      calories: { bg: 'from-dusty-rose to-rose', border: 'border-dusty-rose/30' }
    };
    return colors[type] || { bg: 'from-gray-400 to-gray-500', border: 'border-gray-200' };
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    const icons = {
      up: <TrendingUp className="w-4 h-4 text-green-600" />,
      down: <TrendingDown className="w-4 h-4 text-red-600" />,
      stable: <Minus className="w-4 h-4 text-gray-600" />
    };
    return icons[trend];
  };

  const formatMetricValue = (metric: HealthMetric) => {
    if (metric.type === 'sleep') {
      const hours = Math.floor(metric.value);
      const minutes = Math.round((metric.value - hours) * 60);
      return `${hours}h ${minutes}m`;
    }
    return `${metric.value.toLocaleString()} ${metric.unit}`;
  };

  // Don't show anything on thrivings page if permission already granted
  if (!hasPermission && showFullView) {
    // Check if we should show the permission prompt
    if (!healthPermissionManager.shouldShowPermissionPrompt()) {
      return null; // Don't show anything
    }
    
    // Show permission request
    const healthServiceName = devicePlatform === 'ios' ? 'Apple Health' : 
                             devicePlatform === 'android' ? 'Google Fit' : 
                             'Health Data';
    
    const healthServiceIcon = devicePlatform === 'ios' ? '🍎' : 
                             devicePlatform === 'android' ? '🤖' : 
                             '❤️';
    return (
      <div className="mt-8 p-[min(6vw,1.5rem)] rounded-[min(6vw,1.5rem)] bg-gradient-to-br from-sage-light/20 to-rose/10 border border-sage-light/30">
        <div className="text-center">
          <div className="w-[min(16vw,4rem)] h-[min(16vw,4rem)] mx-auto mb-[min(4vw,1rem)] rounded-full bg-white/80 flex items-center justify-center text-[min(8vw,2rem)]">
            {healthServiceIcon}
          </div>
          <h3 className="text-[min(5vw,1.125rem)] font-semibold text-gray-900 mb-[min(2vw,0.5rem)]">
            Connect {healthServiceName}
          </h3>
          <p className="text-[min(3.5vw,0.875rem)] text-gray-600 mb-[min(6vw,1.5rem)] max-w-md mx-auto">
            See how your wellness thrivings impact your health metrics. 
            Track progress and discover insights.
          </p>
          <button
            onClick={requestHealthPermission}
            className="px-[min(6vw,1.5rem)] py-[min(3vw,0.75rem)] rounded-full bg-gradient-to-r from-sage to-sage-dark text-white font-medium shadow-lg hover:shadow-xl transition-all text-[min(4vw,1rem)]"
          >
            Connect {healthServiceName}
          </button>
          {devicePlatform === 'web' && (
            <p className="text-[min(3vw,0.75rem)] text-gray-500 mt-[min(4vw,1rem)]">
              Health data is available in the mobile app
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading || !healthData) {
    console.log('[HealthInsights] Loading state:', { isLoading, hasHealthData: !!healthData, showFullView, hasPermission });
    if (!showFullView) return null; // Don't show loading on home page
    
    return (
      <div className="mt-8 space-y-[min(4vw,1rem)]">
        <div className="h-[min(32vw,8rem)] bg-gray-100 rounded-[min(6vw,1.5rem)] animate-pulse" />
        <div className="grid grid-cols-2 gap-[min(4vw,1rem)]">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-[min(24vw,6rem)] bg-gray-100 rounded-[min(4vw,1rem)] animate-pulse ${i === 5 ? 'col-span-2' : ''}`} />
          ))}
        </div>
      </div>
    );
  }

  // Compact view for home page
  if (!showFullView) {
    // Get today's date info
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = today.getDate();
    
    // Prioritize metrics based on data quality and relevance
    const priorityMetrics = ['steps', 'calories', 'heart_rate', 'sleep', 'water'];
    const sortedMetrics = healthData.metrics
      .filter(m => priorityMetrics.includes(m.type))
      .sort((a, b) => priorityMetrics.indexOf(a.type) - priorityMetrics.indexOf(b.type))
      .slice(0, 3);
    
    // Calculate daily progress for steps (if available)
    const stepsMetric = healthData.metrics.find(m => m.type === 'steps');
    const stepsProgress = stepsMetric && stepsMetric.goal ? 
      Math.round((stepsMetric.value / stepsMetric.goal) * 100) : null;
    
    return (
      <div className="p-[min(4vw,1rem)] rounded-[min(5vw,1.25rem)] bg-white shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-[min(4vw,1rem)]">
          <h3 className="text-[min(4.5vw,1.125rem)] font-semibold text-gray-900 flex items-center gap-[min(2vw,0.5rem)]">
            <Sparkles className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-rose" />
            Health Summary
          </h3>
          <div className="text-right">
            <div className="text-[min(3vw,0.75rem)] text-gray-500">
              {devicePlatform === 'ios' ? 'Apple Health' : 'Google Fit'}
            </div>
            <div className="text-[min(3.5vw,0.875rem)] font-medium text-gray-700">
              {dayOfWeek}, {dayNum}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-[min(3vw,0.75rem)] mb-[min(4vw,1rem)]">
          {sortedMetrics.map((metric) => {
            const colors = getMetricColor(metric.type);
            return (
              <div key={metric.type} className="relative">
                <div className="p-[min(3vw,0.75rem)] rounded-[min(3vw,0.75rem)] bg-gray-50">
                  <div className={`w-[min(10vw,2.5rem)] h-[min(10vw,2.5rem)] mx-auto mb-[min(2vw,0.5rem)] rounded-xl bg-gradient-to-br ${colors.bg} text-white flex items-center justify-center shadow-sm`}>
                    {metric.type === 'steps' ? <Footprints className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)]" /> :
                     metric.type === 'heart_rate' ? <Heart className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)]" /> :
                     metric.type === 'sleep' ? <Moon className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)]" /> :
                     metric.type === 'water' ? <Droplets className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)]" /> :
                     metric.type === 'calories' ? <Zap className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)]" /> :
                     <Activity className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)]" />}
                  </div>
                  <div className="text-[min(4vw,1rem)] font-bold text-gray-900 text-center">
                    {metric.type === 'sleep' ? 
                      `${Math.floor(metric.value)}h` : 
                      metric.value.toLocaleString()
                    }
                  </div>
                  <div className="text-[min(2.5vw,0.625rem)] text-gray-600 text-center capitalize">
                    {metric.type === 'calories' ? 'Calories Burned' : metric.type.replace('_', ' ')}
                  </div>
                  {/* Today's data label */}
                  <div className="text-[min(2vw,0.5rem)] text-gray-500 text-center mt-[min(1vw,0.25rem)]">
                    Today
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Daily goal progress bar (if steps goal exists) */}
        {stepsProgress !== null && (
          <div className="mt-[min(3vw,0.75rem)] pt-[min(3vw,0.75rem)] border-t border-gray-100">
            <div className="flex items-center justify-between mb-[min(2vw,0.5rem)]">
              <span className="text-[min(3vw,0.75rem)] text-gray-600">Daily Steps Goal</span>
              <span className="text-[min(3vw,0.75rem)] font-medium text-gray-900">{stepsProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-[min(2vw,0.5rem)] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stepsProgress, 100)}%` }}
              />
            </div>
          </div>
        )}
        
        {/* View Details Link */}
        <TouchLink
          href="/settings/health"
          variant="subtle"
          className="flex items-center justify-center gap-[min(2vw,0.5rem)] mt-[min(4vw,1rem)] py-[min(2vw,0.5rem)] text-[min(3.5vw,0.875rem)] text-sage-dark hover:text-sage font-medium"
        >
          View Detailed Analytics
          <ChevronRight className="w-[min(4vw,1rem)] h-[min(4vw,1rem)]" />
        </TouchLink>
      </div>
    );
  }

  // Full view for Thrivings page
  return (
    <div className="mt-8 space-y-[min(6vw,1.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[min(6vw,1.5rem)] font-bold text-gray-900 flex items-center gap-[min(2vw,0.5rem)]">
          <Sparkles className="w-[min(6vw,1.5rem)] h-[min(6vw,1.5rem)] text-rose" />
          Health Insights
          {devicePlatform !== 'web' && (
            <span className="text-[min(3.5vw,0.875rem)] font-normal text-gray-500 ml-[min(2vw,0.5rem)]">
              via {devicePlatform === 'ios' ? 'Apple Health' : 'Google Fit'}
            </span>
          )}
        </h2>
        <div className="flex bg-gray-100 rounded-full p-[min(1vw,0.25rem)]">
          {(['day', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range)}
              className={`px-[min(3vw,0.75rem)] py-[min(1vw,0.25rem)] rounded-full text-[min(3.5vw,0.875rem)] font-medium transition-colors ${
                selectedTimeRange === range
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Health Metrics Grid - Focus on core 5 universal metrics */}
      <div className="grid grid-cols-2 gap-[min(4vw,1rem)]">
        {healthData.metrics.slice(0, 5).map((metric, index) => {
          const colors = getMetricColor(metric.type);
          return (
            <button
              key={metric.type}
              onClick={() => setSelectedMetric(metric.type)}
              className={`p-[min(4vw,1rem)] rounded-[min(5vw,1.25rem)] bg-white shadow-sm border-2 hover:shadow-md transition-all text-left ${
                selectedMetric === metric.type ? colors.border : 'border-gray-100'
              } ${index === 4 ? 'col-span-2' : ''}`}
            >
              <div className="flex items-center justify-between mb-[min(3vw,0.75rem)]">
                <div className={`p-[min(2.5vw,0.625rem)] rounded-xl bg-gradient-to-br ${colors.bg} text-white`}>
                  {getMetricIcon(metric.type)}
                </div>
                <div className="flex items-center text-[min(3.5vw,0.875rem)]">
                  {getTrendIcon(metric.trend)}
                  <span className={`ml-1 font-medium ${
                    metric.trend === 'up' ? 'text-green-600' :
                    metric.trend === 'down' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {metric.changePercent > 0 ? '+' : ''}{metric.changePercent}%
                  </span>
                </div>
              </div>
              <div className="mb-[min(2vw,0.5rem)]">
                <div className="text-[min(6vw,1.5rem)] font-bold text-gray-900">
                  {formatMetricValue(metric)}
                </div>
                <div className="text-[min(3.5vw,0.875rem)] text-gray-600 capitalize">
                  {metric.type === 'calories' ? 'Calories Burned' : metric.type.replace('_', ' ')}
                </div>
              </div>
              {metric.goal && (
                <div className="mt-[min(3vw,0.75rem)]">
                  <div className="flex justify-between text-[min(3vw,0.75rem)] text-gray-500 mb-1">
                    <span>Goal</span>
                    <span>{Math.round((metric.value / metric.goal) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${colors.bg} transition-all`}
                      style={{ width: `${Math.min((metric.value / metric.goal) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Detailed Chart */}
      <div className="bg-white rounded-[min(6vw,1.5rem)] p-[min(6vw,1.5rem)] shadow-sm border border-gray-200">
        <h3 className="text-[min(5vw,1.125rem)] font-semibold text-gray-900 mb-[min(4vw,1rem)] capitalize">
          {selectedMetric.replace('_', ' ')} Trends
        </h3>
        <div className="h-64">
          <Line
            data={healthData.weeklyTrends}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  padding: 12,
                  cornerRadius: 8,
                }
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { color: '#6B7280' }
                },
                y: {
                  grid: { color: '#F3F4F6' },
                  ticks: { color: '#6B7280' }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Insights & Correlations */}
      {healthData.correlations.length > 0 && (
        <div className="bg-gradient-to-br from-sage-light/10 to-rose/5 rounded-[min(6vw,1.5rem)] p-[min(6vw,1.5rem)] border border-sage-light/20">
          <h3 className="text-[min(5vw,1.125rem)] font-semibold text-gray-900 mb-[min(4vw,1rem)] flex items-center gap-2">
            <Brain className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-sage-dark" />
            Wellness Correlations
          </h3>
          <div className="space-y-[min(3vw,0.75rem)]">
            {healthData.correlations.map((correlation, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-[min(4vw,1rem)] bg-white/80 rounded-[min(4vw,1rem)] backdrop-blur-sm"
              >
                <div className="flex-1">
                  <p className="text-[min(3.5vw,0.875rem)] font-medium text-gray-900">
                    {correlation.thriving} → {correlation.metric}
                  </p>
                  <p className="text-[min(3vw,0.75rem)] text-gray-600 mt-1">
                    {correlation.insight}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`text-[min(3.5vw,0.875rem)] font-medium ${
                    correlation.correlation > 0.7 ? 'text-green-600' :
                    correlation.correlation > 0.4 ? 'text-yellow-600' :
                    'text-gray-500'
                  }`}>
                    {correlation.correlation > 0.7 ? 'Strong' :
                     correlation.correlation > 0.4 ? 'Moderate' :
                     'Weak'}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}