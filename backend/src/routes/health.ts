import express from 'express';
import { checkDatabaseHealth } from '@/config/database';
import { cacheService } from '@/services/cache';
import { ApiResponse } from '@/types';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [dbHealth, cacheStats] = await Promise.all([
      checkDatabaseHealth(),
'getStats' in cacheService ? (cacheService as any).getStats() : null
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.floor(process.uptime()),
        database: dbHealth ? 'connected' : 'disconnected',
        cache: cacheStats || 'not available',
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    };
    res.status(500).json(response);
  }
});

export default router;