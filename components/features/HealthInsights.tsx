'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, Heart, Moon, Footprints, 
  TrendingUp, TrendingDown, Minus,
  ChevronRight, Sparkles,
  Zap, Droplets, Brain, Smartphone, Download
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { TouchLink } from '@/components/ui/TouchLink';
import { healthPermissionManager } from '@/src/utils/healthPermissionManager';
import { Modal } from '@/components/ui/Modal';
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
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  
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
    
    // If on web, show download modal instead
    if (devicePlatform === 'web') {
      setShowDownloadModal(true);
      return;
    }
    
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
      steps: { bg: 'from-zen-300 to-zen-400', border: 'border-zen-300/30' },
      heart_rate: { bg: 'from-bloom-400 to-bloom-600', border: 'border-bloom-400/30' }, 
      sleep: { bg: 'from-cosmic-300 to-cosmic-500', border: 'border-cosmic-300/30' },
      water: { bg: 'from-blue-400 to-blue-600', border: 'border-blue-400/30' },
      calories: { bg: 'from-orange-400 to-orange-600', border: 'border-orange-400/30' }
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
    
    return (
      <div 
        onClick={requestHealthPermission}
        className="group mt-8 bg-gradient-to-br from-rose-50 to-red-100/70 rounded-[4vw] max-rounded-[1rem] p-[4vw] max-p-[1rem] mb-[4vw] max-mb-[1rem] cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:from-red-100 hover:to-rose-50 active:scale-[0.98] transition-all duration-200 border border-rose-200/50 shadow-lg touch-feedback"
      >
        <div className="flex items-center justify-between mb-[3vw] max-mb-[0.75rem]">
          <div className="flex items-center gap-[3vw] max-gap-[0.75rem]">
            <div className="w-[10vw] h-[10vw] max-w-[2.5rem] max-h-[2.5rem] bg-white rounded-[2.5vw] max-rounded-[0.625rem] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Heart className="w-[5vw] h-[5vw] max-w-[1.25rem] max-h-[1.25rem] text-red-500 fill-red-500 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h3 className="text-[min(4.5vw,1.125rem)] font-semibold text-gray-800">
                Connect Health Data
              </h3>
              <p className="text-[min(3.5vw,0.875rem)] text-gray-500">
                {devicePlatform === 'ios' ? 'Apple Health' : devicePlatform === 'android' ? 'Google Fit' : 'Health tracking'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-[5vw] h-[5vw] max-w-[1.25rem] max-h-[1.25rem] text-gray-400 group-hover:text-gray-600 group-hover:translate-x-[0.5vw] transition-all" />
        </div>

        <p className="text-[min(3.5vw,0.875rem)] text-gray-700 px-[1vw]">
          See how your wellness thrivings impact your health metrics. Track progress and discover insights.
        </p>
        
        {/* Action button area */}
        <div className="flex items-center justify-center mt-[3vw] max-mt-[0.75rem] pt-[3vw] max-pt-[0.75rem] border-t border-rose-200/30">
          <div className="px-[4vw] max-px-[1rem] py-[2vw] max-py-[0.5rem] rounded-full bg-gradient-to-r from-rose-400 to-red-500 text-white font-medium text-[min(3.5vw,0.875rem)]">
            Connect {healthServiceName}
          </div>
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
            <Sparkles className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-zen-500" />
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
          className="flex items-center justify-center gap-[min(2vw,0.5rem)] mt-[min(4vw,1rem)] py-[min(2vw,0.5rem)] text-[min(3.5vw,0.875rem)] text-zen-600 hover:text-zen-700 font-medium"
        >
          View Detailed Analytics
          <ChevronRight className="w-[min(4vw,1rem)] h-[min(4vw,1rem)]" />
        </TouchLink>
      </div>
    );
  }

  // Full view for Thrivings page
  return (
    <>
      {/* Download App Modal for Web Users */}
      <Modal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        title="Download Thrive App"
        size="md"
      >
        <div className="text-center py-[min(4vw,1rem)]">
          <div className="w-[min(20vw,5rem)] h-[min(20vw,5rem)] mx-auto mb-[min(4vw,1rem)] rounded-[min(5vw,1.25rem)] bg-gradient-to-br from-rose-100 to-sage-100 flex items-center justify-center">
            <Smartphone className="w-[min(10vw,2.5rem)] h-[min(10vw,2.5rem)] text-sage-600" />
          </div>
          
          <h3 className="text-[min(5vw,1.25rem)] font-semibold text-gray-900 mb-[min(2vw,0.5rem)]">
            Health Tracking on Mobile
          </h3>
          
          <p className="text-[min(3.5vw,0.875rem)] text-gray-600 mb-[min(6vw,1.5rem)] px-[min(4vw,1rem)]">
            Connect your health data from Apple Health or Google Fit. Download the Thrive app to sync your wellness journey with your health metrics.
          </p>
          
          <div className="space-y-[min(3vw,0.75rem)]">
            {/* App Store Button */}
            <a
              href={`https://apps.apple.com/app/id${/* TODO: Add App Store ID */'com.thrivenative.app'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-[min(3vw,0.75rem)] w-full max-w-[280px] mx-auto px-[min(5vw,1.25rem)] py-[min(3vw,0.75rem)] bg-black text-white rounded-[min(3vw,0.75rem)] hover:bg-gray-900 transition-colors"
            >
              <Download className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)]" />
              <div className="text-left">
                <div className="text-[min(2.5vw,0.625rem)] opacity-90">Download on the</div>
                <div className="text-[min(4vw,1rem)] font-semibold">App Store</div>
              </div>
            </a>
            
            {/* Google Play Button */}
            <a
              href="https://play.google.com/store/apps/details?id=com.thrivenative.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-[min(3vw,0.75rem)] w-full max-w-[280px] mx-auto px-[min(5vw,1.25rem)] py-[min(3vw,0.75rem)] bg-black text-white rounded-[min(3vw,0.75rem)] hover:bg-gray-900 transition-colors"
            >
              <Download className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)]" />
              <div className="text-left">
                <div className="text-[min(2.5vw,0.625rem)] opacity-90">Get it on</div>
                <div className="text-[min(4vw,1rem)] font-semibold">Google Play</div>
              </div>
            </a>
          </div>
          
          <p className="text-[min(3vw,0.75rem)] text-gray-500 mt-[min(6vw,1.5rem)]">
            Available for iOS and Android devices
          </p>
        </div>
      </Modal>

    <div className="mt-8 space-y-[min(6vw,1.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[min(6vw,1.5rem)] font-bold text-gray-900 flex items-center gap-[min(2vw,0.5rem)]">
          <Sparkles className="w-[min(6vw,1.5rem)] h-[min(6vw,1.5rem)] text-zen-500" />
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
        <div className="bg-gradient-to-br from-zen-200/10 to-bloom-200/5 rounded-[min(6vw,1.5rem)] p-[min(6vw,1.5rem)] border border-zen-300/20">
          <h3 className="text-[min(5vw,1.125rem)] font-semibold text-gray-900 mb-[min(4vw,1rem)] flex items-center gap-2">
            <Brain className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-zen-600" />
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
    </>
  );
}