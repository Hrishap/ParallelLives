import { Request, Response } from 'express';
import { LifeSession, LifeNode } from '@/models';
import { 
  ApiResponse, 
  PaginatedResponse, 
  CreateSessionRequest,
  NotFoundError,
  ValidationError 
} from '@/types';
import { logger } from '../utils/logger';
import { nodeController } from './nodeController';
import { v4 as uuidv4 } from 'uuid';

class SessionController {
  async createSession(req: Request<{}, ApiResponse, CreateSessionRequest>, res: Response): Promise<void> {
    try {
      const { title, description, baseContext, initialChoice } = req.body;

      logger.info('Creating new life session:', { title, initialChoice });

      // Create session document first
      const session = new LifeSession({
        title: title.trim(),
        description: description?.trim(),
        baseContext,
        status: 'active',
        totalNodes: 0,
        maxDepth: 0,
        shareableToken: uuidv4()
      });

      // Save session without rootNodeId first
      await session.save();

      // Create root node
      const rootNode = await nodeController.createNodeInternal({
        sessionId: session._id.toString(),
        parentNodeId: undefined,
        depth: 0,
        order: 0,
        choice: initialChoice,
        baseContext,
        userPreferences: { tone: 'balanced' }
      });

      // Update session with root node ID
      if (rootNode) {
        session.rootNodeId = rootNode._id;
        session.totalNodes = 1;
        session.maxDepth = 0;
        await session.save();

        const response: ApiResponse = {
          success: true,
          data: {
            session: session.toJSON(),
            rootNode: rootNode.toJSON()
          },
          message: 'Session created successfully',
          timestamp: new Date().toISOString()
        };

        res.status(201).json(response);
      } else {
        throw new Error('Failed to create root node');
      }
    } catch (error) {
      logger.error('Error creating session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
      const response: ApiResponse = {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  async getSession(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const session = await LifeSession.findById(id)
        .populate('nodes')
        .lean();

      if (!session) {
        throw new NotFoundError('Session not found');
      }

      const response: ApiResponse = {
        success: true,
        data: session,
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

      logger.error('Error getting session:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to get session',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  async getSessionTree(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const session = await LifeSession.findById(id);
      if (!session) {
        throw new NotFoundError('Session not found');
      }

      const nodes = await LifeNode.find({ sessionId: id })
        .sort({ depth: 1, order: 1 })
        .lean();

      const tree = this.buildTreeStructure(nodes);

      const response: ApiResponse = {
        success: true,
        data: {
          session: session.toJSON(),
          tree
        },
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

      logger.error('Error getting session tree:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to get session tree',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  async getSessions(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        tags,
        search
      } = req.query as any;

      const filter: any = {};
      
      if (status) filter.status = status;
      if (tags) filter.tags = { $in: tags.split(',') };
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      
      const [sessions, total] = await Promise.all([
        LifeSession.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        LifeSession.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);
      
      const response: PaginatedResponse<typeof sessions[0]> = {
        success: true,
        data: sessions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error getting sessions:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to get sessions',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  async updateSession(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const session = await LifeSession.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!session) {
        throw new NotFoundError('Session not found');
      }

      const response: ApiResponse = {
        success: true,
        data: session.toJSON(),
        message: 'Session updated successfully',
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

      logger.error('Error updating session:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update session',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  async deleteSession(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Delete all nodes first
      await LifeNode.deleteMany({ sessionId: id });
      
      // Delete session
      const session = await LifeSession.findByIdAndDelete(id);
      
      if (!session) {
        throw new NotFoundError('Session not found');
      }

      const response: ApiResponse = {
        success: true,
        message: 'Session deleted successfully',
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

      logger.error('Error deleting session:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to delete session',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  async getPublicSession(req: Request<{ token: string }>, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      const session = await LifeSession.findOne({ 
        shareableToken: token,
        isPublic: true 
      }).populate('nodes');

      if (!session) {
        throw new NotFoundError('Public session not found');
      }

      // Increment view count
      session.viewCount += 1;
      await session.save();

      const response: ApiResponse = {
        success: true,
        data: session.toJSON(),
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

      logger.error('Error getting public session:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to get public session',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  private buildTreeStructure(nodes: any[]) {
    const nodeMap = new Map(nodes.map(node => [node._id.toString(), node]));
    const tree = {
      nodes: [] as any[],
      edges: [] as any[],
      maxDepth: 0,
      totalNodes: nodes.length
    };

    nodes.forEach(node => {
      tree.maxDepth = Math.max(tree.maxDepth, node.depth);
      
      tree.nodes.push({
        id: node._id.toString(),
        parentId: node.parentNodeId?.toString(),
        data: node,
        depth: node.depth,
        position: { x: 0, y: 0 } // Will be calculated on frontend
      });

      if (node.parentNodeId) {
        tree.edges.push({
          source: node.parentNodeId.toString(),
          target: node._id.toString(),
          type: 'parent-child'
        });
      }
    });

    return tree;
  }
}

export const sessionController = new SessionController();