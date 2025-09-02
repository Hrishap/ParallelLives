import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AppError, ApiResponse } from '@/types';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  if (error instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    res.status(error.statusCode).json(response);
    return;
  }

  // Default error response
  const response: ApiResponse = {
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  };

  res.status(500).json(response);
};

export const notFoundHandler = (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  };
  res.status(404).json(response);
};