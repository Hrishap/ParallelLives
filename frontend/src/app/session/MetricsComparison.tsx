'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign,
  Heart,
  Sun,
  Users,
  Briefcase,
  Home,
  GraduationCap,
  MapPin
} from 'lucide-react';

interface MetricsComparisonProps {
  currentNode?: any;
  alternateNode?: any;
}

export function MetricsComparison({ currentNode, alternateNode }: MetricsComparisonProps) {
  if (!currentNode || !alternateNode) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-lg font-medium mb-2">No Comparison Available</p>
          <p>Select an alternate scenario to compare metrics</p>
        </div>
      </div>
    );
  }

  const currentMetrics = currentNode.data?.metrics || {};
  const alternateMetrics = alternateNode.data?.metrics || {};

  const compareValue = (current: number, alternate: number) => {
    if (!current || !alternate) return { trend: 'neutral', diff: 0, percentage: 0 };
    
    const diff = alternate - current;
    const percentage = ((diff / current) * 100);
    
    return {
      trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral',
      diff,
      percentage: Math.abs(percentage)
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const TrendIcon = ({ trend }: { trend: string }) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const metrics = [
    {
      key: 'salary',
      label: 'Annual Salary',
      icon: DollarSign,
      current: currentMetrics.occupation?.salary || 0,
      alternate: alternateMetrics.occupation?.salary || 0,
      format: formatCurrency
    },
    {
      key: 'happiness',
      label: 'Happiness Score',
      icon: Heart,
      current: currentMetrics.city?.scores?.happiness || 0,
      alternate: alternateMetrics.city?.scores?.happiness || 0,
      format: (v: number) => `${v.toFixed(1)}/10`
    },
    {
      key: 'costOfLiving',
      label: 'Cost of Living',
      icon: Home,
      current: currentMetrics.city?.scores?.costOfLiving || 0,
      alternate: alternateMetrics.city?.scores?.costOfLiving || 0,
      format: (v: number) => `${v.toFixed(1)}/10`,
      inverse: true // Lower is better
    },
    {
      key: 'safety',
      label: 'Safety Score',
      icon: Users,
      current: currentMetrics.city?.scores?.safety || 0,
      alternate: alternateMetrics.city?.scores?.safety || 0,
      format: (v: number) => `${v.toFixed(1)}/10`
    },
    {
      key: 'education',
      label: 'Education Quality',
      icon: GraduationCap,
      current: currentMetrics.city?.scores?.education || 0,
      alternate: alternateMetrics.city?.scores?.education || 0,
      format: (v: number) => `${v.toFixed(1)}/10`
    },
    {
      key: 'climate',
      label: 'Climate Score',
      icon: Sun,
      current: currentMetrics.climate?.comfortScore || 0,
      alternate: alternateMetrics.climate?.comfortScore || 0,
      format: (v: number) => `${v.toFixed(1)}/10`
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Metrics Comparison</h2>
        <p className="text-gray-600">
          Compare key life metrics between your current situation and the selected scenario.
        </p>
      </div>

      {/* Location Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Location</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current</p>
              <p className="font-semibold">
                {currentMetrics.city?.name || 'Unknown'}, {currentMetrics.city?.country || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Alternate</p>
              <p className="font-semibold">
                {alternateMetrics.city?.name || 'Unknown'}, {alternateMetrics.city?.country || 'Unknown'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Career Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5" />
            <span>Career</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current</p>
              <p className="font-semibold">
                {currentMetrics.occupation?.name || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Alternate</p>
              <p className="font-semibold">
                {alternateMetrics.occupation?.name || 'Unknown'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric) => {
          const comparison = compareValue(metric.current, metric.alternate);
          const isImprovement = metric.inverse 
            ? comparison.trend === 'down' 
            : comparison.trend === 'up';
          
          return (
            <Card key={metric.key}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <metric.icon className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">{metric.label}</span>
                  </div>
                  <TrendIcon trend={comparison.trend} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current:</span>
                    <span className="font-medium">{metric.format(metric.current)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Alternate:</span>
                    <span className="font-medium">{metric.format(metric.alternate)}</span>
                  </div>
                  
                  {comparison.trend !== 'neutral' && (
                    <div className="pt-2 border-t">
                      <Badge 
                        variant={isImprovement ? 'default' : 'secondary'}
                        className={`text-xs ${
                          isImprovement 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {isImprovement ? '+' : ''}{formatPercentage(comparison.percentage)} 
                        {isImprovement ? ' better' : ' worse'}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-600">
              This alternate scenario shows potential changes across multiple life dimensions. 
              Consider both quantitative metrics and qualitative factors when evaluating life choices.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
