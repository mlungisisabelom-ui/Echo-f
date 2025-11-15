import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Project from '../models/Project';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  projectId?: string;
}

export const setupSocketHandlers = (io: Server): void => {
  // Middleware for authentication
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId} - socketHandlers.ts:37`);

    // Join project room
    socket.on('join-project', async (projectId: string) => {
      try {
        const project = await Project.findOne({
          _id: projectId,
          $or: [
            { owner: socket.userId },
            { collaborators: socket.userId }
          ]
        });

        if (!project) {
          socket.emit('error', { message: 'Project not found or access denied' });
          return;
        }

        socket.projectId = projectId;
        socket.join(`project-${projectId}`);

        // Notify others in the project
        socket.to(`project-${projectId}`).emit('user-joined', {
          userId: socket.userId,
          timestamp: new Date()
        });

        console.log(`User ${socket.userId} joined project ${projectId} - socketHandlers.ts:64`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to join project' });
      }
    });

    // Leave project room
    socket.on('leave-project', (projectId: string) => {
      socket.leave(`project-${projectId}`);
      socket.to(`project-${projectId}`).emit('user-left', {
        userId: socket.userId,
        timestamp: new Date()
      });
      console.log(`User ${socket.userId} left project ${projectId} - socketHandlers.ts:77`);
    });

    // Code editing events
    socket.on('code-change', (data: {
      projectId: string;
      fileId: string;
      content: string;
      cursorPosition?: { line: number; column: number };
    }) => {
      // Broadcast to other users in the same project
      socket.to(`project-${data.projectId}`).emit('code-updated', {
        ...data,
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    // Cursor position updates
    socket.on('cursor-move', (data: {
      projectId: string;
      fileId: string;
      position: { line: number; column: number };
    }) => {
      socket.to(`project-${data.projectId}`).emit('cursor-moved', {
        ...data,
        userId: socket.userId
      });
    });

    // Comments and discussions
    socket.on('add-comment', (data: {
      projectId: string;
      fileId: string;
      content: string;
      lineNumber?: number;
      selection?: { start: number; end: number };
    }) => {
      socket.to(`project-${data.projectId}`).emit('comment-added', {
        ...data,
        userId: socket.userId,
        timestamp: new Date(),
        id: Date.now().toString()
      });
    });

    // Generation progress updates
    socket.on('generation-progress', (data: {
      projectId: string;
      progress: number;
      status: string;
      message?: string;
    }) => {
      socket.to(`project-${data.projectId}`).emit('generation-updated', {
        ...data,
        timestamp: new Date()
      });
    });

    // Project sharing
    socket.on('share-project', async (data: {
      projectId: string;
      targetUserId: string;
      permissions: string[];
    }) => {
      try {
        const project = await Project.findOne({
          _id: data.projectId,
          owner: socket.userId
        });

        if (!project) {
          socket.emit('error', { message: 'Project not found or not owner' });
          return;
        }

        // Add collaborator
        if (!project.collaborators.includes(data.targetUserId as any)) {
          project.collaborators.push(data.targetUserId as any);
          await project.save();
        }

        // Notify the target user if they're online
        io.to(data.targetUserId).emit('project-shared', {
          projectId: data.projectId,
          projectName: project.name,
          permissions: data.permissions,
          sharedBy: socket.userId
        });

        socket.emit('project-shared-success', {
          projectId: data.projectId,
          targetUserId: data.targetUserId
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to share project' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (socket.projectId) {
        socket.to(`project-${socket.projectId}`).emit('user-left', {
          userId: socket.userId,
          timestamp: new Date()
        });
      }
      console.log(`User disconnected: ${socket.userId} - socketHandlers.ts:184`);
    });
  });
};
