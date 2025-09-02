'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, MapPin, Briefcase, Calendar, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface UserProfile {
  name: string;
  age: number;
  currentCity: string;
  currentCareer: string;
  interests: string[];
  goals: string;
  riskTolerance: 'low' | 'medium' | 'high';
  values: string[];
}

interface UserProfileSetupProps {
  initialProfile?: UserProfile;
  onComplete: (profile: UserProfile) => void;
  onClose: () => void;
}

export function UserProfileSetup({ initialProfile, onComplete, onClose }: UserProfileSetupProps) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile || {
    name: '',
    age: 25,
    currentCity: '',
    currentCareer: '',
    interests: [],
    goals: '',
    riskTolerance: 'medium',
    values: []
  });

  const [interestInput, setInterestInput] = useState('');
  const [valueInput, setValueInput] = useState('');

  const handleAddInterest = () => {
    if (interestInput.trim() && !profile.interests.includes(interestInput.trim())) {
      setProfile({
        ...profile,
        interests: [...profile.interests, interestInput.trim()]
      });
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setProfile({
      ...profile,
      interests: profile.interests.filter(i => i !== interest)
    });
  };

  const handleAddValue = () => {
    if (valueInput.trim() && !profile.values.includes(valueInput.trim())) {
      setProfile({
        ...profile,
        values: [...profile.values, valueInput.trim()]
      });
      setValueInput('');
    }
  };

  const handleRemoveValue = (value: string) => {
    setProfile({
      ...profile,
      values: profile.values.filter(v => v !== value)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(profile);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-parallel-500" />
              <CardTitle>User Profile Setup</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 25 })}
                    min="18"
                    max="100"
                  />
                </div>
              </div>

              {/* Location & Career */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Current City</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="city"
                      value={profile.currentCity}
                      onChange={(e) => setProfile({ ...profile, currentCity: e.target.value })}
                      placeholder="San Francisco, CA"
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="career">Current Career</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="career"
                      value={profile.currentCareer}
                      onChange={(e) => setProfile({ ...profile, currentCareer: e.target.value })}
                      placeholder="Software Engineer"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Risk Tolerance */}
              <div>
                <Label>Risk Tolerance</Label>
                <div className="flex space-x-4 mt-2">
                  {(['low', 'medium', 'high'] as const).map((level) => (
                    <label key={level} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="riskTolerance"
                        value={level}
                        checked={profile.riskTolerance === level}
                        onChange={(e) => setProfile({ ...profile, riskTolerance: e.target.value as any })}
                        className="text-parallel-500"
                      />
                      <span className="capitalize">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div>
                <Label>Interests & Hobbies</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    placeholder="Add an interest"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
                  />
                  <Button type="button" onClick={handleAddInterest} variant="outline">
                    Add
                  </Button>
                </div>
                {profile.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {profile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-parallel-100 text-parallel-700"
                      >
                        {interest}
                        <button
                          type="button"
                          onClick={() => handleRemoveInterest(interest)}
                          className="ml-2 text-parallel-500 hover:text-parallel-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Values */}
              <div>
                <Label>Core Values</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    value={valueInput}
                    onChange={(e) => setValueInput(e.target.value)}
                    placeholder="Add a core value"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddValue())}
                  />
                  <Button type="button" onClick={handleAddValue} variant="outline">
                    Add
                  </Button>
                </div>
                {profile.values.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {profile.values.map((value) => (
                      <span
                        key={value}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-alternate-100 text-alternate-700"
                      >
                        {value}
                        <button
                          type="button"
                          onClick={() => handleRemoveValue(value)}
                          className="ml-2 text-alternate-500 hover:text-alternate-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Goals */}
              <div>
                <Label htmlFor="goals">Life Goals & Aspirations</Label>
                <Textarea
                  id="goals"
                  value={profile.goals}
                  onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
                  placeholder="What do you hope to achieve in life?"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient">
                  <Heart className="w-4 h-4 mr-2" />
                  Save Profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
