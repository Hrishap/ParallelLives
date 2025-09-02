'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';

interface WhatIfInputProps {
  onSubmit: (data: { choice: string; context?: any }) => void;
  isGenerating?: boolean;
  placeholder?: string;
  className?: string;
}

export function WhatIfInput({ 
  onSubmit, 
  isGenerating = false, 
  placeholder = "What if I had...",
  className = ""
}: WhatIfInputProps) {
  const [input, setInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [context, setContext] = useState({
    age: '',
    currentCity: '',
    currentCareer: '',
    riskTolerance: 'medium'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    onSubmit({
      choice: input.trim(),
      context: showAdvanced ? context : undefined
    });
  };

  const suggestions = [
    "What if I studied art instead of computer science?",
    "What if I moved to Tokyo and became a chef?",
    "What if I started my own company at 25?",
    "What if I became a teacher in a small town?",
    "What if I pursued music professionally?"
  ];

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Input */}
        <Card className="p-6 glass-card border-2 border-parallel-200 hover:border-parallel-300 transition-colors">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1">
              <div className="w-10 h-10 bg-gradient-to-r from-parallel-500 to-alternate-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                rows={3}
                disabled={isGenerating}
                className="w-full resize-none border-none outline-none text-lg placeholder-gray-400 bg-transparent"
                style={{ 
                  minHeight: '80px',
                  fontFamily: 'inherit'
                }}
              />
              
              <div className="flex items-center justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-parallel-600 hover:text-parallel-700 transition-colors"
                >
                  {showAdvanced ? 'Hide' : 'Show'} advanced options
                </button>
                
                <Button
                  type="submit"
                  disabled={!input.trim() || isGenerating}
                  size="lg"
                  variant="gradient"
                  className="min-w-[140px]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Explore
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Advanced Options */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4">Context (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Age
                    </label>
                    <input
                      type="number"
                      value={context.age}
                      onChange={(e) => setContext({ ...context, age: e.target.value })}
                      placeholder="25"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parallel-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current City
                    </label>
                    <input
                      type="text"
                      value={context.currentCity}
                      onChange={(e) => setContext({ ...context, currentCity: e.target.value })}
                      placeholder="San Francisco"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parallel-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Career
                    </label>
                    <input
                      type="text"
                      value={context.currentCareer}
                      onChange={(e) => setContext({ ...context, currentCareer: e.target.value })}
                      placeholder="Software Engineer"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parallel-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Risk Tolerance
                    </label>
                    <select
                      value={context.riskTolerance}
                      onChange={(e) => setContext({ ...context, riskTolerance: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parallel-500 focus:border-transparent"
                    >
                      <option value="low">Conservative</option>
                      <option value="medium">Moderate</option>
                      <option value="high">Adventurous</option>
                    </select>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestions */}
        {!isGenerating && !input && (
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-3">Or try one of these:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-full hover:border-parallel-300 hover:bg-parallel-50 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Loading State */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-8 text-center"
          >
            <div className="inline-block">
              <div className="flex items-center space-x-2 text-parallel-600">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="text-lg font-medium">Simulating your parallel universe...</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                This may take a few moments while we gather data and generate your story
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}