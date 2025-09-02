'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  GitBranch, 
  Eye, 
  EyeOff, 
  Palette,
  BarChart3,
  Users,
  Heart,
  Briefcase,
  Home,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TreeNode } from '@/types';

interface ScenarioComparisonProps {
  nodes: TreeNode[];
  onNodeSelect: (nodeId: string) => void;
}

interface ComparisonPath {
  id: string;
  node: TreeNode;
  color: string;
  visible: boolean;
  label: string;
}

const COMPARISON_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16'  // Lime
];

export function ScenarioComparison({ nodes, onNodeSelect }: ScenarioComparisonProps) {
  const [comparisonPaths, setComparisonPaths] = useState<ComparisonPath[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('happiness');
  const [timelineYear, setTimelineYear] = useState(10); // Default to 10-year projection
  
  const availableNodes = nodes.filter(node => node.data.status === 'completed');
  
  // Initialize with first two completed nodes
  useEffect(() => {
    if (availableNodes.length >= 2 && comparisonPaths.length === 0) {
      const initialPaths = availableNodes.slice(0, 2).map((node, index) => ({
        id: node.id,
        node,
        color: COMPARISON_COLORS[index],
        visible: true,
        label: generatePathLabel(node)
      }));
      setComparisonPaths(initialPaths);
    }
  }, [availableNodes]);
  
  const generatePathLabel = (node: TreeNode): string => {
    const choice = node.data.choice;
    const parts = [];
    
    if (choice.careerChange) parts.push(choice.careerChange);
    if (choice.locationChange?.city) parts.push(choice.locationChange.city);
    if (choice.educationChange) parts.push(choice.educationChange);
    if (choice.lifestyleChange) parts.push(choice.lifestyleChange);
    
    return parts.slice(0, 2).join(' → ') || `Scenario ${node.depth + 1}`;
  };
  
  const addPathToComparison = (nodeId: string) => {
    const node = availableNodes.find(n => n.id === nodeId);
    if (!node || comparisonPaths.find(p => p.id === nodeId)) return;
    
    const newPath: ComparisonPath = {
      id: nodeId,
      node,
      color: COMPARISON_COLORS[comparisonPaths.length % COMPARISON_COLORS.length],
      visible: true,
      label: generatePathLabel(node)
    };
    
    setComparisonPaths(prev => [...prev, newPath]);
  };
  
  const removePathFromComparison = (pathId: string) => {
    setComparisonPaths(prev => prev.filter(p => p.id !== pathId));
  };
  
  const togglePathVisibility = (pathId: string) => {
    setComparisonPaths(prev => 
      prev.map(p => p.id === pathId ? { ...p, visible: !p.visible } : p)
    );
  };
  
  // Generate comparison data for visualization
  const generateComparisonData = () => {
    const metrics = ['happiness', 'workLife', 'health', 'social', 'creativity', 'adventure'];
    const years = Array.from({ length: 21 }, (_, i) => i); // 0-20 years
    
    return {
      years,
      datasets: comparisonPaths.filter(p => p.visible).map(path => ({
        id: path.id,
        label: path.label,
        color: path.color,
        data: years.map(year => ({
          year,
          ...metrics.reduce((acc, metric) => {
            acc[metric] = calculateMetricAtYear(path.node, metric, year);
            return acc;
          }, {} as Record<string, number>)
        }))
      }))
    };
  };
  
  const calculateMetricAtYear = (node: TreeNode, metric: string, year: number): number => {
    const baseMetrics = node.data.metrics;
    if (!baseMetrics) return 5;
    
    const baseValues = {
      happiness: baseMetrics.happinessScore || 5,
      workLife: baseMetrics.workLifeBalance || 5,
      health: baseMetrics.healthIndex || 5,
      social: baseMetrics.socialIndex || 5,
      creativity: baseMetrics.creativityIndex || 5,
      adventure: baseMetrics.adventureIndex || 5
    };
    
    const baseValue = baseValues[metric as keyof typeof baseValues] || 5;
    
    // Different growth curves for different metrics and career paths
    const careerType = node.data.choice.careerChange?.toLowerCase() || '';
    const curves = {
      happiness: (y: number) => {
        const careerBonus = careerType.includes('artist') || careerType.includes('teacher') ? 0.3 : 0;
        return baseValue + Math.sin(y * 0.3) * 1.2 + careerBonus + (y > 10 ? 0.4 : 0);
      },
      workLife: (y: number) => {
        const entrepreneurPenalty = careerType.includes('entrepreneur') ? -0.5 : 0;
        return Math.max(1, baseValue - (y < 5 ? y * 0.2 : (y - 5) * 0.1) + entrepreneurPenalty);
      },
      health: (y: number) => {
        const stressfulCareerPenalty = careerType.includes('lawyer') || careerType.includes('doctor') ? -0.3 : 0;
        return Math.max(1, baseValue - y * 0.12 + stressfulCareerPenalty + (y < 3 ? 0.5 : 0));
      },
      social: (y: number) => {
        const socialCareerBonus = careerType.includes('teacher') || careerType.includes('social') ? 0.4 : 0;
        return baseValue + (y > 5 ? Math.sin(y * 0.2) * 0.6 : y * 0.08) + socialCareerBonus;
      },
      creativity: (y: number) => {
        const creativeCareerBonus = careerType.includes('artist') || careerType.includes('designer') ? 0.6 : 0;
        return baseValue + Math.cos(y * 0.25) * 1.0 + creativeCareerBonus;
      },
      adventure: (y: number) => {
        const adventureCareerBonus = careerType.includes('travel') || careerType.includes('explorer') ? 0.5 : 0;
        return Math.max(1, baseValue - (y > 8 ? (y - 8) * 0.15 : -y * 0.08) + adventureCareerBonus);
      }
    };
    
    const curve = curves[metric as keyof typeof curves] || ((y: number) => baseValue);
    return Math.min(10, Math.max(1, curve(year)));
  };
  
  const comparisonData = generateComparisonData();
  const currentYearData = comparisonData.datasets.map(dataset => ({
    ...dataset,
    currentValue: dataset.data[timelineYear]?.[selectedMetric as keyof typeof dataset.data[0]] || 5
  }));
  
  const metricIcons = {
    happiness: Heart,
    workLife: Briefcase,
    health: Sparkles,
    social: Users,
    creativity: Palette,
    adventure: TrendingUp
  };
  
  const MetricIcon = metricIcons[selectedMetric as keyof typeof metricIcons] || BarChart3;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Scenario Comparison Overlay
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {availableNodes.map(node => (
              <Button
                key={node.id}
                variant={comparisonPaths.find(p => p.id === node.id) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (comparisonPaths.find(p => p.id === node.id)) {
                    removePathFromComparison(node.id);
                  } else {
                    addPathToComparison(node.id);
                  }
                }}
                className="text-xs"
              >
                {generatePathLabel(node)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Active Comparisons */}
      {comparisonPaths.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Active Comparisons</CardTitle>
              <div className="flex items-center gap-2">
                <MetricIcon className="h-4 w-4" />
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="happiness">Happiness</option>
                  <option value="workLife">Work-Life Balance</option>
                  <option value="health">Health</option>
                  <option value="social">Social Life</option>
                  <option value="creativity">Creativity</option>
                  <option value="adventure">Adventure</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Timeline Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Timeline: Year {timelineYear}</span>
                <span className="text-gray-500">Drag to see evolution</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={timelineYear}
                onChange={(e) => setTimelineYear(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Start</span>
                <span>5yr</span>
                <span>10yr</span>
                <span>15yr</span>
                <span>20yr</span>
              </div>
            </div>
            
            {/* Comparison Paths */}
            <div className="space-y-3">
              <AnimatePresence>
                {comparisonPaths.map((path, index) => (
                  <motion.div
                    key={path.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`border rounded-lg p-4 ${path.visible ? 'bg-white' : 'bg-gray-50'}`}
                    style={{ borderColor: path.color }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: path.color }}
                        />
                        <div>
                          <h4 className="font-medium">{path.label}</h4>
                          <p className="text-sm text-gray-500">
                            Depth {path.node.depth} • {path.node.data.status}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Current Metric Value */}
                        <Badge variant="outline" className="text-sm">
                          {currentYearData[index]?.currentValue.toFixed(1)}/10
                        </Badge>
                        
                        {/* Visibility Toggle */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePathVisibility(path.id)}
                        >
                          {path.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        
                        {/* Remove */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePathFromComparison(path.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                    
                    {/* Enhanced Chart Preview */}
                    {path.visible && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-3 pt-3 border-t"
                      >
                        <div className="h-40 relative bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 shadow-sm overflow-hidden">
                          <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="xMidYMid meet">
                            {/* Background gradient */}
                            <defs>
                              <linearGradient id={`bg-gradient-${path.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={path.color} stopOpacity="0.05"/>
                                <stop offset="100%" stopColor={path.color} stopOpacity="0.02"/>
                              </linearGradient>
                              
                              {/* Subtle grid pattern */}
                              <pattern id={`grid-${path.id}`} width="20" height="15" patternUnits="userSpaceOnUse">
                                <circle cx="10" cy="7.5" r="0.5" fill={path.color} opacity="0.1"/>
                              </pattern>
                              
                              {/* Area gradient */}
                              <linearGradient id={`area-gradient-${path.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={path.color} stopOpacity="0.4"/>
                                <stop offset="50%" stopColor={path.color} stopOpacity="0.2"/>
                                <stop offset="100%" stopColor={path.color} stopOpacity="0.05"/>
                              </linearGradient>
                              
                              {/* Glow effect */}
                              <filter id={`glow-${path.id}`}>
                                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                <feMerge> 
                                  <feMergeNode in="coloredBlur"/>
                                  <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                              </filter>
                            </defs>
                            
                            {/* Background */}
                            <rect width="100%" height="100%" fill={`url(#bg-gradient-${path.id})`} />
                            <rect width="100%" height="100%" fill={`url(#grid-${path.id})`} />
                            
                            {/* Y-axis with enhanced styling */}
                            {[0, 2.5, 5, 7.5, 10].map((value, i) => (
                              <g key={i}>
                                <text
                                  x="8"
                                  y={135 - (value / 10) * 110}
                                  fontSize="11"
                                  fill="#4b5563"
                                  textAnchor="start"
                                  fontWeight="500"
                                >
                                  {value}
                                </text>
                                <line
                                  x1="35"
                                  y1={135 - (value / 10) * 110}
                                  x2="385"
                                  y2={135 - (value / 10) * 110}
                                  stroke="#e5e7eb"
                                  strokeWidth="0.5"
                                  strokeDasharray={value === 5 ? "2,2" : "none"}
                                  opacity={value === 5 ? "0.8" : "0.3"}
                                />
                              </g>
                            ))}
                            
                            {/* Enhanced area under curve */}
                            <path
                              d={`M 35,135 ${comparisonData.datasets
                                .find(d => d.id === path.id)?.data
                                .map((point, i) => `L ${35 + (i / 20) * 350},${135 - (point[selectedMetric] / 10) * 110}`)
                                .join(' ') || ''} L 385,135 Z`}
                              fill={`url(#area-gradient-${path.id})`}
                            />
                            
                            {/* Main chart line with glow */}
                            <path
                              d={`M ${comparisonData.datasets
                                .find(d => d.id === path.id)?.data
                                .map((point, i) => `${35 + (i / 20) * 350},${135 - (point[selectedMetric] / 10) * 110}`)
                                .join(' L ') || ''}`}
                              fill="none"
                              stroke={path.color}
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              filter={`url(#glow-${path.id})`}
                            />
                            
                            {/* Enhanced data points */}
                            {comparisonData.datasets
                              .find(d => d.id === path.id)?.data
                              .filter((_, i) => i % 3 === 0) // Show every 3rd point for better density
                              .map((point, i) => (
                                <g key={i}>
                                  <circle
                                    cx={35 + (i * 3 / 20) * 350}
                                    cy={135 - (point[selectedMetric] / 10) * 110}
                                    r="6"
                                    fill={path.color}
                                    opacity="0.2"
                                  />
                                  <circle
                                    cx={35 + (i * 3 / 20) * 350}
                                    cy={135 - (point[selectedMetric] / 10) * 110}
                                    r="3"
                                    fill="white"
                                    stroke={path.color}
                                    strokeWidth="2.5"
                                  />
                                </g>
                              ))}
                            
                            {/* Enhanced current year indicator */}
                            <g>
                              {/* Vertical guide line */}
                              <line
                                x1={35 + (timelineYear / 20) * 350}
                                y1="20"
                                x2={35 + (timelineYear / 20) * 350}
                                y2="135"
                                stroke={path.color}
                                strokeWidth="2"
                                strokeDasharray="6,3"
                                opacity="0.6"
                              />
                              
                              {/* Pulsing current point */}
                              <circle
                                cx={35 + (timelineYear / 20) * 350}
                                cy={135 - (currentYearData[index]?.currentValue / 10) * 110}
                                r="8"
                                fill={path.color}
                                opacity="0.3"
                              >
                                <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite"/>
                                <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite"/>
                              </circle>
                              
                              <circle
                                cx={35 + (timelineYear / 20) * 350}
                                cy={135 - (currentYearData[index]?.currentValue / 10) * 110}
                                r="5"
                                fill={path.color}
                                stroke="white"
                                strokeWidth="3"
                              />
                            </g>
                            
                            {/* Enhanced X-axis labels */}
                            {[0, 5, 10, 15, 20].map((year, i) => (
                              <g key={i}>
                                <text
                                  x={35 + (year / 20) * 350}
                                  y="148"
                                  fontSize="11"
                                  fill="#6b7280"
                                  textAnchor="middle"
                                  fontWeight="500"
                                >
                                  {year}y
                                </text>
                                <circle
                                  cx={35 + (year / 20) * 350}
                                  cy="140"
                                  r="1.5"
                                  fill="#9ca3af"
                                />
                              </g>
                            ))}
                          </svg>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {/* Divergence Analysis */}
            {comparisonPaths.length >= 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4"
              >
                <h4 className="font-medium text-blue-900 mb-2">Divergence Analysis</h4>
                <div className="text-sm text-blue-700">
                  <p>
                    At year {timelineYear}, the paths show{' '}
                    {Math.abs(currentYearData[0]?.currentValue - currentYearData[1]?.currentValue) > 2
                      ? 'significant divergence'
                      : 'similar trajectories'}{' '}
                    in {selectedMetric}.
                  </p>
                  {currentYearData.length >= 2 && (
                    <p className="mt-1">
                      <strong>{currentYearData[0]?.label}</strong>: {currentYearData[0]?.currentValue.toFixed(1)}/10 vs{' '}
                      <strong>{currentYearData[1]?.label}</strong>: {currentYearData[1]?.currentValue.toFixed(1)}/10
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
