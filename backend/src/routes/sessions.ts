import express from 'express';
import { sessionController } from '@/controllers/sessionController';
import { 
  validateBody, 
  validateParams, 
  validateQuery,
  CreateSessionSchema,
  SessionQuerySchema,
  IdParamSchema,
  TokenParamSchema 
} from '@/utils/validation';

const router = express.Router();

// Create new session
router.post('/', 
  validateBody(CreateSessionSchema),
  sessionController.createSession.bind(sessionController)
);

// Get sessions with pagination and filtering
router.get('/',
  validateQuery(SessionQuerySchema),
  sessionController.getSessions.bind(sessionController)
);

// Get specific session
router.get('/:id',
  validateParams(IdParamSchema),
  sessionController.getSession.bind(sessionController)
);

// Get session tree structure
router.get('/:id/tree',
  validateParams(IdParamSchema),
  sessionController.getSessionTree.bind(sessionController)
);

// Update session
router.put('/:id',
  validateParams(IdParamSchema),
  sessionController.updateSession.bind(sessionController)
);

// Delete session
router.delete('/:id',
  validateParams(IdParamSchema),
  sessionController.deleteSession.bind(sessionController)
);

// Get public session by token
router.get('/public/:token',
  validateParams(TokenParamSchema),
  sessionController.getPublicSession.bind(sessionController)
);

export default router;