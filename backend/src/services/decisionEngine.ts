import { logger } from '../utils/logger';

export interface DecisionPoint {
  id: string;
  title: string;
  description: string;
  category: 'career' | 'location' | 'education' | 'lifestyle' | 'relationship' | 'personality';
  options: DecisionOption[];
  impact: 'low' | 'medium' | 'high';
  timeframe: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  prerequisites?: string[];
  consequences: string[];
}

export interface DecisionOption {
  id: string;
  title: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  potentialOutcomes: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  requiredResources: string[];
  timeToImpact: number; // months
}

export interface UserProfile {
  name: string;
  age: number;
  currentCity: string;
  currentCountry: string;
  currentCareer: string;
  yearsExperience: number;
  currentSalary: number;
  careerSatisfaction: number;
  currentEducation: string;
  skills: string[];
  learningGoals: string[];
  relationshipStatus: 'single' | 'dating' | 'married' | 'complicated';
  hasChildren: boolean;
  livingSituation: 'alone' | 'roommates' | 'family' | 'partner';
  values: string[];
  riskTolerance: 'low' | 'medium' | 'high';
  priorities: string[];
  shortTermGoals: string[];
  longTermGoals: string[];
  dreamDestinations: string[];
  workLifeBalance: number;
  healthFocus: number;
  socialLife: number;
  adventureSeeker: number;
  creativityImportance: number;
  stabilityImportance: number;
}

export class DecisionEngine {
  /**
   * Generate personalized decision points based on user profile and current scenario
   */
  generateDecisionPoints(
    userProfile: UserProfile,
    currentScenario: any,
    depth: number
  ): DecisionPoint[] {
    const decisions: DecisionPoint[] = [];

    // Career-based decisions
    if (this.shouldGenerateCareerDecisions(userProfile, currentScenario, depth)) {
      decisions.push(...this.generateCareerDecisions(userProfile, currentScenario));
    }

    // Location-based decisions
    if (this.shouldGenerateLocationDecisions(userProfile, currentScenario, depth)) {
      decisions.push(...this.generateLocationDecisions(userProfile, currentScenario));
    }

    // Education decisions
    if (this.shouldGenerateEducationDecisions(userProfile, currentScenario, depth)) {
      decisions.push(...this.generateEducationDecisions(userProfile, currentScenario));
    }

    // Lifestyle decisions
    if (this.shouldGenerateLifestyleDecisions(userProfile, currentScenario, depth)) {
      decisions.push(...this.generateLifestyleDecisions(userProfile, currentScenario));
    }

    // Relationship decisions
    if (this.shouldGenerateRelationshipDecisions(userProfile, currentScenario, depth)) {
      decisions.push(...this.generateRelationshipDecisions(userProfile, currentScenario));
    }

    // Personal growth decisions
    decisions.push(...this.generatePersonalGrowthDecisions(userProfile, currentScenario));

    // Sort by relevance and impact
    return this.rankDecisionsByRelevance(decisions, userProfile);
  }

  private shouldGenerateLocationDecisions(profile: UserProfile, scenario: any, depth: number): boolean {
    return (
      profile.adventureSeeker >= 6 ||
      profile.dreamDestinations.length > 0 ||
      depth % 4 === 0 // Every 4th level
    );
  }

  private shouldGenerateEducationDecisions(profile: UserProfile, scenario: any, depth: number): boolean {
    return (
      profile.values.includes('Learning') ||
      profile.learningGoals.length > 0 ||
      depth % 5 === 0 // Every 5th level
    );
  }

  private shouldGenerateLifestyleDecisions(profile: UserProfile, scenario: any, depth: number): boolean {
    return (
      profile.workLifeBalance < 6 ||
      profile.healthFocus >= 6 ||
      profile.adventureSeeker >= 7 ||
      depth % 3 === 1 // Offset pattern
    );
  }

  private shouldGenerateRelationshipDecisions(profile: UserProfile, scenario: any, depth: number): boolean {
    return (
      profile.values.includes('Family') ||
      profile.relationshipStatus === 'dating' ||
      (!profile.hasChildren && profile.values.includes('Family')) ||
      depth % 6 === 0 // Every 6th level
    );
  }

  private shouldGenerateCareerDecisions(profile: UserProfile, scenario: any, depth: number): boolean {
    return (
      profile.careerSatisfaction < 7 ||
      profile.values.includes('Career Growth') ||
      depth % 3 === 0 // Every 3rd level
    );
  }

  private generateCareerDecisions(profile: UserProfile, scenario: any): DecisionPoint[] {
    const decisions: DecisionPoint[] = [];

    // Career change decision
    if (profile.careerSatisfaction < 6) {
      decisions.push({
        id: 'career-change',
        title: 'Major Career Pivot',
        description: `Consider switching from ${profile.currentCareer} to a field that better aligns with your values and interests.`,
        category: 'career',
        impact: 'high',
        timeframe: 'long-term',
        options: this.generateCareerChangeOptions(profile),
        consequences: [
          'Significant income change',
          'New skill requirements',
          'Different work environment',
          'Changed daily routine'
        ]
      });
    }

    // Entrepreneurship decision
    if (profile.riskTolerance !== 'low' && profile.values.includes('Independence')) {
      decisions.push({
        id: 'start-business',
        title: 'Start Your Own Business',
        description: 'Launch a business in an area you\'re passionate about.',
        category: 'career',
        impact: 'high',
        timeframe: 'long-term',
        options: this.generateEntrepreneurshipOptions(profile),
        consequences: [
          'Financial uncertainty',
          'Complete schedule control',
          'Potential for unlimited growth',
          'High stress and responsibility'
        ]
      });
    }

    // Skill development decision
    if (profile.learningGoals.length > 0) {
      decisions.push({
        id: 'skill-development',
        title: 'Major Skill Development',
        description: 'Invest significant time in developing new professional skills.',
        category: 'career',
        impact: 'medium',
        timeframe: 'short-term',
        options: this.generateSkillDevelopmentOptions(profile),
        consequences: [
          'Time investment required',
          'Potential career advancement',
          'Increased marketability',
          'Personal satisfaction'
        ]
      });
    }

    return decisions;
  }

  private generateLocationDecisions(profile: UserProfile, scenario: any): DecisionPoint[] {
    const decisions: DecisionPoint[] = [];

    // International move
    if (profile.adventureSeeker >= 6 && profile.dreamDestinations.length > 0) {
      decisions.push({
        id: 'international-move',
        title: 'Move to Dream Destination',
        description: 'Relocate to one of your dream destinations and start a new chapter.',
        category: 'location',
        impact: 'high',
        timeframe: 'long-term',
        options: this.generateInternationalMoveOptions(profile),
        consequences: [
          'Cultural adaptation required',
          'Potential language barriers',
          'New social network needed',
          'Different cost of living'
        ]
      });
    }

    // Urban vs rural decision
    decisions.push({
      id: 'urban-rural-shift',
      title: 'Change Living Environment',
      description: 'Move between urban and rural environments for a different lifestyle.',
      category: 'location',
      impact: 'medium',
      timeframe: 'medium-term',
      options: this.generateUrbanRuralOptions(profile),
      consequences: [
        'Different pace of life',
        'Changed commute and transportation',
        'New community dynamics',
        'Different cost structure'
      ]
    });

    return decisions;
  }

  private generateEducationDecisions(profile: UserProfile, scenario: any): DecisionPoint[] {
    const decisions: DecisionPoint[] = [];

    // Advanced degree
    if (profile.values.includes('Learning') && !profile.currentEducation.includes('Master') && !profile.currentEducation.includes('Doctoral')) {
      decisions.push({
        id: 'advanced-degree',
        title: 'Pursue Advanced Degree',
        description: 'Go back to school for a Master\'s or Doctoral degree.',
        category: 'education',
        impact: 'high',
        timeframe: 'long-term',
        options: this.generateAdvancedDegreeOptions(profile),
        consequences: [
          'Significant time commitment',
          'Educational debt potential',
          'Career advancement opportunities',
          'Delayed income growth'
        ]
      });
    }

    // Career bootcamp/certification
    decisions.push({
      id: 'intensive-training',
      title: 'Intensive Skill Training',
      description: 'Complete an intensive bootcamp or certification program.',
      category: 'education',
      impact: 'medium',
      timeframe: 'short-term',
      options: this.generateIntensiveTrainingOptions(profile),
      consequences: [
        'Rapid skill acquisition',
        'Career pivot opportunity',
        'Networking opportunities',
        'Time and financial investment'
      ]
    });

    return decisions;
  }

  private generateLifestyleDecisions(profile: UserProfile, scenario: any): DecisionPoint[] {
    const decisions: DecisionPoint[] = [];

    // Digital nomad lifestyle
    if (profile.adventureSeeker >= 7 && profile.riskTolerance !== 'low') {
      decisions.push({
        id: 'digital-nomad',
        title: 'Become a Digital Nomad',
        description: 'Work remotely while traveling the world.',
        category: 'lifestyle',
        impact: 'high',
        timeframe: 'medium-term',
        options: this.generateDigitalNomadOptions(profile),
        consequences: [
          'Location independence',
          'Constant adaptation required',
          'Unique experiences',
          'Relationship challenges'
        ]
      });
    }

    // Health and wellness focus
    if (profile.healthFocus >= 6) {
      decisions.push({
        id: 'wellness-lifestyle',
        title: 'Wellness-Centered Lifestyle',
        description: 'Restructure your life around health and wellness priorities.',
        category: 'lifestyle',
        impact: 'medium',
        timeframe: 'medium-term',
        options: this.generateWellnessLifestyleOptions(profile),
        consequences: [
          'Improved physical health',
          'Better mental wellbeing',
          'Potential career adjustments',
          'Social circle changes'
        ]
      });
    }

    return decisions;
  }

  private generateRelationshipDecisions(profile: UserProfile, scenario: any): DecisionPoint[] {
    const decisions: DecisionPoint[] = [];

    // Marriage/partnership decision
    if (profile.relationshipStatus === 'dating' && profile.values.includes('Family')) {
      decisions.push({
        id: 'marriage-commitment',
        title: 'Marriage or Long-term Commitment',
        description: 'Take your current relationship to the next level.',
        category: 'relationship',
        impact: 'high',
        timeframe: 'medium-term',
        options: this.generateMarriageOptions(profile),
        consequences: [
          'Shared life decisions',
          'Financial interdependence',
          'Emotional security',
          'Reduced individual flexibility'
        ]
      });
    }

    // Starting a family
    if ((profile.relationshipStatus === 'married' || profile.relationshipStatus === 'dating') && 
        !profile.hasChildren && profile.values.includes('Family')) {
      decisions.push({
        id: 'start-family',
        title: 'Start a Family',
        description: 'Begin the journey of parenthood.',
        category: 'relationship',
        impact: 'high',
        timeframe: 'long-term',
        options: this.generateFamilyOptions(profile),
        consequences: [
          'Major lifestyle changes',
          'Financial responsibilities',
          'Deep personal fulfillment',
          'Career impact considerations'
        ]
      });
    }

    return decisions;
  }

  private generatePersonalGrowthDecisions(profile: UserProfile, scenario: any): DecisionPoint[] {
    const decisions: DecisionPoint[] = [];

    // Leadership development
    if (profile.skills.includes('Leadership') || profile.longTermGoals.some(goal => 
        goal.toLowerCase().includes('lead') || goal.toLowerCase().includes('manage'))) {
      decisions.push({
        id: 'leadership-development',
        title: 'Leadership Development Journey',
        description: 'Focus on developing your leadership capabilities.',
        category: 'personality',
        impact: 'medium',
        timeframe: 'medium-term',
        options: this.generateLeadershipOptions(profile),
        consequences: [
          'Increased responsibility',
          'Better team dynamics',
          'Career advancement',
          'Personal confidence growth'
        ]
      });
    }

    // Creative pursuit
    if (profile.creativityImportance >= 6) {
      decisions.push({
        id: 'creative-pursuit',
        title: 'Serious Creative Pursuit',
        description: 'Dedicate significant time to a creative passion.',
        category: 'personality',
        impact: 'medium',
        timeframe: 'medium-term',
        options: this.generateCreativeOptions(profile),
        consequences: [
          'Personal fulfillment',
          'Potential income source',
          'Time management challenges',
          'New social connections'
        ]
      });
    }

    return decisions;
  }

  // Option generation methods
  private generateCareerChangeOptions(profile: UserProfile): DecisionOption[] {
    const options: DecisionOption[] = [];

    // Tech transition (popular career change)
    if (!profile.currentCareer.toLowerCase().includes('software') && 
        !profile.currentCareer.toLowerCase().includes('tech')) {
      options.push({
        id: 'tech-transition',
        title: 'Transition to Tech',
        description: 'Learn programming and transition to a software development role.',
        riskLevel: 'medium',
        potentialOutcomes: {
          positive: ['Higher salary potential', 'Remote work opportunities', 'Growing industry'],
          negative: ['Steep learning curve', 'Ageism concerns', 'Highly competitive'],
          neutral: ['Different work culture', 'Continuous learning required']
        },
        requiredResources: ['Time for learning', 'Bootcamp or courses', 'Portfolio development'],
        timeToImpact: 12
      });
    }

    // Teaching/education
    if (profile.values.includes('Community') && profile.skills.includes('Communication')) {
      options.push({
        id: 'education-career',
        title: 'Move into Education',
        description: 'Become a teacher or educational professional.',
        riskLevel: 'low',
        potentialOutcomes: {
          positive: ['Meaningful impact', 'Job security', 'Summers off'],
          negative: ['Lower salary', 'Bureaucracy', 'Challenging students'],
          neutral: ['Structured schedule', 'Continuous professional development']
        },
        requiredResources: ['Teaching certification', 'Education degree', 'Student teaching'],
        timeToImpact: 18
      });
    }

    return options;
  }

  private generateEntrepreneurshipOptions(profile: UserProfile): DecisionOption[] {
    return [
      {
        id: 'consulting-business',
        title: 'Start Consulting Business',
        description: `Launch a consulting business in ${profile.currentCareer.toLowerCase()}.`,
        riskLevel: profile.riskTolerance === 'high' ? 'medium' : 'high',
        potentialOutcomes: {
          positive: ['Higher income potential', 'Flexible schedule', 'Industry expertise'],
          negative: ['Irregular income', 'Client acquisition challenges', 'No benefits'],
          neutral: ['Self-directed work', 'Networking requirements']
        },
        requiredResources: ['Business registration', 'Marketing materials', 'Emergency fund'],
        timeToImpact: 6
      },
      {
        id: 'online-business',
        title: 'Launch Online Business',
        description: 'Create an online business around your skills and interests.',
        riskLevel: 'medium',
        potentialOutcomes: {
          positive: ['Global reach', 'Scalable income', 'Location independence'],
          negative: ['Market saturation', 'Technical challenges', 'Isolation'],
          neutral: ['Digital marketing focus', 'Continuous adaptation needed']
        },
        requiredResources: ['Website development', 'Digital marketing budget', 'Product development'],
        timeToImpact: 9
      }
    ];
  }

  private generateSkillDevelopmentOptions(profile: UserProfile): DecisionOption[] {
    const options: DecisionOption[] = [];

    profile.learningGoals.forEach(goal => {
      options.push({
        id: `skill-${goal.toLowerCase().replace(/\s+/g, '-')}`,
        title: `Master ${goal}`,
        description: `Become proficient in ${goal} through dedicated study and practice.`,
        riskLevel: 'low',
        potentialOutcomes: {
          positive: ['Career advancement', 'Increased marketability', 'Personal satisfaction'],
          negative: ['Time investment', 'Potential obsolescence', 'Learning curve'],
          neutral: ['Continuous practice required', 'Certification opportunities']
        },
        requiredResources: ['Learning materials', 'Practice time', 'Possible mentorship'],
        timeToImpact: 6
      });
    });

    return options;
  }

  private generateInternationalMoveOptions(profile: UserProfile): DecisionOption[] {
    return profile.dreamDestinations.slice(0, 3).map(destination => ({
      id: `move-${destination.toLowerCase().replace(/\s+/g, '-')}`,
      title: `Move to ${destination}`,
      description: `Relocate to ${destination} and experience a new culture.`,
      riskLevel: profile.riskTolerance === 'low' ? 'high' : 'medium',
      potentialOutcomes: {
        positive: ['Cultural enrichment', 'New opportunities', 'Personal growth'],
        negative: ['Culture shock', 'Language barriers', 'Visa complications'],
        neutral: ['Different cost of living', 'New social networks needed']
      },
      requiredResources: ['Visa/work permit', 'Moving expenses', 'Emergency fund'],
      timeToImpact: 12
    }));
  }

  private generateUrbanRuralOptions(profile: UserProfile): DecisionOption[] {
    const isCurrentlyUrban = ['New York', 'Los Angeles', 'Chicago', 'San Francisco', 'Boston']
      .some(city => profile.currentCity.includes(city));

    return [
      {
        id: isCurrentlyUrban ? 'move-rural' : 'move-urban',
        title: isCurrentlyUrban ? 'Move to Rural Area' : 'Move to Major City',
        description: isCurrentlyUrban 
          ? 'Experience the peace and simplicity of rural living.'
          : 'Embrace the energy and opportunities of city life.',
        riskLevel: 'medium',
        potentialOutcomes: {
          positive: isCurrentlyUrban 
            ? ['Lower cost of living', 'Closer to nature', 'Stronger community']
            : ['More opportunities', 'Cultural diversity', 'Better amenities'],
          negative: isCurrentlyUrban
            ? ['Fewer job opportunities', 'Limited amenities', 'Potential isolation']
            : ['Higher cost of living', 'More stress', 'Less personal space'],
          neutral: ['Different pace of life', 'New social dynamics']
        },
        requiredResources: ['Moving expenses', 'Job search', 'Housing deposit'],
        timeToImpact: 6
      }
    ];
  }

  private generateAdvancedDegreeOptions(profile: UserProfile): DecisionOption[] {
    return [
      {
        id: 'mba',
        title: 'Master of Business Administration',
        description: 'Pursue an MBA to advance your business and leadership skills.',
        riskLevel: 'medium',
        potentialOutcomes: {
          positive: ['Leadership opportunities', 'Higher salary', 'Professional network'],
          negative: ['Student debt', 'Time away from work', 'Opportunity cost'],
          neutral: ['Career pivot opportunity', 'Academic environment']
        },
        requiredResources: ['GMAT preparation', 'Application fees', 'Tuition funding'],
        timeToImpact: 24
      },
      {
        id: 'masters-field',
        title: `Master's in ${profile.currentCareer}`,
        description: `Deepen your expertise with an advanced degree in your field.`,
        riskLevel: 'low',
        potentialOutcomes: {
          positive: ['Subject matter expertise', 'Career advancement', 'Research opportunities'],
          negative: ['Specialization limits', 'Academic debt', 'Time commitment'],
          neutral: ['Academic credentials', 'Theoretical knowledge']
        },
        requiredResources: ['GRE preparation', 'Research experience', 'Academic references'],
        timeToImpact: 24
      }
    ];
  }

  private generateIntensiveTrainingOptions(profile: UserProfile): DecisionOption[] {
    return [
      {
        id: 'coding-bootcamp',
        title: 'Coding Bootcamp',
        description: 'Intensive programming bootcamp to quickly gain technical skills.',
        riskLevel: 'medium',
        potentialOutcomes: {
          positive: ['Quick skill acquisition', 'Career change opportunity', 'High demand skills'],
          negative: ['Intense pace', 'No guarantee of job', 'Limited depth'],
          neutral: ['Practical focus', 'Networking opportunities']
        },
        requiredResources: ['Bootcamp tuition', 'Full-time commitment', 'Basic computer skills'],
        timeToImpact: 4
      }
    ];
  }

  private generateDigitalNomadOptions(profile: UserProfile): DecisionOption[] {
    return [
      {
        id: 'remote-work-travel',
        title: 'Remote Work + Travel',
        description: 'Negotiate remote work and travel while maintaining your career.',
        riskLevel: 'medium',
        potentialOutcomes: {
          positive: ['Location freedom', 'Cultural experiences', 'Personal growth'],
          negative: ['Time zone challenges', 'Isolation', 'Relationship strain'],
          neutral: ['Constant adaptation', 'Minimalist lifestyle']
        },
        requiredResources: ['Remote work agreement', 'Travel budget', 'Reliable internet'],
        timeToImpact: 3
      }
    ];
  }

  private generateWellnessLifestyleOptions(profile: UserProfile): DecisionOption[] {
    return [
      {
        id: 'wellness-focused',
        title: 'Wellness-Centered Life',
        description: 'Restructure your life around health, fitness, and mental wellbeing.',
        riskLevel: 'low',
        potentialOutcomes: {
          positive: ['Better health', 'Increased energy', 'Mental clarity'],
          negative: ['Social limitations', 'Potential income impact', 'Lifestyle restrictions'],
          neutral: ['New routines', 'Different social circles']
        },
        requiredResources: ['Gym membership', 'Healthy food budget', 'Time for exercise'],
        timeToImpact: 6
      }
    ];
  }

  private generateMarriageOptions(profile: UserProfile): DecisionOption[] {
    return [
      {
        id: 'marriage-commitment',
        title: 'Get Married',
        description: 'Commit to marriage with your current partner.',
        riskLevel: 'low',
        potentialOutcomes: {
          positive: ['Emotional security', 'Shared goals', 'Tax benefits'],
          negative: ['Less individual freedom', 'Financial entanglement', 'Divorce risk'],
          neutral: ['Shared responsibilities', 'Family expectations']
        },
        requiredResources: ['Wedding budget', 'Legal preparation', 'Relationship counseling'],
        timeToImpact: 12
      }
    ];
  }

  private generateFamilyOptions(profile: UserProfile): DecisionOption[] {
    return [
      {
        id: 'have-children',
        title: 'Start Having Children',
        description: 'Begin the journey of parenthood.',
        riskLevel: 'medium',
        potentialOutcomes: {
          positive: ['Deep fulfillment', 'Family legacy', 'Personal growth'],
          negative: ['Financial burden', 'Career impact', 'Sleep deprivation'],
          neutral: ['Lifestyle changes', 'New priorities']
        },
        requiredResources: ['Financial stability', 'Healthcare coverage', 'Support system'],
        timeToImpact: 18
      }
    ];
  }

  private generateLeadershipOptions(profile: UserProfile): DecisionOption[] {
    return [
      {
        id: 'leadership-role',
        title: 'Pursue Leadership Position',
        description: 'Actively seek management or leadership roles.',
        riskLevel: 'medium',
        potentialOutcomes: {
          positive: ['Higher salary', 'Greater impact', 'Skill development'],
          negative: ['More stress', 'Difficult decisions', 'Work-life balance'],
          neutral: ['Different responsibilities', 'Team management']
        },
        requiredResources: ['Leadership training', 'Mentorship', 'Performance track record'],
        timeToImpact: 12
      }
    ];
  }

  private generateCreativeOptions(profile: UserProfile): DecisionOption[] {
    return [
      {
        id: 'creative-side-business',
        title: 'Serious Creative Pursuit',
        description: 'Dedicate significant time to developing your creative talents.',
        riskLevel: 'medium',
        potentialOutcomes: {
          positive: ['Personal fulfillment', 'Potential income', 'Artistic growth'],
          negative: ['Time investment', 'Uncertain returns', 'Market challenges'],
          neutral: ['New skills', 'Creative community']
        },
        requiredResources: ['Creative supplies', 'Learning resources', 'Practice time'],
        timeToImpact: 9
      }
    ];
  }

  private rankDecisionsByRelevance(decisions: DecisionPoint[], profile: UserProfile): DecisionPoint[] {
    return decisions.sort((a, b) => {
      let scoreA = this.calculateRelevanceScore(a, profile);
      let scoreB = this.calculateRelevanceScore(b, profile);
      return scoreB - scoreA;
    }).slice(0, 6); // Return top 6 most relevant decisions
  }

  private calculateRelevanceScore(decision: DecisionPoint, profile: UserProfile): number {
    let score = 0;

    // Impact weight
    if (decision.impact === 'high') score += 3;
    else if (decision.impact === 'medium') score += 2;
    else score += 1;

    // Risk tolerance alignment
    const riskLevels = decision.options.map(opt => opt.riskLevel);
    if (riskLevels.includes(profile.riskTolerance)) score += 2;

    // Values alignment
    const decisionKeywords = (decision.title + ' ' + decision.description).toLowerCase();
    profile.values.forEach(value => {
      if (decisionKeywords.includes(value.toLowerCase())) score += 1;
    });

    // Goals alignment
    [...profile.shortTermGoals, ...profile.longTermGoals].forEach(goal => {
      if (decisionKeywords.includes(goal.toLowerCase())) score += 1;
    });

    return score;
  }
}

export const decisionEngine = new DecisionEngine();
