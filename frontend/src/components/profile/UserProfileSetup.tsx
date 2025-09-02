'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Heart, 
  Target,
  TrendingUp,
  Globe,
  Calendar,
  DollarSign,
  Home,
  Users,
  Sparkles,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface UserProfile {
  // Basic Info
  name: string;
  age: number;
  currentCity: string;
  currentCountry: string;
  
  // Professional
  currentCareer: string;
  yearsExperience: number;
  currentSalary: number;
  careerSatisfaction: number;
  
  // Education
  currentEducation: string;
  skills: string[];
  learningGoals: string[];
  
  // Personal
  relationshipStatus: 'single' | 'dating' | 'married' | 'complicated';
  hasChildren: boolean;
  livingSituation: 'alone' | 'roommates' | 'family' | 'partner';
  
  // Values & Preferences
  values: string[];
  riskTolerance: 'low' | 'medium' | 'high';
  priorities: string[];
  dealBreakers: string[];
  
  // Goals & Aspirations
  shortTermGoals: string[];
  longTermGoals: string[];
  dreamDestinations: string[];
  bucketList: string[];
  
  // Lifestyle
  workLifeBalance: number;
  healthFocus: number;
  socialLife: number;
  adventureSeeker: number;
  creativityImportance: number;
  stabilityImportance: number;
}

interface UserProfileSetupProps {
  onComplete: (profile: UserProfile) => void;
  onClose: () => void;
  initialProfile?: Partial<UserProfile>;
}

const STEPS = [
  { id: 'basic', title: 'Basic Info', icon: User },
  { id: 'professional', title: 'Career', icon: Briefcase },
  { id: 'education', title: 'Education', icon: GraduationCap },
  { id: 'personal', title: 'Personal', icon: Heart },
  { id: 'values', title: 'Values', icon: Target },
  { id: 'goals', title: 'Goals', icon: TrendingUp },
  { id: 'lifestyle', title: 'Lifestyle', icon: Home }
];

const VALUES_OPTIONS = [
  'Family', 'Career Growth', 'Financial Security', 'Adventure', 'Creativity',
  'Health & Wellness', 'Learning', 'Independence', 'Community', 'Stability',
  'Innovation', 'Work-Life Balance', 'Travel', 'Relationships', 'Achievement'
];

const SKILLS_OPTIONS = [
  'Leadership', 'Communication', 'Problem Solving', 'Programming', 'Design',
  'Marketing', 'Sales', 'Writing', 'Analysis', 'Project Management',
  'Languages', 'Teaching', 'Research', 'Finance', 'Operations'
];

export function UserProfileSetup({ onComplete, onClose, initialProfile }: UserProfileSetupProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    age: 25,
    currentCity: '',
    currentCountry: '',
    currentCareer: '',
    yearsExperience: 0,
    currentSalary: 50000,
    careerSatisfaction: 5,
    currentEducation: '',
    skills: [],
    learningGoals: [],
    relationshipStatus: 'single',
    hasChildren: false,
    livingSituation: 'alone',
    values: [],
    riskTolerance: 'medium',
    priorities: [],
    dealBreakers: [],
    shortTermGoals: [],
    longTermGoals: [],
    dreamDestinations: [],
    bucketList: [],
    workLifeBalance: 5,
    healthFocus: 5,
    socialLife: 5,
    adventureSeeker: 5,
    creativityImportance: 5,
    stabilityImportance: 5,
    ...initialProfile
  });

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const SliderInput = ({ label, value, onChange, min = 1, max = 10 }: any) => (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label>{label}</Label>
        <span className="text-sm text-gray-500">{value}/10</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  );

  const MultiSelect = ({ options, selected, onChange, placeholder }: any) => (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((option: string) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(toggleArrayItem(selected, option))}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selected.includes(option)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {selected.length === 0 && (
        <p className="text-sm text-gray-500">{placeholder}</p>
      )}
    </div>
  );

  const renderStep = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => updateProfile({ name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={profile.age}
                  onChange={(e) => updateProfile({ age: parseInt(e.target.value) || 25 })}
                  min="18"
                  max="100"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Current City</Label>
                <Input
                  id="city"
                  value={profile.currentCity}
                  onChange={(e) => updateProfile({ currentCity: e.target.value })}
                  placeholder="e.g., New York"
                />
              </div>
              <div>
                <Label htmlFor="country">Current Country</Label>
                <Input
                  id="country"
                  value={profile.currentCountry}
                  onChange={(e) => updateProfile({ currentCountry: e.target.value })}
                  placeholder="e.g., United States"
                />
              </div>
            </div>
          </div>
        );

      case 'professional':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="career">Current Career/Job</Label>
              <Input
                id="career"
                value={profile.currentCareer}
                onChange={(e) => updateProfile({ currentCareer: e.target.value })}
                placeholder="e.g., Software Engineer, Teacher, Marketing Manager"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  value={profile.yearsExperience}
                  onChange={(e) => updateProfile({ yearsExperience: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="50"
                />
              </div>
              <div>
                <Label htmlFor="salary">Current Salary (USD)</Label>
                <Input
                  id="salary"
                  type="number"
                  value={profile.currentSalary}
                  onChange={(e) => updateProfile({ currentSalary: parseInt(e.target.value) || 50000 })}
                  min="0"
                  step="1000"
                />
              </div>
            </div>
            <SliderInput
              label="Career Satisfaction"
              value={profile.careerSatisfaction}
              onChange={(value: number) => updateProfile({ careerSatisfaction: value })}
            />
          </div>
        );

      case 'education':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="education">Highest Education</Label>
              <select
                id="education"
                value={profile.currentEducation}
                onChange={(e) => updateProfile({ currentEducation: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select education level</option>
                <option value="High School">High School</option>
                <option value="Some College">Some College</option>
                <option value="Associate's Degree">Associate's Degree</option>
                <option value="Bachelor's Degree">Bachelor's Degree</option>
                <option value="Master's Degree">Master's Degree</option>
                <option value="Doctoral Degree">Doctoral Degree</option>
                <option value="Professional Degree">Professional Degree</option>
              </select>
            </div>
            <div>
              <Label>Current Skills</Label>
              <MultiSelect
                options={SKILLS_OPTIONS}
                selected={profile.skills}
                onChange={(skills: string[]) => updateProfile({ skills })}
                placeholder="Select your key skills"
              />
            </div>
            <div>
              <Label htmlFor="learning">Learning Goals</Label>
              <Textarea
                id="learning"
                value={profile.learningGoals.join(', ')}
                onChange={(e) => updateProfile({ learningGoals: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                placeholder="What do you want to learn? (comma-separated)"
                rows={3}
              />
            </div>
          </div>
        );

      case 'personal':
        return (
          <div className="space-y-6">
            <div>
              <Label>Relationship Status</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  { value: 'single', label: 'Single' },
                  { value: 'dating', label: 'Dating' },
                  { value: 'married', label: 'Married' },
                  { value: 'complicated', label: 'It\'s Complicated' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateProfile({ relationshipStatus: option.value as any })}
                    className={`p-3 rounded-lg border transition-colors ${
                      profile.relationshipStatus === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Living Situation</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  { value: 'alone', label: 'Live Alone' },
                  { value: 'roommates', label: 'With Roommates' },
                  { value: 'family', label: 'With Family' },
                  { value: 'partner', label: 'With Partner' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateProfile({ livingSituation: option.value as any })}
                    className={`p-3 rounded-lg border transition-colors ${
                      profile.livingSituation === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="children"
                checked={profile.hasChildren}
                onChange={(e) => updateProfile({ hasChildren: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <Label htmlFor="children">I have children</Label>
            </div>
          </div>
        );

      case 'values':
        return (
          <div className="space-y-6">
            <div>
              <Label>Core Values</Label>
              <p className="text-sm text-gray-500 mb-4">Select what matters most to you (choose 3-7)</p>
              <MultiSelect
                options={VALUES_OPTIONS}
                selected={profile.values}
                onChange={(values: string[]) => updateProfile({ values })}
                placeholder="Select your core values"
              />
            </div>
            <div>
              <Label>Risk Tolerance</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { value: 'low', label: 'Conservative', desc: 'Prefer stability' },
                  { value: 'medium', label: 'Balanced', desc: 'Some calculated risks' },
                  { value: 'high', label: 'Adventurous', desc: 'Embrace uncertainty' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateProfile({ riskTolerance: option.value as any })}
                    className={`p-3 rounded-lg border transition-colors text-center ${
                      profile.riskTolerance === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="shortTerm">Short-term Goals (1-2 years)</Label>
              <Textarea
                id="shortTerm"
                value={profile.shortTermGoals.join(', ')}
                onChange={(e) => updateProfile({ shortTermGoals: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                placeholder="Learn Spanish, Get promoted, Buy a house... (comma-separated)"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="longTerm">Long-term Goals (5+ years)</Label>
              <Textarea
                id="longTerm"
                value={profile.longTermGoals.join(', ')}
                onChange={(e) => updateProfile({ longTermGoals: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                placeholder="Start own business, Travel the world, Write a book... (comma-separated)"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="destinations">Dream Destinations</Label>
              <Textarea
                id="destinations"
                value={profile.dreamDestinations.join(', ')}
                onChange={(e) => updateProfile({ dreamDestinations: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                placeholder="Tokyo, Paris, New Zealand... (comma-separated)"
                rows={2}
              />
            </div>
          </div>
        );

      case 'lifestyle':
        return (
          <div className="space-y-6">
            <SliderInput
              label="Work-Life Balance Importance"
              value={profile.workLifeBalance}
              onChange={(value: number) => updateProfile({ workLifeBalance: value })}
            />
            <SliderInput
              label="Health & Fitness Focus"
              value={profile.healthFocus}
              onChange={(value: number) => updateProfile({ healthFocus: value })}
            />
            <SliderInput
              label="Social Life Importance"
              value={profile.socialLife}
              onChange={(value: number) => updateProfile({ socialLife: value })}
            />
            <SliderInput
              label="Adventure Seeking"
              value={profile.adventureSeeker}
              onChange={(value: number) => updateProfile({ adventureSeeker: value })}
            />
            <SliderInput
              label="Creativity Importance"
              value={profile.creativityImportance}
              onChange={(value: number) => updateProfile({ creativityImportance: value })}
            />
            <SliderInput
              label="Stability Importance"
              value={profile.stabilityImportance}
              onChange={(value: number) => updateProfile({ stabilityImportance: value })}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    const step = STEPS[currentStep];
    switch (step.id) {
      case 'basic':
        return profile.name && profile.currentCity && profile.currentCountry;
      case 'professional':
        return profile.currentCareer;
      case 'education':
        return profile.currentEducation;
      case 'values':
        return profile.values.length >= 3;
      default:
        return true;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create Your Profile</h2>
                <p className="text-sm text-gray-500">
                  Help us personalize your parallel life scenarios
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {STEPS.length}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center space-x-2">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index <= currentStep 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={`w-8 h-1 mx-1 ${
                        index < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              {STEPS.map((step, index) => (
                <span key={step.id} className={index <= currentStep ? 'text-blue-600' : ''}>
                  {step.title}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {STEPS[currentStep].title}
                </h3>
              </div>
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={currentStep === 0 ? onClose : () => setCurrentStep(prev => prev - 1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 0 ? 'Cancel' : 'Previous'}
          </Button>
          
          <div className="flex space-x-3">
            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canProceed()}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={() => onComplete(profile)}
                disabled={!canProceed()}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Complete Profile
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
