import { z } from 'zod';
import { logger } from './logger';

// Base Schemas
export const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

// Parameter Schemas
export const IdParamSchema = z.object({
  id: ObjectIdSchema
});

export const SessionIdParamSchema = z.object({
  sessionId: ObjectIdSchema
});

export const TokenParamSchema = z.object({
  token: z.string().min(1)
});

export const CoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

// Choice Schema
export const ChoiceSchema = z.object({
  careerChange: z.string().trim().min(1).max(200).optional(),
  locationChange: z.object({
    city: z.string().trim().min(1).max(100).optional(),
    country: z.string().trim().min(1).max(100).optional()
  }).optional(),
  educationChange: z.string().trim().min(1).max(200).optional(),
  lifestyleChange: z.string().trim().min(1).max(200).optional(),
  personalityChange: z.string().trim().min(1).max(200).optional(),
  relationshipChange: z.string().trim().min(1).max(200).optional()
}).refine(
  (data) => {
    // Check if at least one string field has content
    const stringFields = ['careerChange', 'educationChange', 'lifestyleChange', 'personalityChange', 'relationshipChange'];
    const hasStringField = stringFields.some(field => data[field as keyof typeof data] && (data[field as keyof typeof data] as string).length > 0);
    
    // Check if locationChange has valid content
    const hasLocationField = data.locationChange && (data.locationChange.city || data.locationChange.country);
    
    return hasStringField || hasLocationField;
  },
  { message: "At least one choice field must be provided" }
);

// Base Context Schema
export const BaseContextSchema = z.object({
  age: z.number().int().min(16).max(80).optional(),
  country: z.string().trim().min(1).max(100).optional(),
  currentCareer: z.string().trim().min(1).max(100).optional(),
  currentCity: z.string().trim().min(1).max(100).optional(),
  currentEducation: z.string().trim().min(1).max(100).optional(),
  values: z.array(z.string().trim().min(1).max(50)).max(10).optional(),
  riskTolerance: z.enum(['low', 'medium', 'high']).optional()
});

// Request Schemas
export const CreateSessionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500).optional(),
  baseContext: BaseContextSchema.optional(),
  initialChoice: ChoiceSchema
});

export const CreateNodeSchema = z.object({
  parentNodeId: ObjectIdSchema.optional(),
  choice: ChoiceSchema,
  userPreferences: z.object({
    tone: z.enum(['optimistic', 'realistic', 'cautious', 'balanced']).optional(),
    focusAreas: z.array(z.string().trim().min(1).max(50)).max(5).optional(),
    timeHorizon: z.number().int().min(1).max(50).optional()
  }).optional()
});

// Query Schemas
export const PaginationSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1)).default('1'),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).default('10')
});

export const SessionQuerySchema = z.object({
  status: z.enum(['active', 'completed', 'archived']).optional(),
  tags: z.string().optional(),
  search: z.string().trim().min(1).max(100).optional()
}).merge(PaginationSchema);

export const NodeQuerySchema = z.object({
  sessionId: ObjectIdSchema,
  depth: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(0).max(10)).optional(),
  status: z.enum(['generating', 'completed', 'error']).optional()
}).merge(PaginationSchema);

// Export Schema
export const ExportNodeSchema = z.object({
  format: z.enum(['pdf', 'json']).default('pdf'),
  includeImages: z.boolean().default(true),
  includeMetrics: z.boolean().default(true)
});

// Validation middleware
export const validateBody = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Validation failed:', {
          requestBody: JSON.stringify(req.body, null, 2),
          validationErrors: error.errors
        });
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
          timestamp: new Date().toISOString()
        });
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Query validation failed',
          details: error.errors,
          timestamp: new Date().toISOString()
        });
      }
      next(error);
    }
  };
};

export const validateParams = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Parameter validation failed',
          details: error.errors,
          timestamp: new Date().toISOString()
        });
      }
      next(error);
    }
  };
};