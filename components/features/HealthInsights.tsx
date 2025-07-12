'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, Heart, Moon, Footprints, 
  TrendingUp, TrendingDown, Minus,
  ChevronRight, Sparkles,
  Zap, Droplets, Brain
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
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

export const HealthInsights: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('steps');
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    checkHealthPermissions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkHealthPermissions = async () => {
    // Check if we have health permissions via the native bridge
    if (window.ReactNativeBridge?.checkHealthPermission) {
      const permitted = await window.ReactNativeBridge.checkHealthPermission();
      setHasPermission(permitted);
      if (permitted) {
        loadHealthData();
      }
    }
    setIsLoading(false);
  };

  const requestHealthPermission = async () => {
    if (window.ReactNativeBridge?.requestHealthPermission) {
      const granted = await window.ReactNativeBridge.requestHealthPermission();
      if (granted) {
        setHasPermission(true);
        loadHealthData();
      }
    }
  };

  const loadHealthData = async () => {
    if (window.ReactNativeBridge?.getHealthData) {
      const data = await window.ReactNativeBridge.getHealthData({
        metrics: ['steps', 'heart_rate', 'sleep', 'water', 'calories', 'mindfulness'],
        timeRange: selectedTimeRange
      });
      setHealthData(data);
    }
  };

  const getMetricIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      steps: <Footprints className="w-5 h-5" />,
      heart_rate: <Heart className="w-5 h-5" />,
      sleep: <Moon className="w-5 h-5" />,
      water: <Droplets className="w-5 h-5" />,
      calories: <Zap className="w-5 h-5" />,
      mindfulness: <Brain className="w-5 h-5" />
    };
    return icons[type] || <Activity className="w-5 h-5" />;
  };

  const getMetricColor = (type: string) => {
    const colors: Record<string, string> = {
      steps: 'from-blue-500 to-blue-600',
      heart_rate: 'from-red-500 to-red-600',
      sleep: 'from-indigo-500 to-indigo-600',
      water: 'from-cyan-500 to-cyan-600',
      calories: 'from-orange-500 to-orange-600',
      mindfulness: 'from-purple-500 to-purple-600'
    };
    return colors[type] || 'from-gray-500 to-gray-600';
  };

  const formatMetricValue = (metric: HealthMetric) => {
    if (metric.type === 'sleep') {
      const hours = Math.floor(metric.value);
      const minutes = Math.round((metric.value - hours) * 60);
      return `${hours}h ${minutes}m`;
    }
    return `${metric.value.toLocaleString()} ${metric.unit}`;
  };

  if (!hasPermission) {
    return (
      <div className="mt-8 p-6 rounded-3xl bg-gradient-to-br from-sage-light/20 to-rose/10 border border-sage-light/30">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/80 flex items-center justify-center">
            <Heart className="w-8 h-8 text-rose" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Connect Your Health Data
          </h3>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            See how your wellness thrivings impact your health metrics. 
            Track progress and discover insights.
          </p>
          <button
            onClick={requestHealthPermission}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-sage to-sage-dark text-white font-medium shadow-lg hover:shadow-xl transition-all"
          >
            Connect Health App
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !healthData) {
    return (
      <div className="mt-8 space-y-4">
        <div className="h-32 bg-gray-100 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-rose" />
          Health Insights
        </h2>
        <div className="flex gap-2">
          {(['day', 'week', 'month'] as const).map(range => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedTimeRange === range
                  ? 'bg-sage text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {healthData.metrics.map((metric) => {
          const isSelected = selectedMetric === metric.type;
          return (
            <button
              key={metric.type}
              onClick={() => setSelectedMetric(metric.type)}
              className={`relative p-4 rounded-2xl transition-all ${
                isSelected 
                  ? 'bg-gradient-to-br from-white to-gray-50 shadow-lg border-2 border-sage-light'
                  : 'bg-white border border-gray-200 hover:shadow-md'
              }`}
            >
              {/* Icon and Label */}
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${getMetricColor(metric.type)} text-white`}>
                  {getMetricIcon(metric.type)}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {metric.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                  {metric.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                  {metric.trend === 'stable' && <Minus className="w-3 h-3 text-gray-400" />}
                  <span className={`font-medium ${
                    metric.trend === 'up' ? 'text-green-600' : 
                    metric.trend === 'down' ? 'text-red-600' : 
                    'text-gray-500'
                  }`}>
                    {metric.changePercent > 0 ? '+' : ''}{metric.changePercent}%
                  </span>
                </div>
              </div>

              {/* Value */}
              <div className="text-left">
                <p className="text-lg font-bold text-gray-900">
                  {formatMetricValue(metric)}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {metric.type.replace('_', ' ')}
                </p>
              </div>

              {/* Goal Progress */}
              {metric.goal && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Goal</span>
                    <span>{Math.round((metric.value / metric.goal) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${getMetricColor(metric.type)} transition-all`}
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
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
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
      <div className="bg-gradient-to-br from-sage-light/10 to-rose/5 rounded-3xl p-6 border border-sage-light/20">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-sage-dark" />
          Wellness Correlations
        </h3>
        <div className="space-y-3">
          {healthData.correlations.map((correlation, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-4 bg-white/80 rounded-2xl backdrop-blur-sm"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {correlation.thriving} → {correlation.metric}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {correlation.insight}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`text-sm font-medium ${
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
    </div>
  );
};