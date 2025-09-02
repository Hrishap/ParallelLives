'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Briefcase, 
  MapPin, 
  GraduationCap, 
  Heart, 
  User, 
  Home,
  Loader2,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { NodeBrancherProps, CreateNodeRequest, ApiResponse, LifeNode } from '@/types';
import { toast } from 'sonner';

export function NodeBrancher({ 
  sessionId, 
  parentNodeId, 
  tree,
  onClose, 
  onCreated 
}: NodeBrancherProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(parentNodeId);
  const [formData, setFormData] = useState<CreateNodeRequest>({
    parentNodeId: parentNodeId,
    choice: {},
    userPreferences: {
      tone: 'balanced',
      focusAreas: [],
      timeHorizon: 5
    }
  });

  const queryClient = useQueryClient();

  const createNodeMutation = useMutation({
    mutationFn: (data: CreateNodeRequest) => api.createNode(sessionId, data),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('New scenario created successfully!');
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
        onCreated(response.data._id);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create scenario');
    }
  });

  const categories = [
    {
      id: 'career',
      title: 'Career Change',
      icon: Briefcase,
      description: 'Explore different professional paths',
      examples: ['Switch to tech', 'Start own business', 'Become a teacher', 'Join non-profit']
    },
    {
      id: 'location',
      title: 'Location Change',
      icon: MapPin,
      description: 'Move to a different city or country',
      examples: ['Move to Tokyo', 'Relocate to countryside', 'Live in Europe', 'Return home']
    },
    {
      id: 'education',
      title: 'Education',
      icon: GraduationCap,
      description: 'Pursue further learning or skills',
      examples: ['Get MBA', 'Learn coding', 'Study abroad', 'Take gap year']
    },
    {
      id: 'lifestyle',
      title: 'Lifestyle Change',
      icon: Home,
      description: 'Change how you live day-to-day',
      examples: ['Minimalist living', 'Digital nomad', 'Healthy lifestyle', 'Work-life balance']
    },
    {
      id: 'relationship',
      title: 'Relationships',
      icon: Heart,
      description: 'Changes in personal relationships',
      examples: ['Get married', 'Start family', 'End relationship', 'Reconnect with friends']
    },
    {
      id: 'personality',
      title: 'Personal Growth',
      icon: User,
      description: 'Develop different aspects of yourself',
      examples: ['Become more social', 'Learn confidence', 'Develop creativity', 'Build leadership']
    }
  ];

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setFormData(prev => ({
      ...prev,
      choice: { ...prev.choice, [`${categoryId}Change`]: '' }
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        choice: {
          ...prev.choice,
          [parent]: {
            ...(prev.choice[parent as keyof typeof prev.choice] as any),
            [child]: value
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        choice: { ...prev.choice, [field]: value }
      }));
    }
  };

  const handleParentSelect = (nodeId: string) => {
    setSelectedParentId(nodeId);
    setFormData(prev => ({
      ...prev,
      parentNodeId: nodeId
    }));
  };

  const handleSubmit = () => {
    if (!selectedCategory) {
      toast.error('Please select a category');
      return;
    }

    const choiceKey = `${selectedCategory}Change`;
    const choiceValue = formData.choice[choiceKey as keyof typeof formData.choice];
    
    if (!choiceValue || (typeof choiceValue === 'string' && !choiceValue.trim())) {
      toast.error('Please describe your choice');
      return;
    }

    // Clean up the choice object - only include non-empty fields
    const cleanChoice: any = {};
    Object.entries(formData.choice).forEach(([key, value]) => {
      if (value && typeof value === 'string' && value.trim()) {
        cleanChoice[key] = value.trim();
      } else if (value && typeof value === 'object' && value !== null) {
        // Handle locationChange object
        const cleanObject: any = {};
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (subValue && typeof subValue === 'string' && subValue.trim()) {
            cleanObject[subKey] = subValue.trim();
          }
        });
        if (Object.keys(cleanObject).length > 0) {
          cleanChoice[key] = cleanObject;
        }
      }
    });

    // Update formData with selected parent and cleaned choice
    const submitData = {
      ...formData,
      parentNodeId: selectedParentId,
      choice: cleanChoice
    };

    createNodeMutation.mutate(submitData);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {parentNodeId ? 'Branch New Scenario' : 'Add New Scenario'}
                </h2>
                <p className="text-sm text-gray-500">
                  {parentNodeId 
                    ? 'Continue from this scenario with a different choice' 
                    : 'Create a new scenario or branch from an existing one'
                  }
                </p>
                {parentNodeId && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">
                      💡 This will build upon the selected scenario's context and metrics
                    </p>
                  </div>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Category Selection */}
            <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
              {/* Parent Context Display */}
              {parentNodeId && tree && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Branching From</h3>
                  {(() => {
                    const parentNode = tree.nodes.find(n => n.id === parentNodeId);
                    if (!parentNode) return null;
                    return (
                      <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                            <span className="font-medium">Scenario Depth {parentNode.depth}</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            {Object.entries(parentNode.data.choice).map(([key, value]) => {
                              if (key === 'locationChange' && typeof value === 'object' && value?.city) {
                                return (
                                  <div key={key} className="flex items-center space-x-2">
                                    <span className="text-gray-600">📍 Location:</span>
                                    <span className="font-medium">{value.city}</span>
                                  </div>
                                );
                              }
                              if (typeof value === 'string' && value) {
                                const label = key.replace('Change', '');
                                return (
                                  <div key={key} className="flex items-center space-x-2">
                                    <span className="text-gray-600">{label}:</span>
                                    <span className="font-medium">{value.slice(0, 40)}{value.length > 40 ? '...' : ''}</span>
                                  </div>
                                );
                              }
                              return null;
                            }).filter(Boolean)}
                            {(parentNode.data as any).metrics && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div className="text-center">
                                    <div className="font-medium">😊 {((parentNode.data as any).metrics.happinessScore || 5).toFixed(1)}</div>
                                    <div className="text-gray-500">Happiness</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-medium">💰 ${Math.round(((parentNode.data as any).metrics.finances?.salaryMedianUSD || 50000) / 1000)}k</div>
                                    <div className="text-gray-500">Income</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-medium">🏠 {((parentNode.data as any).metrics.qualityOfLifeIndex || 5).toFixed(1)}</div>
                                    <div className="text-gray-500">Quality</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </div>
              )}
              
              {/* Parent Node Selection */}
              {!parentNodeId && tree && tree.nodes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Branch From</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Select which scenario to branch from, or create a new root scenario.
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    <Card 
                      className={`cursor-pointer transition-all ${
                        !selectedParentId 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedParentId(undefined)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-sm font-medium">New Root Scenario</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Start a completely new path</p>
                      </CardContent>
                    </Card>
                    {tree.nodes.map((node) => (
                      <Card 
                        key={node.id}
                        className={`cursor-pointer transition-all ${
                          selectedParentId === node.id 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => handleParentSelect(node.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${
                              node.data.status === 'completed' ? 'bg-green-500' : 
                              node.data.status === 'generating' ? 'bg-yellow-500' : 
                              node.data.status === 'failed' ? 'bg-red-500' : 'bg-gray-400'
                            }`}></div>
                            <span className="text-sm font-medium">Depth {node.depth}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {Object.entries(node.data.choice).map(([key, value]) => {
                              if (key === 'locationChange' && typeof value === 'object' && value?.city) {
                                return `Location: ${value.city}`;
                              }
                              if (typeof value === 'string' && value) {
                                return `${key.replace('Change', '')}: ${value.slice(0, 30)}${value.length > 30 ? '...' : ''}`;
                              }
                              return null;
                            }).filter(Boolean).join(', ') || 'Root scenario'}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              <h3 className="text-lg font-semibold mb-4">
                {parentNodeId ? 'What would you change?' : 'Choose a Category'}
              </h3>
              {parentNodeId && (
                <p className="text-sm text-gray-500 mb-4">
                  Select what aspect of life you'd like to explore differently from this point.
                </p>
              )}
              <div className="space-y-3">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <motion.div
                      key={category.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all ${
                          selectedCategory === category.id 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => handleCategorySelect(category.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              selectedCategory === category.id 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{category.title}</h4>
                              <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {category.examples.slice(0, 2).map((example, idx) => (
                                  <span 
                                    key={idx}
                                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                                  >
                                    {example}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Details Form */}
            <div className="w-1/2 p-6 overflow-y-auto">
              {selectedCategory ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Describe Your Choice</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Be specific about what you want to explore in this scenario.
                    </p>
                  </div>

                  {selectedCategory === 'career' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Career Change
                      </label>
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="e.g., Switch from marketing to software development, start my own consulting business..."
                        value={formData.choice.careerChange || ''}
                        onChange={(e) => handleInputChange('careerChange', e.target.value)}
                      />
                    </div>
                  )}

                  {selectedCategory === 'location' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New City
                        </label>
                        <input
                          type="text"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Tokyo, New York, Barcelona..."
                          value={formData.choice.locationChange?.city || ''}
                          onChange={(e) => handleInputChange('locationChange.city', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country (optional)
                        </label>
                        <input
                          type="text"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Japan, USA, Spain..."
                          value={formData.choice.locationChange?.country || ''}
                          onChange={(e) => handleInputChange('locationChange.country', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {selectedCategory === 'education' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Education Change
                      </label>
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="e.g., Get an MBA, learn web development, study abroad in France..."
                        value={formData.choice.educationChange || ''}
                        onChange={(e) => handleInputChange('educationChange', e.target.value)}
                      />
                    </div>
                  )}

                  {selectedCategory === 'lifestyle' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lifestyle Change
                      </label>
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="e.g., Become a digital nomad, adopt minimalist living, focus on health and fitness..."
                        value={formData.choice.lifestyleChange || ''}
                        onChange={(e) => handleInputChange('lifestyleChange', e.target.value)}
                      />
                    </div>
                  )}

                  {selectedCategory === 'relationship' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relationship Change
                      </label>
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="e.g., Get married to current partner, end current relationship, start a family..."
                        value={formData.choice.relationshipChange || ''}
                        onChange={(e) => handleInputChange('relationshipChange', e.target.value)}
                      />
                    </div>
                  )}

                  {selectedCategory === 'personality' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Personal Growth
                      </label>
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="e.g., Become more confident and outgoing, develop leadership skills, learn to be more patient..."
                        value={formData.choice.personalityChange || ''}
                        onChange={(e) => handleInputChange('personalityChange', e.target.value)}
                      />
                    </div>
                  )}

                  {/* Preferences */}
                  <div className="border-t pt-6">
                    <h4 className="font-medium text-gray-900 mb-4">Scenario Preferences</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tone
                        </label>
                        <select
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.userPreferences?.tone || 'balanced'}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            userPreferences: {
                              ...prev.userPreferences,
                              tone: e.target.value as any
                            }
                          }))}
                        >
                          <option value="optimistic">Optimistic</option>
                          <option value="realistic">Realistic</option>
                          <option value="cautious">Cautious</option>
                          <option value="balanced">Balanced</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time Horizon (years)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.userPreferences?.timeHorizon || 5}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            userPreferences: {
                              ...prev.userPreferences,
                              timeHorizon: parseInt(e.target.value)
                            }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Select a category to get started</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">
              This will create a new branch in your parallel life tree
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!selectedCategory || createNodeMutation.isPending}
              >
                {createNodeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Scenario
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
