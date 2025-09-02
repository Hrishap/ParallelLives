'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Brain, Globe, BarChart3 } from 'lucide-react';
import { WhatIfInput } from '../components/ui/WhatIfInput';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { api } from '../lib/api';
import { toast } from 'sonner';

// Parse user's choice string into ChoiceSchema format
function parseChoiceString(choice: string) {
  const lowerChoice = choice.toLowerCase();
  
  // Analyze the choice to determine the type of change
  if (lowerChoice.includes('studied') || lowerChoice.includes('education') || lowerChoice.includes('degree') || lowerChoice.includes('university') || lowerChoice.includes('college')) {
    return { educationChange: choice };
  } else if (lowerChoice.includes('career') || lowerChoice.includes('job') || lowerChoice.includes('work') || lowerChoice.includes('became') || lowerChoice.includes('profession')) {
    return { careerChange: choice };
  } else if (lowerChoice.includes('moved') || lowerChoice.includes('lived') || lowerChoice.includes(' in ') || lowerChoice.includes(' to ')) {
    // Extract location if possible
    const locationMatch = choice.match(/(?:in|to)\s+([A-Z][a-zA-Z\s]+)/i);
    if (locationMatch) {
      const location = locationMatch[1].trim();
      return { 
        locationChange: { 
          city: location.includes(',') ? location.split(',')[0].trim() : location,
          country: location.includes(',') ? location.split(',')[1]?.trim() : undefined
        }
      };
    }
    return { locationChange: { city: choice } };
  } else if (lowerChoice.includes('lifestyle') || lowerChoice.includes('life') || lowerChoice.includes('living')) {
    return { lifestyleChange: choice };
  } else if (lowerChoice.includes('relationship') || lowerChoice.includes('married') || lowerChoice.includes('dating')) {
    return { relationshipChange: choice };
  } else if (lowerChoice.includes('personality') || lowerChoice.includes('character') || lowerChoice.includes('attitude')) {
    return { personalityChange: choice };
  } else {
    // Default to lifestyle change for general "what if" scenarios
    return { lifestyleChange: choice };
  }
}

export default function HomePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const handleWhatIfSubmit = async (data: { 
    choice: string; 
    context?: any; 
  }) => {
    try {
      setIsGenerating(true);
      
      // Convert string choice to proper ChoiceSchema format
      const initialChoice = parseChoiceString(data.choice);
      
      // Create session via API
      const response = await api.createSession({
        title: data.choice.length > 50 ? data.choice.substring(0, 50) + '...' : data.choice,
        description: `Exploring: ${data.choice}`,
        baseContext: data.context || {},
        initialChoice
      });

      if (response.success && response.data?.session) {
        // Navigate to the session page
        router.push(`/session/${response.data.session._id}`);
        toast.success('Your parallel universe is ready!');
      } else {
        throw new Error(response.error || 'Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create your parallel universe. Please try again.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-parallel-50 via-white to-alternate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 bg-[size:20px_20px] opacity-40" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-parallel-500 mr-3" />
              <h1 className="text-5xl sm:text-7xl font-display font-bold gradient-text">
                ParallelLives
              </h1>
            </div>
            
            <p className="text-xl sm:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto">
              What if your life had taken a different path?
            </p>
            
            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
              AI-powered life simulator that creates alternate realities based on your choices, 
              backed by real-world data and immersive storytelling.
            </p>

            {/* What If Input */}
            <div className="max-w-2xl mx-auto mb-16">
              <WhatIfInput 
                onSubmit={handleWhatIfSubmit}
                isGenerating={isGenerating}
                placeholder="What if I had studied art instead of computer science?"
              />
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <FeatureCard
                icon={<Brain className="w-8 h-8" />}
                title="AI Storytelling"
                description="Generate immersive first-person narratives of your alternate life paths"
              />
              <FeatureCard
                icon={<Globe className="w-8 h-8" />}
                title="Real-World Data"
                description="Grounded in actual city metrics, climate data, and career statistics"
              />
              <FeatureCard
                icon={<BarChart3 className="w-8 h-8" />}
                title="Interactive Visualization"
                description="Explore branching life trees and compare different scenarios"
              />
            </div>

            {/* Demo Examples */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                Try These Popular Scenarios
              </h2>
              <div className="flex flex-wrap justify-center gap-4">
                {DEMO_SCENARIOS.map((scenario, index) => (
                  <DemoScenarioButton
                    key={index}
                    scenario={scenario}
                    onClick={() => handleWhatIfSubmit({ choice: scenario })}
                    disabled={isGenerating}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI analyzes your choices and creates detailed alternate life scenarios
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {PROCESS_STEPS.map((step, index) => (
              <ProcessStep
                key={index}
                number={index + 1}
                title={step.title}
                description={step.description}
                isLast={index === PROCESS_STEPS.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass-card rounded-2xl p-8 text-center"
    >
      <div className="text-parallel-500 mb-4 flex justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">
        {title}
      </h3>
      <p className="text-gray-600">
        {description}
      </p>
    </motion.div>
  );
}

function DemoScenarioButton({ scenario, onClick, disabled = false }: {
  scenario: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="outline"
      className="hover:bg-parallel-50 hover:border-parallel-300 transition-colors"
      onClick={onClick}
      disabled={disabled}
    >
      {scenario}
    </Button>
  );
}

function ProcessStep({ number, title, description, isLast }: {
  number: number;
  title: string;
  description: string;
  isLast: boolean;
}) {
  return (
    <div className="relative">
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-parallel-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-4">
          {number}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-gray-600">
          {description}
        </p>
      </div>
      
      {!isLast && (
        <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-parallel-200 transform translate-x-6" />
      )}
    </div>
  );
}

const DEMO_SCENARIOS = [
  "What if I studied music in Florence?",
  "What if I became a teacher in Tokyo?",
  "What if I started a tech company in Austin?",
  "What if I became a chef in Paris?",
  "What if I moved to Costa Rica for a simpler life?"
];

const PROCESS_STEPS = [
  {
    title: "Enter Your Choice",
    description: "Describe the alternative life path you want to explore"
  },
  {
    title: "AI Analysis",
    description: "Our AI analyzes your choice and gathers relevant data"
  },
  {
    title: "Generate Story",
    description: "Create an immersive narrative of your alternate life"
  },
  {
    title: "Explore & Branch",
    description: "Dive deeper with interactive visualizations and new choices"
  }
];