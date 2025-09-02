import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';
import { ExternalAPIError } from '@/types';
import { IChoice, ICityMetrics, IOccupationMetrics, IFinancialMetrics } from '@/models/LifeNode';

interface GeminiConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface NarrativePromptData {
  choice: IChoice;
  cityMetrics: ICityMetrics;
  occupationMetrics: IOccupationMetrics;
  financialMetrics: IFinancialMetrics;
  baseContext?: any;
  userPreferences?: any;
  parentContext?: {
    story: string;
    metrics: any;
    depth: number;
    previousChoices: string[];
  } | null;
}

interface GeminiNarrativeResponse {
  summary: string;
  chapters: Array<{
    title: string;
    text: string;
    yearRange: string;
    highlights: string[];
  }>;
  milestones: Array<{
    year: number;
    event: string;
    significance: 'low' | 'medium' | 'high';
    category: 'career' | 'personal' | 'financial' | 'health' | 'relationship';
  }>;
  tone: 'optimistic' | 'realistic' | 'cautious' | 'balanced';
  confidenceScore: number;
  disclaimers: string[];
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private config: GeminiConfig;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.config = {
      apiKey,
      model: 'gemini-1.5-flash',
      temperature: 0.7,
      maxTokens: 2048
    };

    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateNarrative(data: NarrativePromptData): Promise<GeminiNarrativeResponse> {
    try {
      logger.info('Generating narrative with Gemini AI');
      
      const prompt = this.buildNarrativePrompt(data);
      const model = this.genAI.getGenerativeModel({ model: this.config.model });
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens,
        },
      });

      const response = result.response;
      const text = response.text();
      
      if (!text) {
        throw new ExternalAPIError('Empty response from Gemini API', 'gemini');
      }

      return this.parseNarrativeResponse(text);
    } catch (error) {
      logger.error('Gemini API error:', error);
      if (error instanceof ExternalAPIError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ExternalAPIError(`Gemini API request failed: ${errorMessage}`, 'gemini');
    }
  }

  async normalizeChoice(choiceText: string): Promise<IChoice> {
    try {
      const prompt = this.buildChoiceNormalizationPrompt(choiceText);
      const model = this.genAI.getGenerativeModel({ model: this.config.model });
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 512,
        },
      });

      const response = result.response.text();
      return this.parseChoiceResponse(response);
    } catch (error) {
      logger.error('Choice normalization error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ExternalAPIError(`Choice normalization failed: ${errorMessage}`, 'gemini');
    }
  }

  private buildNarrativePrompt(data: NarrativePromptData): string {
    const { choice, cityMetrics, occupationMetrics, financialMetrics, baseContext, userPreferences, parentContext } = data;
    
    let choiceDescription = '';
    if (choice.careerChange) choiceDescription += `Career: ${choice.careerChange}\n`;
    if (choice.locationChange?.city) choiceDescription += `Location: ${choice.locationChange.city}, ${choice.locationChange.country || ''}\n`;
    if (choice.educationChange) choiceDescription += `Education: ${choice.educationChange}\n`;
    if (choice.lifestyleChange) choiceDescription += `Lifestyle: ${choice.lifestyleChange}\n`;

    const contextualIntro = parentContext 
      ? `CONTINUING FROM PREVIOUS PATH: This is a branching scenario building upon a previous life path where the person had achieved ${(parentContext.metrics?.happinessScore || 5).toFixed(1)}/10 happiness. Previous story context: "${parentContext.story?.slice(0, 200)}..." Previous choices made: ${parentContext.previousChoices.join(', ')}. This new branch represents a significant life change from that established foundation.`
      : '';

    return `You are ParallelLives, an AI that writes grounded alternate-life narratives. Use the provided FACTS block for any numbers, places, and constraints. Do not invent statistics. If something is unknown, state it transparently.

${contextualIntro}

WHAT-IF: ${choiceDescription}
PREFS: ${userPreferences?.tone || 'balanced'} tone, ${userPreferences?.focusAreas?.join(', ') || 'general focus'}

FACTS:
- Target city: ${cityMetrics.name}, ${cityMetrics.country}
- Teleport scores (0-10): cost_of_living=${cityMetrics.teleportScores?.costOfLiving || 'N/A'}, safety=${cityMetrics.teleportScores?.safety || 'N/A'}, housing=${cityMetrics.teleportScores?.housing || 'N/A'}, healthcare=${cityMetrics.teleportScores?.healthcare || 'N/A'}, education=${cityMetrics.teleportScores?.education || 'N/A'}
- Climate snapshot: avg_temp_c=${cityMetrics.climate?.avgTempC || 'N/A'}, rain_days=${cityMetrics.climate?.rainDays || 'N/A'}, comfort_index=${cityMetrics.climate?.comfortIndex || 'N/A'}
- Occupation: ${occupationMetrics.name} (${occupationMetrics.category})
  - demand_index=${occupationMetrics.demandIndex || 'N/A'}
  - education_typical=${occupationMetrics.educationTypical || 'N/A'}
  - growth_outlook=${occupationMetrics.growthOutlook || 'N/A'}
  - work_life_balance=${occupationMetrics.workLifeBalance || 'N/A'}/10
- Finances (estimates): salary_range_usd=${financialMetrics.salaryLowUSD || 'N/A'}-${financialMetrics.salaryHighUSD || 'N/A'}, col_index=${financialMetrics.colIndex}, local_currency=${financialMetrics.currency}

OUTPUT FORMAT (JSON):
{
  "summary": "A compelling 2-3 sentence overview of this alternate life path${parentContext ? ', emphasizing how it builds upon the previous journey' : ''}",
  "chapters": [
    {
      "title": "Years 0-3: ${parentContext ? 'Transitioning Forward' : 'Foundation'}",
      "text": "First-person narrative of initial years (300-400 words)${parentContext ? ', referencing lessons learned and skills gained from the previous path' : ''}",
      "yearRange": "Years 0-3",
      "highlights": ["key achievement 1", "key challenge 1", "key milestone 1"]
    },
    {
      "title": "Years 4-8: ${parentContext ? 'Leveraging Experience' : 'Growth'}",  
      "text": "First-person narrative of growth phase (300-400 words)${parentContext ? ', showing how previous experience accelerates progress' : ''}",
      "yearRange": "Years 4-8",
      "highlights": ["key achievement 2", "key challenge 2", "key milestone 2"]
    },
    {
      "title": "Years 9-15: ${parentContext ? 'Integrated Mastery' : 'Mastery'}",
      "text": "First-person narrative of mature phase (300-400 words)${parentContext ? ', demonstrating the compound benefits of diverse life experiences' : ''}", 
      "yearRange": "Years 9-15",
      "highlights": ["key achievement 3", "key challenge 3", "key milestone 3"]
    }
  ],
  "milestones": [
    {"year": 1, "event": "Specific milestone", "significance": "medium", "category": "career"},
    {"year": 3, "event": "Another milestone", "significance": "high", "category": "personal"},
    {"year": 7, "event": "Major achievement", "significance": "high", "category": "career"},
    {"year": 12, "event": "Life milestone", "significance": "medium", "category": "personal"}
  ],
  "tone": "balanced",
  "confidenceScore": 0.75,
  "disclaimers": ["Based on US occupation data", "Cost estimates are approximate", "Individual results may vary"]
}

Write in first-person voice, reflect costs/livability in decisions, be honest about data limitations, and do not hallucinate statistics outside FACTS.${parentContext ? ' IMPORTANT: Reference the previous life path context throughout the narrative to show continuity and growth from that foundation.' : ''}`;
  }

  private buildChoiceNormalizationPrompt(choiceText: string): string {
    return `Analyze this life choice and extract structured dimensions:

INPUT: "${choiceText}"

Extract and categorize the change into these dimensions:
- Career change (job/profession change)
- Location change (city/country change)  
- Education change (academic path change)
- Lifestyle change (general life approach change)

OUTPUT FORMAT (JSON):
{
  "careerChange": "extracted career change or null",
  "locationChange": {
    "city": "extracted city or null",
    "country": "extracted country or null"
  },
  "educationChange": "extracted education change or null", 
  "lifestyleChange": "extracted lifestyle change or null"
}

Be precise and only extract what is explicitly mentioned. Return null for unspecified dimensions.`;
  }

  private parseNarrativeResponse(text: string): GeminiNarrativeResponse {
    try {
      // Remove any markdown code blocks
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      
      // Validate required fields
      if (!parsed.summary || !Array.isArray(parsed.chapters) || !Array.isArray(parsed.milestones)) {
        throw new Error('Missing required fields in narrative response');
      }

      // Set defaults for optional fields
      return {
        summary: parsed.summary,
        chapters: parsed.chapters,
        milestones: parsed.milestones,
        tone: parsed.tone || 'balanced',
        confidenceScore: parsed.confidenceScore || 0.5,
        disclaimers: parsed.disclaimers || []
      };
    } catch (error) {
      logger.error('Failed to parse Gemini narrative response:', error);
      throw new ExternalAPIError('Invalid narrative response format', 'gemini');
    }
  }

  private parseChoiceResponse(text: string): IChoice {
    try {
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      
      return {
        careerChange: parsed.careerChange || undefined,
        locationChange: parsed.locationChange || undefined,
        educationChange: parsed.educationChange || undefined,
        lifestyleChange: parsed.lifestyleChange || undefined
      };
    } catch (error) {
      logger.error('Failed to parse choice response:', error);
      throw new ExternalAPIError('Invalid choice response format', 'gemini');
    }
  }
}

export const geminiService = new GeminiService();