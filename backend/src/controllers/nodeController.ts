import { Request, Response } from 'express';
import { LifeNode, LifeSession } from '@/models';
import { 
  ApiResponse, 
  CreateNodeRequest,
  NotFoundError,
  ValidationError,
  ExternalAPIError 
} from '@/types';
import { logger } from '../utils/logger';
import { 
  geminiService,
  teleportService,
  climateService,
  unsplashService
} from '@/services';
import { generatePDF } from '../utils/pdf';

class NodeController {
  async createNode(req: Request<{ sessionId: string }, ApiResponse, CreateNodeRequest>, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { parentNodeId, choice, userPreferences } = req.body;

      logger.info('Creating new life node:', { sessionId, parentNodeId, choice });

      // Validate session exists
      const session = await LifeSession.findById(sessionId);
      if (!session) {
        throw new NotFoundError('Session not found');
      }

      // Validate parent node if provided
      let parentNode = null;
      if (parentNodeId) {
        parentNode = await LifeNode.findById(parentNodeId);
        if (!parentNode || parentNode.sessionId.toString() !== sessionId) {
          throw new ValidationError('Invalid parent node');
        }
      }

      // Calculate depth and order
      const depth = parentNode ? parentNode.depth + 1 : 0;
      const childrenCount = parentNode ? 
        await LifeNode.countDocuments({ parentNodeId }) : 0;

      // Check depth limits
      if (depth > 10) {
        throw new ValidationError('Maximum tree depth exceeded');
      }

      const node = await this.createNodeInternal({
        sessionId,
        parentNodeId,
        parentNode,
        depth,
        order: childrenCount,
        choice,
        baseContext: session.baseContext,
        userPreferences
      });

      // Update session statistics
      await this.updateSessionStats(sessionId);

      if (node) {
        const response: ApiResponse = {
          success: true,
          data: node.toJSON(),
          message: 'Node created successfully',
          timestamp: new Date().toISOString()
        };

        res.status(201).json(response);
      } else {
        throw new Error('Failed to create node');
      }
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        const response: ApiResponse = {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        res.status(error instanceof NotFoundError ? 404 : 400).json(response);
        return;
      }

      logger.error('Error creating node:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to create node',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  async createNodeInternal(params: {
    sessionId: string;
    parentNodeId?: string;
    parentNode?: any;
    depth: number;
    order: number;
    choice: any;
    baseContext?: any;
    userPreferences?: any;
  }) {
    const startTime = Date.now();
    
    // Create initial node with generating status
    const node = new LifeNode({
      sessionId: params.sessionId,
      parentNodeId: params.parentNodeId,
      depth: params.depth,
      order: params.order,
      choice: params.choice,
      status: 'generating',
      aiNarrative: {
        summary: 'Generating narrative...',
        chapters: [],
        milestones: [],
        tone: 'balanced',
        confidenceScore: 0.5,
        disclaimers: []
      },
      metrics: {
        city: { 
          name: 'Processing...', 
          country: 'Processing...' 
        },
        occupation: { 
          name: 'Processing...', 
          category: 'Processing...', 
          skillsRequired: [], 
          tasksTypical: [] 
        },
        finances: { 
          colIndex: 1, 
          currency: 'USD' 
        },
        qualityOfLifeIndex: 5,
        happinessScore: 5,
        workLifeBalance: 5,
        healthIndex: 5,
        socialIndex: 5,
        creativityIndex: 5,
        adventureIndex: 5
      },
      media: {
        coverPhoto: {
          url: 'https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=Generating...',
          credit: 'Placeholder Image',
          description: 'Generating cover image...'
        }
      }
    });

    await node.save();

    try {
      // Step 1: Normalize choice if needed
      let normalizedChoice = params.choice;
      if (this.needsNormalization(params.choice)) {
        const choiceText = this.extractChoiceText(params.choice);
        normalizedChoice = await geminiService.normalizeChoice(choiceText);
      }

      // Step 2: Get city metrics with fallback (inherit from parent if available)
      const cityName = normalizedChoice.locationChange?.city || 
                      params.parentNode?.metrics?.city?.name ||
                      params.baseContext?.currentCity || 'New York';
      const countryName = normalizedChoice.locationChange?.country || 
                         params.parentNode?.metrics?.city?.country ||
                         params.baseContext?.country || 'United States';

      let cityMetrics;
      try {
        cityMetrics = await teleportService.getCityMetrics(cityName, countryName);
      } catch (error) {
        logger.warn(`Teleport API unavailable, using fallback data for ${cityName}`);
        cityMetrics = this.getFallbackCityMetrics(cityName, countryName);
      }

      // Step 3: Get climate data with fallback
      try {
        const coordinates = await climateService.getCoordinatesFromCity(cityName, countryName);
        const climateData = await climateService.getClimateMetrics(
          coordinates.latitude, 
          coordinates.longitude
        );
        cityMetrics.coordinates = coordinates;
        cityMetrics.climate = climateData;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.warn(`Climate data not available for ${cityName}:`, errorMessage);
        // Climate data already included in fallback if using fallback city metrics
      }

      // Step 4: Get occupation metrics (inherit from parent if no career change)
      const occupationName = normalizedChoice.careerChange || 
                             params.parentNode?.metrics?.occupation?.name ||
                             'Software Developer';
      const occupationMetrics = await this.getOccupationMetrics(occupationName);

      // Step 5: Calculate financial metrics
      const financialMetrics = await this.calculateFinancialMetrics(
        occupationMetrics, 
        cityMetrics
      );

      // Step 6: Generate AI narrative with parent context
      let aiNarrative;
      try {
        const narrativeData = {
          choice: normalizedChoice,
          cityMetrics,
          occupationMetrics,
          financialMetrics,
          baseContext: params.baseContext,
          userPreferences: params.userPreferences,
          parentContext: params.parentNode ? {
            story: params.parentNode.aiNarrative?.summary,
            metrics: params.parentNode.metrics,
            depth: params.parentNode.depth,
            previousChoices: this.extractParentChoices(params.parentNode)
          } : null
        };
        aiNarrative = await geminiService.generateNarrative(narrativeData);
      } catch (error) {
        logger.warn(`Gemini API unavailable, using fallback narrative`);
        aiNarrative = this.getFallbackNarrative(normalizedChoice, cityName, occupationName, params.parentNode);
      }

      // Step 7: Get cover image with fallback
      let coverImage;
      try {
        coverImage = await unsplashService.getCoverImage(
          cityName,
          occupationName,
          normalizedChoice.lifestyleChange
        );
      } catch (error) {
        logger.warn(`Unsplash API unavailable, using fallback image`);
        coverImage = this.getFallbackCoverImage(cityName, occupationName);
      }

      // Step 8: Calculate composite metrics (with parent baseline)
      const qualityMetrics = this.calculateQualityMetrics(
        cityMetrics,
        occupationMetrics,
        financialMetrics,
        params.parentNode?.metrics // Pass parent metrics for baseline
      );

      // Step 9: Update node with all data
      const processingTime = Date.now() - startTime;
      
      await LifeNode.findByIdAndUpdate(node._id, {
        choice: normalizedChoice,
        aiNarrative,
        metrics: {
          city: cityMetrics,
          occupation: occupationMetrics,
          finances: financialMetrics,
          ...qualityMetrics
        },
        media: {
          coverPhoto: coverImage
        },
        processingTime,
        status: 'completed'
      });

      return await LifeNode.findById(node._id);
    } catch (error) {
      logger.error(`Error processing node ${node._id}:`, error);
      
      await LifeNode.findByIdAndUpdate(node._id, {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      });

      throw error;
    }
  }

  async getNode(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const node = await LifeNode.findById(id)
        .populate('children')
        .populate('parent')
        .lean();

      if (!node) {
        throw new NotFoundError('Node not found');
      }

      const response: ApiResponse = {
        success: true,
        data: node,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      if (error instanceof NotFoundError) {
        const response: ApiResponse = {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
        return;
      }

      logger.error('Error getting node:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to get node',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  async exportNode(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { format = 'pdf', includeImages = true, includeMetrics = true } = req.query as any;

      const node = await LifeNode.findById(id)
        .populate('parent')
        .lean();

      if (!node) {
        throw new NotFoundError('Node not found');
      }

      if (format === 'pdf') {
        const pdfBuffer = await generatePDF(node, { includeImages, includeMetrics });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="parallel-life-${id}.pdf"`);
        res.send(pdfBuffer);
      } else if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="parallel-life-${id}.json"`);
        res.json(node);
      } else {
        throw new ValidationError('Invalid export format. Use "pdf" or "json"');
      }
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        const response: ApiResponse = {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        res.status(error instanceof NotFoundError ? 404 : 400).json(response);
        return;
      }

      logger.error('Error exporting node:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to export node',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  private needsNormalization(choice: any): boolean {
    const hasString = Object.values(choice).some(value => 
      typeof value === 'string' && value.includes(' ')
    );
    return hasString;
  }

  private extractChoiceText(choice: any): string {
    const parts: string[] = [];
    
    if (choice.careerChange) parts.push(`Career: ${choice.careerChange}`);
    if (choice.locationChange?.city) {
      parts.push(`Location: ${choice.locationChange.city}, ${choice.locationChange.country || ''}`);
    }
    if (choice.educationChange) parts.push(`Education: ${choice.educationChange}`);
    if (choice.lifestyleChange) parts.push(`Lifestyle: ${choice.lifestyleChange}`);
    
    return parts.join('; ');
  }

  private async getOccupationMetrics(occupationName: string) {
    // This would integrate with O*NET API in production
    // For now, return structured data
    return {
      name: occupationName,
      category: this.getOccupationCategory(occupationName),
      demandIndex: Math.random() * 10,
      educationTypical: this.getTypicalEducation(occupationName),
      skillsRequired: this.getRequiredSkills(occupationName),
      tasksTypical: this.getTypicalTasks(occupationName),
      growthOutlook: this.getGrowthOutlook(occupationName),
      automationRisk: this.getAutomationRisk(occupationName),
      workLifeBalance: Math.random() * 10,
      stressLevel: Math.random() * 10
    };
  }

  private async calculateFinancialMetrics(occupationMetrics: any, cityMetrics: any) {
    const baseSalary = this.getBaseSalary(occupationMetrics.name);
    const colAdjustment = cityMetrics.teleportScores?.costOfLiving || 5;
    
    return {
      salaryLowUSD: Math.round(baseSalary * 0.8 * (colAdjustment / 5)),
      salaryHighUSD: Math.round(baseSalary * 1.5 * (colAdjustment / 5)),
      salaryMedianUSD: Math.round(baseSalary * (colAdjustment / 5)),
      colIndex: colAdjustment,
      currency: 'USD',
      savingsPotential: Math.max(0, 10 - colAdjustment),
      retirementAge: 65,
      financialSecurity: (colAdjustment < 6 ? 'high' : colAdjustment < 8 ? 'medium' : 'low') as 'low' | 'medium' | 'high'
    };
  }

  private calculateQualityMetrics(cityMetrics: any, occupationMetrics: any, financialMetrics: any, parentMetrics?: any) {
    const cityScores = cityMetrics.teleportScores || {};
    
    // Use parent metrics as baseline if available
    const baseHappiness = parentMetrics?.happinessScore || 5;
    const baseQuality = parentMetrics?.qualityOfLifeIndex || 5;
    const baseHealth = parentMetrics?.healthIndex || 5;
    const baseSocial = parentMetrics?.socialIndex || 5;
    const baseCreativity = parentMetrics?.creativityIndex || 5;
    const baseAdventure = parentMetrics?.adventureIndex || 5;
    
    // Calculate new metrics with some inheritance from parent
    const newQuality = this.weightedAverage([
      [cityScores.safety || 5, 0.25],
      [cityScores.healthcare || 5, 0.2],
      [cityScores.education || 5, 0.15],
      [cityScores.leisure || 5, 0.15],
      [occupationMetrics.workLifeBalance || 5, 0.15],
      [financialMetrics.savingsPotential || 5, 0.1]
    ]);
    
    const newHappiness = this.weightedAverage([
      [cityScores.leisure || 5, 0.3],
      [occupationMetrics.workLifeBalance || 5, 0.3],
      [cityScores.tolerance || 5, 0.2],
      [financialMetrics.savingsPotential || 5, 0.2]
    ]);
    
    return {
      qualityOfLifeIndex: parentMetrics ? this.blendWithParent(newQuality, baseQuality, 0.7) : newQuality,
      happinessScore: parentMetrics ? this.blendWithParent(newHappiness, baseHappiness, 0.7) : newHappiness,
      workLifeBalance: occupationMetrics.workLifeBalance || (parentMetrics?.workLifeBalance || 5),
      healthIndex: parentMetrics ? this.blendWithParent(
        this.weightedAverage([
          [cityScores.healthcare || 5, 0.4],
          [cityScores.safety || 5, 0.3],
          [cityMetrics.climate?.comfortIndex || 5, 0.3]
        ]), baseHealth, 0.6
      ) : this.weightedAverage([
        [cityScores.healthcare || 5, 0.4],
        [cityScores.safety || 5, 0.3],
        [cityMetrics.climate?.comfortIndex || 5, 0.3]
      ]),
      socialIndex: parentMetrics ? this.blendWithParent(
        this.weightedAverage([
          [cityScores.tolerance || 5, 0.4],
          [cityScores.leisure || 5, 0.3],
          [occupationMetrics.workLifeBalance || 5, 0.3]
        ]), baseSocial, 0.6
      ) : this.weightedAverage([
        [cityScores.tolerance || 5, 0.4],
        [cityScores.leisure || 5, 0.3],
        [occupationMetrics.workLifeBalance || 5, 0.3]
      ]),
      creativityIndex: parentMetrics ? this.blendWithParent(Math.random() * 10, baseCreativity, 0.5) : Math.random() * 10,
      adventureIndex: parentMetrics ? this.blendWithParent(Math.random() * 10, baseAdventure, 0.5) : Math.random() * 10
    };
  }

  private weightedAverage(values: [number, number][]): number {
    const sum = values.reduce((acc, [value, weight]) => acc + value * weight, 0);
    const totalWeight = values.reduce((acc, [, weight]) => acc + weight, 0);
    return Math.round((sum / totalWeight) * 10) / 10;
  }

  private async updateSessionStats(sessionId: string) {
    const [totalNodes, maxDepthResult] = await Promise.all([
      LifeNode.countDocuments({ sessionId }),
      LifeNode.aggregate([
        { $match: { sessionId } },
        { $group: { _id: null, maxDepth: { $max: '$depth' } } }
      ])
    ]);

    const maxDepth = maxDepthResult[0]?.maxDepth || 0;

    await LifeSession.findByIdAndUpdate(sessionId, {
      totalNodes,
      maxDepth
    });
  }

  // Helper methods for occupation data
  private getOccupationCategory(occupation: string): string {
    const categoryMap = {
      'software': 'Technology',
      'doctor': 'Healthcare',
      'teacher': 'Education',
      'artist': 'Arts & Entertainment',
      'engineer': 'Engineering',
      'lawyer': 'Legal',
      'writer': 'Arts & Entertainment',
      'musician': 'Arts & Entertainment'
    };

    const key = Object.keys(categoryMap).find(k => 
      occupation.toLowerCase().includes(k)
    );
    
    return categoryMap[key as keyof typeof categoryMap] || 'Professional';
  }

  private getTypicalEducation(occupation: string): string {
    const educationMap = {
      'doctor': "Doctor's degree",
      'lawyer': 'Professional degree',
      'engineer': "Bachelor's degree",
      'teacher': "Bachelor's degree",
      'artist': 'Some college',
      'musician': 'Some college',
      'software': "Bachelor's degree"
    };

    const key = Object.keys(educationMap).find(k => 
      occupation.toLowerCase().includes(k)
    );
    
    return educationMap[key as keyof typeof educationMap] || "Bachelor's degree";
  }

  private getRequiredSkills(occupation: string): string[] {
    // This would come from O*NET API in production
    return ['Critical Thinking', 'Problem Solving', 'Communication', 'Teamwork'];
  }

  private getTypicalTasks(occupation: string): string[] {
    // This would come from O*NET API in production
    return ['Analyze requirements', 'Develop solutions', 'Collaborate with teams', 'Document processes'];
  }

  private getGrowthOutlook(occupation: string): 'declining' | 'stable' | 'growing' | 'rapid' {
    const techRelated = occupation.toLowerCase().includes('software') || 
                       occupation.toLowerCase().includes('engineer');
    return techRelated ? 'rapid' : 'stable';
  }

  private getAutomationRisk(occupation: string): 'low' | 'medium' | 'high' {
    const creative = occupation.toLowerCase().includes('artist') || 
                    occupation.toLowerCase().includes('musician');
    return creative ? 'low' : 'medium';
  }

  private getBaseSalary(occupation: string): number {
    const salaryMap = {
      'software': 85000,
      'doctor': 200000,
      'engineer': 75000,
      'teacher': 45000,
      'artist': 35000,
      'musician': 40000,
      'lawyer': 120000
    };

    const key = Object.keys(salaryMap).find(k => 
      occupation.toLowerCase().includes(k)
    );
    
    return salaryMap[key as keyof typeof salaryMap] || 50000;
  }

  private getFallbackCityMetrics(cityName: string, countryName: string) {
    // Provide reasonable fallback data when external APIs are unavailable
    return {
      name: cityName,
      country: countryName,
      coordinates: {
        latitude: 40.7128,
        longitude: -74.0060
      },
      teleportScores: {
        overall: 6.5,
        costOfLiving: 6.0,
        safety: 7.0,
        housing: 6.0,
        healthcare: 7.0,
        education: 7.0,
        leisure: 6.5,
        tolerance: 7.0,
        commute: 6.0,
        business: 6.5,
        economy: 6.5
      },
      climate: {
        avgTempC: 15,
        avgTempF: 59,
        rainDays: 120,
        sunnyDays: 200,
        season: 'Temperate',
        comfortIndex: 7.0
      },
      population: 1000000,
      timezone: 'UTC'
    };
  }

  private extractParentChoices(parentNode: any): string[] {
    const choices = [];
    if (parentNode.choice?.careerChange) choices.push(`Career: ${parentNode.choice.careerChange}`);
    if (parentNode.choice?.locationChange?.city) choices.push(`Location: ${parentNode.choice.locationChange.city}`);
    if (parentNode.choice?.educationChange) choices.push(`Education: ${parentNode.choice.educationChange}`);
    if (parentNode.choice?.lifestyleChange) choices.push(`Lifestyle: ${parentNode.choice.lifestyleChange}`);
    if (parentNode.choice?.relationshipChange) choices.push(`Relationship: ${parentNode.choice.relationshipChange}`);
    if (parentNode.choice?.personalityChange) choices.push(`Personal Growth: ${parentNode.choice.personalityChange}`);
    return choices;
  }

  private blendWithParent(newValue: number, parentValue: number, newWeight: number): number {
    // Blend new value with parent value, giving more weight to new value
    return Math.round((newValue * newWeight + parentValue * (1 - newWeight)) * 10) / 10;
  }

  private getFallbackNarrative(choice: any, cityName: string, occupationName: string, parentNode?: any) {
    const contextualIntro = parentNode 
      ? `Building upon your previous life experiences, you've now decided to make another significant change. ` +
        `From your previous situation where you had achieved a happiness level of ${(parentNode.metrics?.happinessScore || 5).toFixed(1)}/10, ` +
        `you're now pursuing a path as a ${occupationName} in ${cityName}.`
      : `In this alternate reality, you've chosen a path as a ${occupationName} in ${cityName}. This decision has shaped your life in meaningful ways, bringing both opportunities and challenges.`;
    
    return {
      summary: contextualIntro,
      chapters: [
        {
          title: "Years 0-3: New Beginnings",
          text: parentNode 
            ? `Building on the foundation of my previous experiences, this transition felt both familiar and entirely new. ` +
              `The lessons learned from my earlier path (where I had reached ${(parentNode.metrics?.happinessScore || 5).toFixed(1)}/10 happiness) ` +
              `gave me confidence as I moved to ${cityName} and started my career as a ${occupationName}. ` +
              `While there were still challenges in adapting to this new direction, I found myself better equipped to handle them, ` +
              `drawing on the wisdom and skills accumulated from my previous journey.`
            : `The first few years were transformative. Moving to ${cityName} and starting my career as a ${occupationName} felt like stepping into a completely different world. The initial challenges of adapting to a new environment and learning the ropes of my profession were significant, but they also brought unexpected growth. I found myself developing skills I never knew I had and forming connections that would prove invaluable. The city's unique character began to influence my daily routines and perspectives, slowly but surely changing who I was becoming.`,
          yearRange: "Years 0-3",
          highlights: parentNode 
            ? ["Building on experience", "Informed transition", "Leveraging past lessons"]
            : ["Career transition", "City adaptation", "Skill development"]
        },
        {
          title: "Years 4-8: Finding My Rhythm",
          text: parentNode 
            ? `By the fourth year, the wisdom from my previous path really began to pay dividends. ` +
              `My expertise as a ${occupationName} was growing rapidly, accelerated by the insights and maturity I had gained earlier. ` +
              `The city had become home, and I had established a network of colleagues and friends more quickly than I might have otherwise. ` +
              `This period was marked by steady progress and increasing confidence, built on a foundation of previous experience. ` +
              `I took on more challenging projects and began to see how this new path connected to and enhanced my overall life journey.`
            : `By the fourth year, I had found my rhythm. My expertise as a ${occupationName} was growing, and I was beginning to make meaningful contributions to my field. The city had become home, and I had established a network of colleagues and friends. This period was marked by steady progress and increasing confidence. I took on more challenging projects and began to see the long-term potential of the path I had chosen. The work-life balance I had established allowed me to explore the cultural offerings of ${cityName} and develop interests outside of work.`,
          yearRange: "Years 4-8",
          highlights: parentNode 
            ? ["Accelerated growth", "Experience leverage", "Enhanced confidence"]
            : ["Professional growth", "Network building", "Work-life balance"]
        },
        {
          title: "Years 9-15: Mastery and Impact",
          text: parentNode 
            ? `The later years brought a profound sense of mastery and the ability to make a real impact. ` +
              `As an experienced ${occupationName}, I was now mentoring others and contributing to the broader community in ${cityName}, ` +
              `drawing on the rich tapestry of experiences from both my previous path and this current journey. ` +
              `The decisions I had made at each branch point were paying dividends, creating a unique combination of skills and perspectives. ` +
              `I had developed a reputation in my field that was enhanced by my diverse background, and was involved in projects that ` +
              `aligned with the evolved understanding of my values and interests. Looking back, this branching path had led to a life ` +
              `that was both fulfilling and meaningful, richer for having explored multiple possibilities.`
            : `The later years brought a sense of mastery and the ability to make a real impact. As an experienced ${occupationName}, I was now mentoring others and contributing to the broader community in ${cityName}. The decisions I had made years earlier were paying dividends, both professionally and personally. I had developed a reputation in my field and was involved in projects that aligned with my values and interests. Looking back, the alternative path had led to a life that was both fulfilling and meaningful, different from what I had originally imagined but rich in its own unique way.`,
          yearRange: "Years 9-15",
          highlights: parentNode 
            ? ["Integrated expertise", "Diverse perspective", "Compound fulfillment"]
            : ["Expertise recognition", "Community impact", "Personal fulfillment"]
        }
      ],
      milestones: [
        { year: 1, event: "Started new career", significance: "high" as const, category: "career" as const },
        { year: 3, event: "Established local connections", significance: "medium" as const, category: "personal" as const },
        { year: 6, event: "Achieved professional recognition", significance: "high" as const, category: "career" as const },
        { year: 10, event: "Became community leader", significance: "medium" as const, category: "personal" as const }
      ],
      tone: "balanced" as const,
      confidenceScore: 0.7,
      disclaimers: ["This is a simulated scenario", "Individual results may vary", "Based on general patterns"]
    };
  }

  private getFallbackCoverImage(cityName: string, occupationName: string) {
    return {
      url: `https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=${encodeURIComponent(cityName + ' - ' + occupationName)}`,
      credit: 'Placeholder Image Service',
      description: `A representative image for ${occupationName} life in ${cityName}`
    };
  }
}

export const nodeController = new NodeController();