'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Heart, 
  DollarSign, 
  Home, 
  Briefcase,
  Users,
  Activity,
  Brain,
  Compass
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LifeNode, TreeStructure } from '@/types';

interface MetricsVisualizationProps {
  tree: TreeStructure;
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string) => void;
}

interface MetricTrend {
  nodeId: string;
  depth: number;
  happiness: number;
  income: number;
  qualityOfLife: number;
  workLifeBalance: number;
  health: number;
  social: number;
  creativity: number;
  adventure: number;
  label: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

export function MetricsVisualization({ tree, selectedNodeId, onNodeSelect }: MetricsVisualizationProps) {
  const [activeView, setActiveView] = useState<'timeline' | 'comparison' | 'radar' | 'breakdown'>('timeline');

  // Process tree data into metrics trends
  const processMetricsData = (): MetricTrend[] => {
    return tree.nodes
      .filter(node => node.data.status === 'completed')
      .sort((a, b) => a.depth - b.depth)
      .map(node => {
        const metrics = node.data.metrics || {};
        const choice = node.data.choice || {};
        
        // Create a meaningful label for this node
        const choiceLabels = [];
        if (choice.careerChange) choiceLabels.push(choice.careerChange.slice(0, 20));
        if (choice.locationChange?.city) choiceLabels.push(choice.locationChange.city);
        if (choice.educationChange) choiceLabels.push(choice.educationChange.slice(0, 20));
        if (choice.lifestyleChange) choiceLabels.push(choice.lifestyleChange.slice(0, 20));
        
        const label = choiceLabels.length > 0 ? choiceLabels.join(' + ') : `Scenario ${node.depth}`;

        return {
          nodeId: node.id,
          depth: node.depth,
          happiness: metrics.happinessScore || 5,
          income: metrics.finances?.salaryMedianUSD ? Math.min(metrics.finances.salaryMedianUSD / 10000, 10) : 5,
          qualityOfLife: metrics.qualityOfLifeIndex || 5,
          workLifeBalance: metrics.workLifeBalance || 5,
          health: metrics.healthIndex || 5,
          social: metrics.socialIndex || 5,
          creativity: metrics.creativityIndex || 5,
          adventure: metrics.adventureIndex || 5,
          label: label.length > 30 ? label.slice(0, 30) + '...' : label
        };
      });
  };

  const metricsData = processMetricsData();
  const selectedNode = tree.nodes.find(n => n.id === selectedNodeId);

  // Calculate baseline (first node or average)
  const baseline = metricsData.length > 0 ? metricsData[0] : null;

  // Radar chart data for selected node
  const radarData = selectedNode ? [
    { subject: 'Happiness', A: selectedNode.data.metrics?.happinessScore || 5, fullMark: 10 },
    { subject: 'Income', A: selectedNode.data.metrics?.finances?.salaryMedianUSD ? Math.min(selectedNode.data.metrics.finances.salaryMedianUSD / 10000, 10) : 5, fullMark: 10 },
    { subject: 'Quality of Life', A: selectedNode.data.metrics?.qualityOfLifeIndex || 5, fullMark: 10 },
    { subject: 'Work-Life Balance', A: selectedNode.data.metrics?.workLifeBalance || 5, fullMark: 10 },
    { subject: 'Health', A: selectedNode.data.metrics?.healthIndex || 5, fullMark: 10 },
    { subject: 'Social', A: selectedNode.data.metrics?.socialIndex || 5, fullMark: 10 },
    { subject: 'Creativity', A: selectedNode.data.metrics?.creativityIndex || 5, fullMark: 10 },
    { subject: 'Adventure', A: selectedNode.data.metrics?.adventureIndex || 5, fullMark: 10 }
  ] : [];

  // Comparison data (vs baseline)
  const comparisonData = selectedNode && baseline ? [
    { 
      name: 'Happiness', 
      current: selectedNode.data.metrics?.happinessScore || 5,
      baseline: baseline.happiness,
      difference: (selectedNode.data.metrics?.happinessScore || 5) - baseline.happiness
    },
    { 
      name: 'Income', 
      current: selectedNode.data.metrics?.finances?.salaryMedianUSD ? Math.min(selectedNode.data.metrics.finances.salaryMedianUSD / 10000, 10) : 5,
      baseline: baseline.income,
      difference: (selectedNode.data.metrics?.finances?.salaryMedianUSD ? Math.min(selectedNode.data.metrics.finances.salaryMedianUSD / 10000, 10) : 5) - baseline.income
    },
    { 
      name: 'Quality of Life', 
      current: selectedNode.data.metrics?.qualityOfLifeIndex || 5,
      baseline: baseline.qualityOfLife,
      difference: (selectedNode.data.metrics?.qualityOfLifeIndex || 5) - baseline.qualityOfLife
    },
    { 
      name: 'Work-Life Balance', 
      current: selectedNode.data.metrics?.workLifeBalance || 5,
      baseline: baseline.workLifeBalance,
      difference: (selectedNode.data.metrics?.workLifeBalance || 5) - baseline.workLifeBalance
    }
  ] : [];

  const MetricCard = ({ title, value, change, icon: Icon, color }: any) => (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value.toFixed(1)}</p>
            {change !== undefined && (
              <div className={`flex items-center text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {change >= 0 ? '+' : ''}{change.toFixed(1)} vs baseline
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* View Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Life Metrics Analysis</h2>
        <div className="flex space-x-2">
          {[
            { id: 'timeline', label: 'Timeline' },
            { id: 'comparison', label: 'Comparison' },
            { id: 'radar', label: 'Profile' },
            { id: 'breakdown', label: 'Breakdown' }
          ].map(view => (
            <Button
              key={view.id}
              variant={activeView === view.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView(view.id as any)}
            >
              {view.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Selected Node Overview */}
      {selectedNode && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Happiness Score"
            value={selectedNode.data.metrics?.happinessScore || 5}
            change={baseline ? (selectedNode.data.metrics?.happinessScore || 5) - baseline.happiness : undefined}
            icon={Heart}
            color="bg-pink-500"
          />
          <MetricCard
            title="Income Level"
            value={selectedNode.data.metrics?.finances?.salaryMedianUSD ? Math.min(selectedNode.data.metrics.finances.salaryMedianUSD / 10000, 10) : 5}
            change={baseline ? (selectedNode.data.metrics?.finances?.salaryMedianUSD ? Math.min(selectedNode.data.metrics.finances.salaryMedianUSD / 10000, 10) : 5) - baseline.income : undefined}
            icon={DollarSign}
            color="bg-green-500"
          />
          <MetricCard
            title="Quality of Life"
            value={selectedNode.data.metrics?.qualityOfLifeIndex || 5}
            change={baseline ? (selectedNode.data.metrics?.qualityOfLifeIndex || 5) - baseline.qualityOfLife : undefined}
            icon={Home}
            color="bg-blue-500"
          />
          <MetricCard
            title="Work-Life Balance"
            value={selectedNode.data.metrics?.workLifeBalance || 5}
            change={baseline ? (selectedNode.data.metrics?.workLifeBalance || 5) - baseline.workLifeBalance : undefined}
            icon={Briefcase}
            color="bg-purple-500"
          />
        </div>
      )}

      {/* Main Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeView === 'timeline' && 'Metrics Over Time'}
            {activeView === 'comparison' && 'Comparison vs Baseline'}
            {activeView === 'radar' && 'Life Profile Radar'}
            {activeView === 'breakdown' && 'Metrics Breakdown'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeView === 'timeline' && (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="label" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis domain={[0, 10]} />
                  <Tooltip 
                    formatter={(value: any, name: string) => [value.toFixed(1), name]}
                    labelFormatter={(label) => `Scenario: ${label}`}
                  />
                  <Line type="monotone" dataKey="happiness" stroke="#ec4899" strokeWidth={2} name="Happiness" />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
                  <Line type="monotone" dataKey="qualityOfLife" stroke="#3b82f6" strokeWidth={2} name="Quality of Life" />
                  <Line type="monotone" dataKey="workLifeBalance" stroke="#8b5cf6" strokeWidth={2} name="Work-Life Balance" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeView === 'comparison' && comparisonData.length > 0 && (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="current" fill="#3b82f6" name="Current" />
                  <Bar dataKey="baseline" fill="#94a3b8" name="Baseline" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeView === 'radar' && radarData.length > 0 && (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} />
                  <Radar
                    name="Current Scenario"
                    dataKey="A"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeView === 'breakdown' && selectedNode && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { key: 'healthIndex', label: 'Health', icon: Activity, color: 'bg-red-500' },
                { key: 'socialIndex', label: 'Social', icon: Users, color: 'bg-orange-500' },
                { key: 'creativityIndex', label: 'Creativity', icon: Brain, color: 'bg-yellow-500' },
                { key: 'adventureIndex', label: 'Adventure', icon: Compass, color: 'bg-indigo-500' }
              ].map(metric => (
                <div key={metric.key} className="text-center">
                  <div className={`w-16 h-16 rounded-full ${metric.color} flex items-center justify-center mx-auto mb-2`}>
                    <metric.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-medium text-gray-900">{metric.label}</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {(selectedNode.data.metrics?.[metric.key as keyof typeof selectedNode.data.metrics] as number || 5).toFixed(1)}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full ${metric.color}`}
                      style={{ 
                        width: `${((selectedNode.data.metrics?.[metric.key as keyof typeof selectedNode.data.metrics] as number || 5) / 10) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scenario Selection */}
      {metricsData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Compare Scenarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {metricsData.map(scenario => (
                <motion.div
                  key={scenario.nodeId}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all ${
                      selectedNodeId === scenario.nodeId 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => onNodeSelect(scenario.nodeId)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Depth {scenario.depth}</span>
                        <div className="flex space-x-1">
                          <div className={`w-2 h-2 rounded-full ${scenario.happiness >= 7 ? 'bg-green-500' : scenario.happiness >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                          <div className={`w-2 h-2 rounded-full ${scenario.income >= 7 ? 'bg-green-500' : scenario.income >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                          <div className={`w-2 h-2 rounded-full ${scenario.qualityOfLife >= 7 ? 'bg-green-500' : scenario.qualityOfLife >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{scenario.label}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>😊 {scenario.happiness.toFixed(1)}</div>
                        <div>💰 {scenario.income.toFixed(1)}</div>
                        <div>🏠 {scenario.qualityOfLife.toFixed(1)}</div>
                        <div>⚖️ {scenario.workLifeBalance.toFixed(1)}</div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
