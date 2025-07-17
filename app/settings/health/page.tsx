'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, Heart, Moon, Footprints,
  Zap, Droplets, Brain,
  Target, Award, CheckCircle
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { AppLayout } from '@/components/layout/AppLayout';
import Button from '@/components/ui/Button';
import { healthPermissionManager } from '@/src/utils/healthPermissionManager';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
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

export default function HealthSettingsPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [selectedMetric, setSelectedMetric] = useState<string>('steps');
  const [isConnecting, setIsConnecting] = useState(false);

  // Detect platform
  const devicePlatform = typeof window !== 'undefined' && window.ReactNativeBridge ? 
    (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad') ? 'ios' : 'android') : 
    'web';

  const healthServiceName = devicePlatform === 'ios' ? 'Apple Health' : 
                           devicePlatform === 'android' ? 'Google Fit' : 
                           'Health Data';

  const loadHealthData = useCallback(async () => {
    console.log('[HealthSettings] loadHealthData called');
    if (window.ReactNativeBridge?.getHealthData) {
      try {
        const data = await window.ReactNativeBridge.getHealthData({
          metrics: ['steps', 'heart_rate', 'sleep', 'calories', 'water', 'mindfulness'],
          timeRange: selectedTimeRange
        });
        console.log('[HealthSettings] Health data received:', data);
        setHealthData(data);
      } catch (error) {
        console.error('[HealthSettings] Error loading health data:', error);
      }
    }
  }, [selectedTimeRange]);

  const checkHealthPermissions = useCallback(async () => {
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

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const granted = await healthPermissionManager.requestPermission();
      console.log('[HealthSettings] Permission request result:', granted);
      
      if (granted) {
        setHasPermission(true);
        
        // Force a fresh permission check to ensure we have the latest status
        const freshStatus = await healthPermissionManager.getPermissionStatus(true);
        console.log('[HealthSettings] Fresh permission status after grant:', freshStatus);
        
        if (freshStatus) {
          loadHealthData();
        }
      } else {
        // Still check the fresh status in case there was an error
        const freshStatus = await healthPermissionManager.getPermissionStatus(true);
        setHasPermission(freshStatus);
      }
    } catch (error) {
      console.error('[HealthSettings] Error requesting permission:', error);
      // Force refresh the permission status on error
      const freshStatus = await healthPermissionManager.getPermissionStatus(true);
      setHasPermission(freshStatus);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setHasPermission(false);
    setHealthData(null);
    localStorage.removeItem('healthDataConnected');
    healthPermissionManager.clearCache();
  };

  const getMetricIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      steps: <Footprints className="w-6 h-6" />,
      heart_rate: <Heart className="w-6 h-6" />,
      sleep: <Moon className="w-6 h-6" />,
      water: <Droplets className="w-6 h-6" />,
      calories: <Zap className="w-6 h-6" />,
      mindfulness: <Brain className="w-6 h-6" />
    };
    return icons[type] || <Activity className="w-6 h-6" />;
  };

  const getMetricColor = (type: string) => {
    const colors: Record<string, { bg: string; border: string; chart: string }> = {
      steps: { bg: 'from-sage-light to-sage', border: 'border-sage-light/30', chart: '#8B9467' },
      heart_rate: { bg: 'from-rose to-burgundy', border: 'border-rose/30', chart: '#D18B92' }, 
      sleep: { bg: 'from-soft-lavender to-dusty-rose', border: 'border-soft-lavender/30', chart: '#C3A0C9' },
      water: { bg: 'from-sage to-sage-dark', border: 'border-sage/30', chart: '#6B7353' },
      calories: { bg: 'from-dusty-rose to-rose', border: 'border-dusty-rose/30', chart: '#C68FA0' },
      mindfulness: { bg: 'from-soft-lavender to-soft-lavender/80', border: 'border-soft-lavender/30', chart: '#E6D7EA' }
    };
    return colors[type] || { bg: 'from-gray-400 to-gray-500', border: 'border-gray-200', chart: '#6B7280' };
  };

  const formatMetricValue = (metric: HealthMetric) => {
    if (metric.type === 'sleep') {
      const hours = Math.floor(metric.value);
      const minutes = Math.round((metric.value - hours) * 60);
      return `${hours}h ${minutes}m`;
    }
    return `${metric.value.toLocaleString()} ${metric.unit}`;
  };

  // Show connection screen if not connected
  if (!hasPermission) {
    return (
      <AppLayout
        header={{
          showBackButton: true,
          backHref: '/settings',
          title: 'Health Data'
        }}
      >
        <div className="max-w-7xl mx-auto p-[min(5vw,1.25rem)]">
          <div className="bg-gradient-to-br from-white via-sage-light/5 to-rose/5 rounded-[min(6vw,1.5rem)] p-[min(8vw,2rem)] text-center border border-sage-light/20">
            <div className="w-[min(20vw,5rem)] h-[min(20vw,5rem)] mx-auto mb-[min(6vw,1.5rem)] rounded-full bg-gradient-to-br from-rose/20 to-sage/20 flex items-center justify-center">
              <Heart className="w-[min(10vw,2.5rem)] h-[min(10vw,2.5rem)] text-rose" />
            </div>
            
            <h2 className="text-[min(6vw,1.5rem)] font-bold text-gray-900 mb-[min(4vw,1rem)]">
              Connect {healthServiceName}
            </h2>
            
            <p className="text-[min(4vw,1rem)] text-gray-600 mb-[min(8vw,2rem)] max-w-md mx-auto">
              Track your wellness progress with real health data. See how your thrivings impact your vitals.
            </p>
            
            <div className="space-y-[min(4vw,1rem)] mb-[min(8vw,2rem)]">
              <div className="flex items-center justify-center gap-[min(3vw,0.75rem)] text-[min(3.5vw,0.875rem)] text-gray-700">
                <CheckCircle className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-green-600" />
                <span>Track steps, heart rate, and sleep</span>
              </div>
              <div className="flex items-center justify-center gap-[min(3vw,0.75rem)] text-[min(3.5vw,0.875rem)] text-gray-700">
                <CheckCircle className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-green-600" />
                <span>See correlations with your routines</span>
              </div>
              <div className="flex items-center justify-center gap-[min(3vw,0.75rem)] text-[min(3.5vw,0.875rem)] text-gray-700">
                <CheckCircle className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-green-600" />
                <span>Get personalized insights</span>
              </div>
            </div>
            
            <Button
              onClick={handleConnect}
              variant="gradient"
              size="lg"
              className="min-w-[200px]"
              springAnimation
              gradientOverlay
              cardGlow
              haptic="medium"
              gradient={{
                from: 'sage',
                to: 'sage-dark',
                hoverFrom: 'sage-dark',
                hoverTo: 'sage-dark',
                activeFrom: 'sage/40',
                activeTo: 'sage-dark/30'
              }}
              loading={isConnecting}
            >
              Connect {healthServiceName}
            </Button>
            
            {devicePlatform === 'web' && (
              <p className="text-[min(3vw,0.75rem)] text-gray-500 mt-[min(4vw,1rem)]">
                Health data is available in the mobile app
              </p>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show loading state
  if (isLoading || !healthData) {
    return (
      <AppLayout
        header={{
          showBackButton: true,
          backHref: '/settings',
          title: 'Health Data'
        }}
      >
        <div className="max-w-7xl mx-auto p-[min(5vw,1.25rem)]">
          <div className="animate-pulse space-y-[min(4vw,1rem)]">
            <div className="h-[min(40vw,10rem)] bg-gray-100 rounded-[min(4vw,1rem)]" />
            <div className="grid grid-cols-2 gap-[min(4vw,1rem)]">
              <div className="h-[min(24vw,6rem)] bg-gray-100 rounded-[min(4vw,1rem)]" />
              <div className="h-[min(24vw,6rem)] bg-gray-100 rounded-[min(4vw,1rem)]" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const selectedMetricData = healthData.metrics.find(m => m.type === selectedMetric);
  const selectedColor = getMetricColor(selectedMetric);

  // Create chart data for selected metric
  const chartData = {
    labels: healthData.weeklyTrends.labels,
    datasets: [{
      label: selectedMetric.replace('_', ' ').charAt(0).toUpperCase() + selectedMetric.slice(1),
      data: healthData.weeklyTrends.datasets[0]?.data || [],
      borderColor: selectedColor.chart,
      backgroundColor: selectedColor.chart + '20',
      fill: true,
      tension: 0.4
    }]
  };

  // Calculate weekly averages
  const weeklyAverage = selectedMetricData ? 
    Math.round(healthData.weeklyTrends.datasets[0]?.data.reduce((a, b) => a + b, 0) / 
    healthData.weeklyTrends.datasets[0]?.data.length) : 0;

  return (
    <AppLayout
      header={{
        showBackButton: true,
        backHref: '/settings',
        title: 'Health Data',
        rightElement: (
          <Button
            onClick={handleDisconnect}
            variant="ghost"
            size="sm"
            className="text-red-600"
          >
            Disconnect
          </Button>
        )
      }}
    >
      <div className="max-w-7xl mx-auto p-[min(5vw,1.25rem)]">
        {/* Connected Status */}
        <div className="bg-green-50 border border-green-200 rounded-[min(4vw,1rem)] p-[min(4vw,1rem)] mb-[min(6vw,1.5rem)] flex items-center justify-between">
          <div className="flex items-center gap-[min(3vw,0.75rem)]">
            <CheckCircle className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-green-600" />
            <span className="text-[min(3.5vw,0.875rem)] font-medium text-green-900">
              Connected to {healthServiceName}
            </span>
          </div>
          <span className="text-[min(3vw,0.75rem)] text-green-700">
            Syncing automatically
          </span>
        </div>

        {/* Time Range Selector */}
        <div className="flex justify-center mb-[min(6vw,1.5rem)]">
          <div className="flex bg-gray-100 rounded-full p-[min(1vw,0.25rem)]">
            {(['day', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-[min(6vw,1.5rem)] py-[min(2vw,0.5rem)] rounded-full text-[min(3.5vw,0.875rem)] font-medium transition-all ${
                  selectedTimeRange === range
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-[min(4vw,1rem)] mb-[min(8vw,2rem)]">
          {healthData.metrics.map((metric) => {
            const colors = getMetricColor(metric.type);
            const isSelected = selectedMetric === metric.type;
            
            return (
              <button
                key={metric.type}
                onClick={() => setSelectedMetric(metric.type)}
                className={`p-[min(4vw,1rem)] rounded-[min(4vw,1rem)] bg-white border-2 transition-all ${
                  isSelected ? colors.border + ' shadow-lg' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className={`w-[min(12vw,3rem)] h-[min(12vw,3rem)] mx-auto mb-[min(3vw,0.75rem)] rounded-xl bg-gradient-to-br ${colors.bg} text-white flex items-center justify-center`}>
                  {getMetricIcon(metric.type)}
                </div>
                <div className="text-[min(5vw,1.25rem)] font-bold text-gray-900">
                  {formatMetricValue(metric)}
                </div>
                <div className="text-[min(3vw,0.75rem)] text-gray-600 capitalize mb-[min(2vw,0.5rem)]">
                  {metric.type === 'calories' ? 'Calories Burned' : metric.type.replace('_', ' ')}
                </div>
                {metric.goal && (
                  <div className="mt-[min(2vw,0.5rem)]">
                    <div className="w-full bg-gray-200 rounded-full h-[min(1.5vw,0.375rem)]">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${colors.bg}`}
                        style={{ width: `${Math.min((metric.value / metric.goal) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-[min(2.5vw,0.625rem)] text-gray-500 mt-1">
                      {Math.round((metric.value / metric.goal) * 100)}% of goal
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Detailed Chart */}
        <div className="bg-white rounded-[min(6vw,1.5rem)] p-[min(6vw,1.5rem)] shadow-sm border border-gray-200 mb-[min(8vw,2rem)]">
          <div className="flex items-center justify-between mb-[min(4vw,1rem)]">
            <h3 className="text-[min(5vw,1.25rem)] font-semibold text-gray-900 capitalize">
              {selectedMetric === 'calories' ? 'Calories Burned' : selectedMetric.replace('_', ' ')} Trends
            </h3>
            <div className="text-right">
              <div className="text-[min(3vw,0.75rem)] text-gray-500">Weekly Average</div>
              <div className="text-[min(4vw,1rem)] font-bold text-gray-900">
                {weeklyAverage} {selectedMetricData?.unit}
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <Line
              data={chartData}
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

        {/* Achievements Section */}
        <div className="bg-gradient-to-br from-sage-light/10 to-rose/5 rounded-[min(6vw,1.5rem)] p-[min(6vw,1.5rem)] border border-sage-light/20 mb-[min(8vw,2rem)]">
          <h3 className="text-[min(5vw,1.25rem)] font-semibold text-gray-900 mb-[min(4vw,1rem)] flex items-center gap-[min(2vw,0.5rem)]">
            <Award className="w-[min(6vw,1.5rem)] h-[min(6vw,1.5rem)] text-sage-dark" />
            This Week&apos;s Achievements
          </h3>
          <div className="grid grid-cols-2 gap-[min(3vw,0.75rem)]">
            {healthData.metrics
              .filter(m => m.goal && m.value >= m.goal)
              .map(metric => (
                <div key={metric.type} className="bg-white/80 rounded-[min(3vw,0.75rem)] p-[min(3vw,0.75rem)]">
                  <div className="flex items-center gap-[min(2vw,0.5rem)]">
                    <Target className="w-[min(4vw,1rem)] h-[min(4vw,1rem)] text-green-600" />
                    <span className="text-[min(3.5vw,0.875rem)] font-medium text-gray-900 capitalize">
                      {metric.type.replace('_', ' ')} Goal Achieved!
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Wellness Correlations */}
        {healthData.correlations.length > 0 && (
          <div className="space-y-[min(3vw,0.75rem)]">
            <h3 className="text-[min(5vw,1.25rem)] font-semibold text-gray-900 flex items-center gap-[min(2vw,0.5rem)]">
              <Brain className="w-[min(6vw,1.5rem)] h-[min(6vw,1.5rem)] text-sage-dark" />
              Wellness Insights
            </h3>
            {healthData.correlations.map((correlation, index) => (
              <div 
                key={index}
                className="p-[min(4vw,1rem)] bg-white rounded-[min(4vw,1rem)] border border-gray-200 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="text-[min(3.5vw,0.875rem)] font-medium text-gray-900">
                    {correlation.thriving} → {correlation.metric}
                  </p>
                  <p className="text-[min(3vw,0.75rem)] text-gray-600 mt-1">
                    {correlation.insight}
                  </p>
                </div>
                <div className={`text-[min(3.5vw,0.875rem)] font-medium ${
                  correlation.correlation > 0.7 ? 'text-green-600' :
                  correlation.correlation > 0.4 ? 'text-yellow-600' :
                  'text-gray-500'
                }`}>
                  {correlation.correlation > 0.7 ? 'Strong' :
                   correlation.correlation > 0.4 ? 'Moderate' :
                   'Weak'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}