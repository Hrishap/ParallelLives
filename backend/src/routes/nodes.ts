import express from 'express';
import { nodeController } from '@/controllers/nodeController';
import { 
  validateBody, 
  validateParams, 
  validateQuery,
  CreateNodeSchema,
  NodeQuerySchema,
  ExportNodeSchema,
  SessionIdParamSchema,
  IdParamSchema 
} from '@/utils/validation';

const router = express.Router();

// Create new node in session
router.post('/session/:sessionId',
  validateParams(SessionIdParamSchema),
  validateBody(CreateNodeSchema),
  nodeController.createNode.bind(nodeController)
);

// Get specific node
router.get('/:id',
  validateParams(IdParamSchema),
  nodeController.getNode.bind(nodeController)
);

// Export node as PDF or JSON
router.get('/:id/export',
  validateParams(IdParamSchema),
  validateQuery(ExportNodeSchema),
  nodeController.exportNode.bind(nodeController)
);

export default router;