'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Briefcase, 
  Heart, 
  TrendingUp, 
  Calendar,
  ArrowRight,
  Download,
  Share2
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface StoryReaderProps {
  node: {
    _id: string;
    aiNarrative: {
      summary: string;
      chapters: Array<{
        title: string;
        text: string;
        yearRange: string;
        highlights: string[];
      }>;
      milestones: Array<{
        year: number;
        event: string;
        significance: 'low' | 'medium' | 'high';
        category: string;
      }>;
      tone: string;
      confidenceScore: number;
      disclaimers: string[];
    };
    metrics: {
      city: {
        name: string;
        country: string;
        teleportScores?: any;
        climate?: any;
      };
      occupation: {
        name: string;
        category: string;
        workLifeBalance?: number;
      };
      finances: {
        salaryMedianUSD?: number;
        colIndex: number;
        currency: string;
      };
      qualityOfLifeIndex: number;
      happinessScore: number;
      workLifeBalance: number;
      healthIndex: number;
    };
    media: {
      coverPhoto: {
        url: string;
        credit: string;
        description: string;
      };
    };
  };
  onBranch: () => void;
}

export function StoryReader({ node, onBranch }: StoryReaderProps) {
  const [activeChapter, setActiveChapter] = useState(0);
  const { aiNarrative, metrics, media } = node;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="relative w-full h-64 mb-6 rounded-2xl overflow-hidden">
          <img
            src={media.coverPhoto.url}
            alt={media.coverPhoto.description}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-6 text-white">
            <h1 className="text-3xl font-bold mb-2">Your Alternate Life</h1>
            <p className="text-lg opacity-90">{aiNarrative.summary}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<MapPin className="w-5 h-5" />}
            label="Location"
            value={`${metrics.city.name}, ${metrics.city.country}`}
          />
          <StatCard
            icon={<Briefcase className="w-5 h-5" />}
            label="Career"
            value={metrics.occupation.name}
          />
          <StatCard
            icon={<Heart className="w-5 h-5" />}
            label="Happiness"
            value={`${formatNumber(metrics.happinessScore)}/10`}
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Quality of Life"
            value={`${formatNumber(metrics.qualityOfLifeIndex)}/10`}
          />
        </div>
      </div>

      {/* Chapter Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Life Chapters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {aiNarrative.chapters.map((chapter, index) => (
              <button
                key={index}
                onClick={() => setActiveChapter(index)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeChapter === index
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {chapter.title}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Chapter */}
      <motion.div
        key={activeChapter}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{aiNarrative.chapters[activeChapter]?.title}</CardTitle>
                <p className="text-gray-600 mt-1">
                  {aiNarrative.chapters[activeChapter]?.yearRange}
                </p>
              </div>
              <Badge variant="outline">
                Chapter {activeChapter + 1} of {aiNarrative.chapters.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p className="text-lg leading-relaxed whitespace-pre-line">
              {aiNarrative.chapters[activeChapter]?.text}
            </p>
            
            {/* Chapter Highlights */}
            {aiNarrative.chapters[activeChapter]?.highlights?.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Key Highlights</h4>
                <ul className="space-y-2">
                  {aiNarrative.chapters[activeChapter].highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          disabled={activeChapter === 0}
          onClick={() => setActiveChapter(activeChapter - 1)}
        >
          Previous Chapter
        </Button>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        {activeChapter === aiNarrative.chapters.length - 1 ? (
          <Button onClick={onBranch} variant="gradient">
            Explore New Path
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={() => setActiveChapter(activeChapter + 1)}>
            Next Chapter
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Milestones Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Life Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiNarrative.milestones.map((milestone, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                    milestone.significance === 'high' ? 'bg-red-500' :
                    milestone.significance === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>
                    {milestone.year}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-medium">{milestone.event}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" size="sm">
                      {milestone.category}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {milestone.significance} significance
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Disclaimers */}
      {aiNarrative.disclaimers?.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">Important Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {aiNarrative.disclaimers.map((disclaimer, index) => (
                <li key={index} className="text-yellow-700 text-sm">
                  • {disclaimer}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="text-center">
      <CardContent className="pt-6">
        <div className="flex justify-center mb-2 text-blue-500">
          {icon}
        </div>
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}