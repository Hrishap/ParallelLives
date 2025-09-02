'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Maximize, Plus } from 'lucide-react';

interface TreeNode {
  id: string;
  parentId?: string;
  data: any;
  depth: number;
  x?: number;
  y?: number;
  children?: TreeNode[];
}

interface TreeVisualizationProps {
  tree: {
    nodes: TreeNode[];
    edges: Array<{ source: string; target: string }>;
    maxDepth: number;
    totalNodes: number;
  };
  selectedNodeId?: string | null;
  onNodeSelect?: (nodeId: string) => void;
  onBranch?: () => void;
}

export function TreeVisualization({ 
  tree, 
  selectedNodeId, 
  onNodeSelect,
  onBranch 
}: TreeVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [transform, setTransform] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!svgRef.current || !tree.nodes.length) return;

    // Clear previous render
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Set up zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        const { transform } = event;
        setZoom(transform.k);
        setTransform({ x: transform.x, y: transform.y });
        g.attr('transform', transform);
      });

    svg.call(zoomBehavior);

    // Create main group for zooming/panning
    const g = svg.append('g');

    // Convert flat node list to hierarchical structure
    const rootNode = buildHierarchy(tree.nodes);
    
    // Create tree layout
    const treeLayout = d3.tree<TreeNode>()
      .size([height - 100, width - 200])
      .separation((a, b) => a.parent === b.parent ? 1.2 : 2);

    // Generate the tree
    const root = d3.hierarchy(rootNode);
    treeLayout(root);

    // Create enhanced links with decision context
    const links = g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal<d3.HierarchyLink<TreeNode>, TreeNode>()
        .x(d => (d.y || 0) + 100)
        .y(d => (d.x || 0) + 50)
      )
      .attr('fill', 'none')
      .attr('stroke', d => {
        // Color links based on the impact of the decision
        const targetMetrics = d.target.data.data.metrics;
        const sourceMetrics = d.source.data.data.metrics;
        if (!targetMetrics || !sourceMetrics) return '#e2e8f0';
        
        const happinessChange = (targetMetrics.happinessScore || 5) - (sourceMetrics.happinessScore || 5);
        if (happinessChange > 1) return '#10b981'; // Green for positive change
        if (happinessChange < -1) return '#ef4444'; // Red for negative change
        return '#94a3b8'; // Gray for neutral
      })
      .attr('stroke-width', d => {
        // Thicker lines for major life changes
        const choice = d.target.data.data.choice;
        const isMajorChange = choice.careerChange || choice.locationChange?.city || choice.educationChange;
        return isMajorChange ? 3 : 2;
      })
      .attr('opacity', 0.8)
      .attr('stroke-dasharray', d => {
        // Dashed lines for risky decisions
        const choice = d.target.data.data.choice;
        const isRisky = choice.careerChange?.toLowerCase().includes('start') || 
                       choice.lifestyleChange?.toLowerCase().includes('nomad');
        return isRisky ? '5,5' : 'none';
      });

    // Create nodes
    const nodes = g.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${(d.y || 0) + 100},${(d.x || 0) + 50})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (onNodeSelect) {
          onNodeSelect(d.data.id);
        }
      });

    // Add circles for nodes with enhanced styling
    nodes.append('circle')
      .attr('r', d => {
        const metrics = d.data.data.metrics;
        const happiness = metrics?.happinessScore || 5;
        return 15 + (happiness / 10) * 10; // Size based on happiness (15-25px)
      })
      .attr('fill', d => {
        if (d.data.id === selectedNodeId) return '#3b82f6';
        const metrics = d.data.data.metrics;
        const happiness = metrics?.happinessScore || 5;
        if (happiness >= 8) return '#10b981'; // Green for high happiness
        if (happiness >= 6) return '#f59e0b'; // Yellow for medium happiness
        if (happiness >= 4) return '#f97316'; // Orange for low-medium happiness
        return '#ef4444'; // Red for low happiness
      })
      .attr('stroke', d => {
        if (d.data.id === selectedNodeId) return '#1d4ed8';
        return d.data.data.status === 'completed' ? '#059669' : 
               d.data.data.status === 'error' ? '#dc2626' : '#6b7280';
      })
      .attr('stroke-width', d => d.data.id === selectedNodeId ? 4 : 2)
      .attr('opacity', 0.9)
      .transition()
      .duration(300)
      .attr('r', d => {
        const baseSize = 15 + ((d.data.data.metrics?.happinessScore || 5) / 10) * 10;
        return d.data.id === selectedNodeId ? baseSize + 5 : baseSize;
      });

    // Add metrics indicators (multiple small circles)
    const metricsGroup = nodes.append('g').attr('class', 'metrics-indicators');
    
    // Happiness indicator
    metricsGroup.append('circle')
      .attr('r', 4)
      .attr('cx', 18)
      .attr('cy', -18)
      .attr('fill', d => {
        const happiness = d.data.data.metrics?.happinessScore || 5;
        return happiness >= 7 ? '#10b981' : happiness >= 5 ? '#f59e0b' : '#ef4444';
      })
      .append('title')
      .text(d => `Happiness: ${(d.data.data.metrics?.happinessScore || 5).toFixed(1)}/10`);
    
    // Income indicator
    metricsGroup.append('circle')
      .attr('r', 4)
      .attr('cx', 18)
      .attr('cy', -8)
      .attr('fill', d => {
        const income = d.data.data.metrics?.finances?.salaryMedianUSD || 50000;
        return income >= 80000 ? '#10b981' : income >= 50000 ? '#f59e0b' : '#ef4444';
      })
      .append('title')
      .text(d => `Income: $${(d.data.data.metrics?.finances?.salaryMedianUSD || 50000).toLocaleString()}`);
    
    // Quality of Life indicator
    metricsGroup.append('circle')
      .attr('r', 4)
      .attr('cx', 18)
      .attr('cy', 2)
      .attr('fill', d => {
        const qol = d.data.data.metrics?.qualityOfLifeIndex || 5;
        return qol >= 7 ? '#10b981' : qol >= 5 ? '#f59e0b' : '#ef4444';
      })
      .append('title')
      .text(d => `Quality of Life: ${(d.data.data.metrics?.qualityOfLifeIndex || 5).toFixed(1)}/10`);
    
    // Status indicator (smaller, in corner)
    nodes.append('circle')
      .attr('r', 3)
      .attr('cx', -18)
      .attr('cy', -18)
      .attr('fill', d => {
        switch (d.data.data.status) {
          case 'completed': return '#10b981';
          case 'generating': return '#f59e0b';
          case 'error': return '#ef4444';
          default: return '#94a3b8';
        }
      })
      .append('title')
      .text(d => `Status: ${d.data.data.status}`);

    // Add enhanced node labels with metrics
    const labelGroup = nodes.append('g').attr('class', 'node-labels');
    
    // Main choice label
    labelGroup.append('text')
      .attr('dy', 35)
      .attr('text-anchor', 'middle')
      .text(d => {
        const choice = d.data.data.choice;
        if (choice.careerChange) return `${choice.careerChange.slice(0, 20)}${choice.careerChange.length > 20 ? '...' : ''}`;
        if (choice.locationChange?.city) return `📍 ${choice.locationChange.city}`;
        if (choice.educationChange) return `🎓 ${choice.educationChange.slice(0, 20)}${choice.educationChange.length > 20 ? '...' : ''}`;
        if (choice.lifestyleChange) return `🌟 ${choice.lifestyleChange.slice(0, 20)}${choice.lifestyleChange.length > 20 ? '...' : ''}`;
        if (choice.relationshipChange) return `💕 ${choice.relationshipChange.slice(0, 20)}${choice.relationshipChange.length > 20 ? '...' : ''}`;
        if (choice.personalityChange) return `🚀 ${choice.personalityChange.slice(0, 20)}${choice.personalityChange.length > 20 ? '...' : ''}`;
        return d.data.depth === 0 ? '🌱 Starting Point' : `Scenario ${d.data.depth}`;
      })
      .attr('font-size', '12px')
      .attr('fill', '#374151')
      .attr('font-weight', '600');
    
    // Metrics summary label
    labelGroup.append('text')
      .attr('dy', 50)
      .attr('text-anchor', 'middle')
      .text(d => {
        const metrics = d.data.data.metrics;
        if (!metrics) return '';
        const happiness = (metrics.happinessScore || 5).toFixed(1);
        const income = metrics.finances?.salaryMedianUSD ? `$${Math.round(metrics.finances.salaryMedianUSD / 1000)}k` : '$50k';
        return `😊${happiness} 💰${income}`;
      })
      .attr('font-size', '10px')
      .attr('fill', '#6b7280')
      .attr('font-weight', '500');

    // Add choice labels on hover
    nodes.append('title')
      .text(d => {
        const choice = d.data.data.choice;
        const parts = [];
        if (choice.careerChange) parts.push(`Career: ${choice.careerChange}`);
        if (choice.locationChange?.city) parts.push(`Location: ${choice.locationChange.city}`);
        if (choice.educationChange) parts.push(`Education: ${choice.educationChange}`);
        if (choice.lifestyleChange) parts.push(`Lifestyle: ${choice.lifestyleChange}`);
        return parts.join('\n') || 'Root scenario';
      });

    // Center the view initially
    const bbox = g.node()?.getBBox();
    if (bbox) {
      const centerX = width / 2 - bbox.width / 2;
      const centerY = height / 2 - bbox.height / 2;
      
      svg.transition()
        .duration(750)
        .call(
          zoomBehavior.transform,
          d3.zoomIdentity.translate(centerX, centerY)
        );
    }

  }, [tree, selectedNodeId, onNodeSelect]);

  const buildHierarchy = (flatNodes: TreeNode[]): TreeNode => {
    const nodeMap = new Map<string, TreeNode>(
      flatNodes.map(node => [node.id, { ...node, children: [] }])
    );

    let root: TreeNode | null = null;

    flatNodes.forEach(node => {
      const treeNode = nodeMap.get(node.id)!;
      
      // Fix: Check for both parentId and data.parentNodeId
      const parentId = node.parentId || node.data?.parentNodeId;
      
      if (!parentId) {
        root = treeNode;
      } else {
        const parent = nodeMap.get(parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(treeNode);
        }
      }
    });

    return root || flatNodes[0];
  };

  const handleZoomIn = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>();
    svg.call(zoomBehavior.scaleBy, 1.5);
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>();
    svg.call(zoomBehavior.scaleBy, 1 / 1.5);
  };

  const handleReset = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>();
    svg.call(zoomBehavior.transform, d3.zoomIdentity);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-white">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <Button size="icon" variant="outline" onClick={handleZoomIn}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={handleZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={handleReset}>
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Floating Add Scenario Button */}
      {onBranch && (
        <div className="absolute bottom-6 right-6 z-10">
          <Button 
            size="lg" 
            variant="default" 
            onClick={onBranch}
            className="rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            {selectedNodeId ? 'Branch from Selected' : 'Add Scenario'}
          </Button>
        </div>
      )}

      {/* Enhanced Legend */}
      <Card className="absolute top-4 left-4 z-10 p-4 max-w-xs">
        <h3 className="font-semibold mb-3">Legend</h3>
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="font-medium mb-2">Node Colors (Happiness)</h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>High (8-10)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Good (6-7)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>Fair (4-5)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Low (1-3)</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Link Types</h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-0.5 bg-green-500"></div>
                <span>Positive Impact</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-0.5 bg-red-500"></div>
                <span>Negative Impact</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-0.5 bg-gray-400 border-dashed border-t-2 border-gray-400"></div>
                <span>Risky Decision</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Indicators</h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>😊 Happiness</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>💰 Income</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span>🏠 Quality of Life</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <Card className="absolute bottom-4 left-4 z-10 p-4">
        <div className="text-sm space-y-1">
          <div><strong>Total Scenarios:</strong> {tree.totalNodes}</div>
          <div><strong>Max Depth:</strong> {tree.maxDepth}</div>
          <div><strong>Zoom:</strong> {(zoom * 100).toFixed(0)}%</div>
        </div>
      </Card>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ cursor: 'grab' }}
      />
    </div>
  );
}