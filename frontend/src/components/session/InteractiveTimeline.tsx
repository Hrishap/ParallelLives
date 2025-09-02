'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TreeNode } from '@/types';

interface InteractiveTimelineProps {
  nodes: TreeNode[];
  selectedNodeId: string | null;
  onTimelineChange: (year: number, nodeData: any) => void;
}

export function InteractiveTimeline({ nodes, selectedNodeId, onTimelineChange }: InteractiveTimelineProps) {
  const [currentYear, setCurrentYear] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [maxYears] = useState(20); // 20-year simulation
  
  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  
  // Auto-play functionality with proper ending
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentYear(prev => {
        if (prev >= maxYears) {
          setIsPlaying(false); // Stop at the end
          return maxYears;
        }
        const next = prev + 1;
        if (selectedNode) {
          generateTimelineData(next);
        }
        return next;
      });
    }, 1500); // Slower transitions - 1.5 seconds per year
    
    return () => clearInterval(interval);
  }, [isPlaying, selectedNode, maxYears]);
  
  // Generate interpolated data for any year
  const generateTimelineData = (year: number) => {
    if (!selectedNode) return;
    
    const baseMetrics = selectedNode.data.metrics;
    if (!baseMetrics) return;
    
    // Simulate metric evolution over time with realistic curves
    const timelineData = {
      year,
      happiness: interpolateMetric(baseMetrics.happinessScore || 5, year, 'happiness'),
      workLife: interpolateMetric(baseMetrics.workLifeBalance || 5, year, 'workLife'),
      health: interpolateMetric(baseMetrics.healthIndex || 5, year, 'health'),
      social: interpolateMetric(baseMetrics.socialIndex || 5, year, 'social'),
      creativity: interpolateMetric(baseMetrics.creativityIndex || 5, year, 'creativity'),
      adventure: interpolateMetric(baseMetrics.adventureIndex || 5, year, 'adventure'),
      salary: interpolateSalary(baseMetrics.finances?.salaryMedianUSD || 50000, year),
      storyPreview: generateStoryPreview(year, selectedNode)
    };
    
    onTimelineChange(year, timelineData);
  };
  
  // Realistic metric interpolation with life stage curves
  const interpolateMetric = (baseValue: number, year: number, metricType: string): number => {
    const curves = {
      happiness: (y: number) => baseValue + Math.sin(y * 0.3) * 1.5 + (y > 10 ? 0.5 : 0),
      workLife: (y: number) => Math.max(1, baseValue - (y < 5 ? y * 0.3 : (y - 5) * 0.1)),
      health: (y: number) => Math.max(1, baseValue - y * 0.15 + (y < 3 ? 0.5 : 0)),
      social: (y: number) => baseValue + (y > 5 ? Math.sin(y * 0.2) * 0.8 : y * 0.1),
      creativity: (y: number) => baseValue + Math.cos(y * 0.25) * 1.2,
      adventure: (y: number) => Math.max(1, baseValue - (y > 8 ? (y - 8) * 0.2 : -y * 0.1))
    };
    
    const curve = curves[metricType as keyof typeof curves] || ((y: number) => baseValue);
    return Math.min(10, Math.max(1, curve(year)));
  };
  
  // Salary growth simulation
  const interpolateSalary = (baseSalary: number, year: number): number => {
    const growthRate = 0.05 + Math.random() * 0.03; // 5-8% annual growth
    const experienceBonus = year > 5 ? 1.2 : 1;
    const midCareerBoost = year > 10 ? 1.15 : 1;
    
    return Math.round(baseSalary * Math.pow(1 + growthRate, year) * experienceBonus * midCareerBoost);
  };
  
  // Generate contextual story preview for the year
  const generateStoryPreview = (year: number, node: TreeNode): string => {
    const choice = node.data.choice;
    const career = choice.careerChange || 'current career';
    const location = choice.locationChange?.city || 'current city';
    
    // Life stage-specific narratives
    if (year === 0) {
      return `Starting fresh: Taking the leap into ${career} in ${location}. The excitement is palpable, but so is the uncertainty.`;
    } else if (year <= 2) {
      return `Early days (Year ${year}): Learning the ropes in ${career}. Every day brings new challenges and small victories in ${location}.`;
    } else if (year <= 5) {
      return `Building momentum (Year ${year}): Gaining confidence in ${career}. Starting to see the fruits of hard work and establishing a routine in ${location}.`;
    } else if (year <= 8) {
      return `Finding rhythm (Year ${year}): Hitting your stride in ${career}. Building deeper relationships and considering long-term goals in ${location}.`;
    } else if (year <= 12) {
      return `Peak performance (Year ${year}): Excelling in ${career} with growing expertise. Taking on leadership roles and mentoring others in ${location}.`;
    } else if (year <= 16) {
      return `Mastery phase (Year ${year}): Recognized as an expert in ${career}. Balancing professional success with personal fulfillment in ${location}.`;
    } else if (year <= 19) {
      return `Wisdom years (Year ${year}): Sharing knowledge and experience in ${career}. Focusing on legacy and what truly matters in ${location}.`;
    } else {
      return `Reflection (Year ${year}): Looking back on an incredible journey in ${career}. The path from ${location} has led to unexpected places and profound growth.`;
    }
  };
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const year = parseInt(e.target.value);
    setCurrentYear(year);
    if (selectedNode) {
      generateTimelineData(year);
    }
  };
  
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };
  
  const resetTimeline = () => {
    setCurrentYear(0);
    setIsPlaying(false);
    if (selectedNode) {
      generateTimelineData(0);
    }
  };
  
  // Initialize with current node
  useEffect(() => {
    if (selectedNode && currentYear === 0) {
      generateTimelineData(0);
    }
  }, [selectedNode]);
  
  if (!selectedNode) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Select a scenario to explore its timeline
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Interactive Life Timeline
          <span className="text-sm font-normal text-gray-500">
            ({selectedNode.data.choice.careerChange || 'Current Path'})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeline Controls */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={togglePlayback}
            className="flex items-center gap-2"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetTimeline}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TrendingUp className="h-4 w-4" />
            Year {currentYear} of {maxYears}
          </div>
        </div>
        
        {/* Interactive Slider */}
        <div className="space-y-4">
          <div className="relative">
            <input
              type="range"
              min="0"
              max={maxYears}
              value={currentYear}
              onChange={handleSliderChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentYear / maxYears) * 100}%, #e5e7eb ${(currentYear / maxYears) * 100}%, #e5e7eb 100%)`
              }}
            />
            
            {/* Year markers */}
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Start</span>
              <span>5 years</span>
              <span>10 years</span>
              <span>15 years</span>
              <span>20 years</span>
            </div>
          </div>
          
          {/* Current Year Indicator with Story */}
          <motion.div
            key={currentYear}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-blue-900">Year {currentYear}</h4>
                <p className="text-xs text-blue-600">
                  {currentYear === 0 && "The Beginning"}
                  {currentYear > 0 && currentYear <= 2 && "Early Stage"}
                  {currentYear > 2 && currentYear <= 5 && "Growth Phase"}
                  {currentYear > 5 && currentYear <= 8 && "Momentum Building"}
                  {currentYear > 8 && currentYear <= 12 && "Peak Performance"}
                  {currentYear > 12 && currentYear <= 16 && "Mastery Phase"}
                  {currentYear > 16 && currentYear < 20 && "Wisdom Years"}
                  {currentYear === 20 && "Journey Complete"}
                </p>
              </div>
              
              <motion.div
                animate={{ 
                  rotate: isPlaying ? 360 : 0,
                  scale: currentYear === 20 ? [1, 1.2, 1] : 1
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: isPlaying ? Infinity : 0, ease: "linear" },
                  scale: { duration: 0.6, repeat: currentYear === 20 ? 3 : 0 }
                }}
                className={currentYear === 20 ? "text-green-500" : "text-blue-500"}
              >
                <Calendar className="h-6 w-6" />
              </motion.div>
            </div>
            
            {/* Dynamic Story Preview */}
            {selectedNode && (
              <div className="text-sm text-gray-700 bg-white p-3 rounded border-l-4 border-blue-400">
                {generateStoryPreview(currentYear, selectedNode)}
              </div>
            )}
            
            {/* Completion Message */}
            {currentYear === 20 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-center"
              >
                <p className="text-green-800 font-medium">🎉 Journey Complete!</p>
                <p className="text-green-600 text-sm mt-1">
                  You've successfully navigated 20 years of this life path
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
        
        {/* Quick Stats Preview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-700">
              {Math.round((7 + currentYear * 0.1) * 10) / 10}/10
            </div>
            <div className="text-xs text-green-600">Happiness</div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-700">
              {Math.round((6 + Math.sin(currentYear * 0.3)) * 10) / 10}/10
            </div>
            <div className="text-xs text-blue-600">Work-Life</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-700">
              ${(50000 * Math.pow(1.06, currentYear) / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-purple-600">Salary</div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-lg font-bold text-orange-700">
              {Math.round((5 + currentYear * 0.2) * 10) / 10}/10
            </div>
            <div className="text-xs text-orange-600">Experience</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
