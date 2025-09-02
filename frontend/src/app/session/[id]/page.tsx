'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Share2, 
  Download, 
  Plus, 
  Eye,
  Settings,
  TreePine,
  User
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TreeNode } from '@/types';
import { SplitView } from '../SplitView';
import { TreeVisualization } from '../TreeVisualization';
import { StoryReader } from '../StoryReader';
import { NodeBrancher } from '@/components/session/NodeBrancher';
import { MetricsVisualization } from '@/components/session/MetricsVisualization';
import { UserProfileSetup } from '../../../components/session/UserProfileSetup';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.id as string;
  
  const [viewMode, setViewMode] = useState<'split' | 'tree' | 'story' | 'metrics'>('split');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showBrancher, setShowBrancher] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const handleExportPDF = async () => {
    if (!sessionData?.success) {
      toast.error('No session data available for export');
      return;
    }

    try {
      const session = sessionData.data.session;
      const tree = sessionData.data.tree;
      
      // Create PDF with session data
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add title
      pdf.setFontSize(20);
      pdf.text(session.title, 20, 30);
      
      // Add creation date
      pdf.setFontSize(12);
      pdf.text(`Created: ${new Date(session.createdAt).toLocaleDateString()}`, 20, 45);
      pdf.text(`Total Scenarios: ${tree.totalNodes}`, 20, 55);
      
      let yPosition = 70;
      
      // Add each scenario
      tree.nodes.forEach((node: any, index: number) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 30;
        }
        
        pdf.setFontSize(14);
        pdf.text(`Scenario ${index + 1} (Depth ${node.depth})`, 20, yPosition);
        yPosition += 10;
        
        // Add status
        pdf.setFontSize(10);
        pdf.text(`Status: ${node.data.status}`, 25, yPosition);
        yPosition += 8;
        
        // Add choice details
        const choice = node.data.choice;
        if (choice.careerChange) {
          pdf.setFontSize(10);
          pdf.text(`Career: ${choice.careerChange}`, 25, yPosition);
          yPosition += 8;
        }
        if (choice.locationChange?.city) {
          pdf.setFontSize(10);
          pdf.text(`Location: ${choice.locationChange.city}`, 25, yPosition);
          yPosition += 8;
        }
        if (choice.educationChange) {
          pdf.setFontSize(10);
          pdf.text(`Education: ${choice.educationChange}`, 25, yPosition);
          yPosition += 8;
        }
        if (choice.lifestyleChange) {
          pdf.setFontSize(10);
          pdf.text(`Lifestyle: ${choice.lifestyleChange}`, 25, yPosition);
          yPosition += 8;
        }
        if (choice.relationshipChange) {
          pdf.setFontSize(10);
          pdf.text(`Relationship: ${choice.relationshipChange}`, 25, yPosition);
          yPosition += 8;
        }
        if (choice.personalityChange) {
          pdf.setFontSize(10);
          pdf.text(`Personal Growth: ${choice.personalityChange}`, 25, yPosition);
          yPosition += 8;
        }
        
        // Add story summary if available - check multiple possible story locations
        let storyText = null;
        if (node.data.outcome?.story) {
          storyText = node.data.outcome.story;
        } else if (node.data.aiNarrative?.summary) {
          storyText = node.data.aiNarrative.summary;
        } else if (node.data.aiNarrative?.chapters?.[0]?.text) {
          storyText = node.data.aiNarrative.chapters[0].text;
        } else if (node.data.story) {
          storyText = node.data.story;
        }
        
        if (storyText) {
          pdf.setFontSize(9);
          const storyLines = pdf.splitTextToSize(storyText.substring(0, 400) + '...', 170);
          pdf.text(storyLines, 25, yPosition);
          yPosition += storyLines.length * 5 + 10;
        } else {
          // Debug: Add what data is actually available
          pdf.setFontSize(8);
          pdf.text('Story content not yet generated or unavailable', 25, yPosition);
          yPosition += 10;
        }
        
        yPosition += 5;
      });
      
      // Save the PDF
      pdf.save(`${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_scenarios.pdf`);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    }
  };

  const { data: sessionData, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => api.getSessionTree(sessionId),
    enabled: !!sessionId,
    refetchInterval: 30000, // Poll for updates every 30 seconds
  });

  // Auto-select the most appropriate node when session loads or updates
  useEffect(() => {
    if (sessionData?.success && sessionData.data.tree.nodes.length > 0 && !selectedNodeId) {
      const nodes = sessionData.data.tree.nodes;
      
      // Find the most recently created completed node, or the newest node
      const completedNodes = nodes.filter((n: TreeNode) => n.data.status === 'completed');
      const mostRecentCompleted = completedNodes.sort((a, b) => 
        new Date(b.data.createdAt || 0).getTime() - new Date(a.data.createdAt || 0).getTime()
      )[0];
      
      if (mostRecentCompleted) {
        setSelectedNodeId(mostRecentCompleted.id);
      } else {
        // If no completed nodes, select the root node
        const rootNode = nodes.find(n => !n.parentId && !n.data.parentNodeId);
        if (rootNode) {
          setSelectedNodeId(rootNode.id);
        }
      }
    }
  }, [sessionData, selectedNodeId]);

  const { data: selectedNode } = useQuery({
    queryKey: ['node', selectedNodeId],
    queryFn: () => api.getNode(selectedNodeId!),
    enabled: !!selectedNodeId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your parallel universe..." />
      </div>
    );
  }

  if (!sessionData?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">Session Not Found</h2>
            <p className="text-gray-600 mb-6">
              The parallel life session you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const session = sessionData.data.session;
  const tree = sessionData.data.tree;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {session.title}
                </h1>
                <p className="text-sm text-gray-500">
                  {tree.totalNodes} scenarios • Created {new Date(session.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* View Controls */}
            <div className="flex items-center space-x-2">
              <div className="bg-gray-100 rounded-lg p-1 flex">
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'split' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Split View
                </button>
                <button
                  onClick={() => setViewMode('tree')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'tree' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <TreePine className="w-4 h-4 mr-1 inline" />
                  Tree
                </button>
                <button
                  onClick={() => setViewMode('metrics')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'metrics' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Settings className="w-4 h-4 mr-1 inline" />
                  Metrics
                </button>
                <button
                  onClick={() => setViewMode('story')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'story' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Eye className="w-4 h-4 mr-1 inline" />
                  Story
                </button>
              </div>

              {/* Action Buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProfileSetup(true)}
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBrancher(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {selectedNodeId ? 'Branch from Selected' : 'Add Scenario'}
              </Button>
              
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExportPDF()}
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {viewMode === 'split' && (
          <SplitView 
            session={session}
            tree={tree}
            selectedNodeId={selectedNodeId}
            onNodeSelect={setSelectedNodeId}
            onBranch={() => setShowBrancher(true)}
            onReadStory={() => setViewMode('story')}
          />
        )}

        {viewMode === 'tree' && (
          <div className="h-[calc(100vh-4rem)]">
            <TreeVisualization
              tree={tree}
              selectedNodeId={selectedNodeId}
              onNodeSelect={setSelectedNodeId}
              onBranch={() => setShowBrancher(true)}
            />
          </div>
        )}

        {viewMode === 'metrics' && (
          <div className="max-w-7xl mx-auto py-8 px-4">
            <MetricsVisualization
              tree={tree}
              selectedNodeId={selectedNodeId}
              onNodeSelect={setSelectedNodeId}
            />
          </div>
        )}

        {viewMode === 'story' && selectedNode?.success && (
          <div className="max-w-4xl mx-auto py-8">
            <StoryReader 
              node={selectedNode.data}
              onBranch={() => setShowBrancher(true)}
            />
          </div>
        )}
      </div>

      {/* Node Brancher Modal */}
      {showBrancher && (
        <NodeBrancher
          sessionId={sessionId}
          parentNodeId={selectedNodeId || undefined}
          tree={tree}
          onClose={() => setShowBrancher(false)}
          onCreated={(newNodeId) => {
            setSelectedNodeId(newNodeId);
            setShowBrancher(false);
          }}
        />
      )}

      {/* User Profile Setup Modal */}
      {showProfileSetup && (
        <UserProfileSetup
          initialProfile={userProfile}
          onComplete={(profile: any) => {
            setUserProfile(profile);
            setShowProfileSetup(false);
            // TODO: Save profile to backend
            toast.success('Profile saved! Future scenarios will be personalized.');
          }}
          onClose={() => setShowProfileSetup(false)}
        />
      )}
    </div>
  );
}
