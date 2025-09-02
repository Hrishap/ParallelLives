'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TreeVisualization } from './TreeVisualization';
import { MetricsComparison } from './MetricsComparison';
import { 
  Eye, 
  BarChart3, 
  TreePine,
  MapPin,
  Briefcase,
  DollarSign,
  Plus
} from 'lucide-react';

interface SplitViewProps {
  session: any;
  tree: any;
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string) => void;
  onBranch?: () => void;
  onReadStory?: () => void;
}

export function SplitView({ 
  session, 
  tree, 
  selectedNodeId, 
  onNodeSelect,
  onBranch,
  onReadStory
}: SplitViewProps) {
  const [leftPanel, setLeftPanel] = useState<'tree' | 'current'>('current');
  const [rightPanel, setRightPanel] = useState<'scenario' | 'metrics'>('scenario');

  const selectedNode = tree.nodes.find((n: any) => n.id === selectedNodeId);
  const rootNode = tree.nodes.find((n: any) => !n.parentId);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Panel */}
      <div className="w-1/2 border-r border-gray-200 bg-white">
        {/* Panel Header */}
        <div className="h-12 border-b border-gray-200 flex items-center px-4 bg-gray-50">
          <div className="flex space-x-2">
            <button
              onClick={() => setLeftPanel('current')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                leftPanel === 'current' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Current Life
            </button>
            <button
              onClick={() => setLeftPanel('tree')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                leftPanel === 'tree' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TreePine className="w-4 h-4 mr-1 inline" />
              Tree View
            </button>
          </div>
        </div>

        {/* Panel Content */}
        <div className="h-[calc(100%-3rem)] overflow-auto">
          {leftPanel === 'current' ? (
            <CurrentLifePanel session={session} />
          ) : (
            <div className="h-full">
              <TreeVisualization
                tree={tree}
                selectedNodeId={selectedNodeId}
                onNodeSelect={onNodeSelect}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-1/2 bg-white">
        {/* Panel Header */}
        <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 bg-gray-50">
          <div className="flex space-x-2">
            <button
              onClick={() => setRightPanel('scenario')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                rightPanel === 'scenario' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="w-4 h-4 mr-1 inline" />
              Scenario
            </button>
            <button
              onClick={() => setRightPanel('metrics')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                rightPanel === 'metrics' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-1 inline" />
              Metrics
            </button>
          </div>
          
          {selectedNode && (
            <Badge variant={selectedNode.data.status === 'completed' ? 'default' : 'secondary'}>
              {selectedNode.data.status}
            </Badge>
          )}
        </div>

        {/* Panel Content */}
        <div className="h-[calc(100%-3rem)] overflow-auto">
          {rightPanel === 'scenario' ? (
            <ScenarioPanel node={selectedNode} onBranch={onBranch} onReadStory={onReadStory} />
          ) : (
            <MetricsComparison 
              currentNode={rootNode} 
              alternateNode={selectedNode} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CurrentLifePanel({ session }: { session: any }) {
  const context = session.baseContext || {};
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Current Life</h2>
        <p className="text-gray-600">
          This represents your baseline scenario for comparison.
        </p>
      </div>

      {/* Current Context */}
      {Object.keys(context).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Situation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {context.age && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">
                    {context.age}
                  </span>
                </div>
                <div>
                  <p className="font-medium">Age</p>
                  <p className="text-sm text-gray-600">{context.age} years old</p>
                </div>
              </div>
            )}

            {context.currentCity && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-gray-600">{context.currentCity}</p>
                </div>
              </div>
            )}

            {context.currentCareer && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Career</p>
                  <p className="text-sm text-gray-600">{context.currentCareer}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Placeholder for current life metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Current Life Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Select an alternate scenario to see comparisons</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ScenarioPanel({ node, onBranch, onReadStory }: { node?: any; onBranch?: () => void; onReadStory?: () => void }) {
  if (!node) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <TreePine className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No Scenario Selected</p>
          <p>Click on a node in the tree to view the scenario details</p>
        </div>
      </div>
    );
  }

  const { data } = node;

  if (data.status === 'generating') {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium mb-2">Generating Scenario...</p>
          <p className="text-gray-500">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (data.status === 'error') {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center text-red-500">
          <p className="text-lg font-medium mb-2">Generation Failed</p>
          <p className="text-gray-500">{data.errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Scenario Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Alternate Scenario</h2>
        <p className="text-gray-600">{data.aiNarrative?.summary}</p>
      </div>

      {/* Cover Image */}
      {data.media?.coverPhoto?.url && (
        <div className="w-full h-48 rounded-lg overflow-hidden">
          <img
            src={data.media.coverPhoto.url}
            alt={data.media.coverPhoto.description}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <MapPin className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Location</p>
            <p className="font-semibold">
              {data.metrics?.city?.name}, {data.metrics?.city?.country}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Briefcase className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Career</p>
            <p className="font-semibold">{data.metrics?.occupation?.name}</p>
          </CardContent>
        </Card>
      </div>

      {/* Story Preview */}
      {data.aiNarrative?.chapters?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Story Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.aiNarrative.chapters.slice(0, 1).map((chapter: any, index: number) => (
                <div key={index}>
                  <h4 className="font-semibold text-gray-900 mb-2">{chapter.title}</h4>
                  <p className="text-gray-700 text-sm line-clamp-4">
                    {chapter.text.substring(0, 200)}...
                  </p>
                </div>
              ))}
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={onReadStory}
                  disabled={!onReadStory}
                >
                  Read Full Story
                </Button>
                {onBranch && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={onBranch}
                    className="flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Branch
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}