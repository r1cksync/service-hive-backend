import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

let io: SocketIOServer | null = null;

export const initializeSocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      socket.data.userId = decoded.userId;
      socket.data.email = decoded.email;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    console.log(`User connected: ${userId}`);

    // Join user-specific room for targeted notifications
    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer | null => {
  return io;
};

// Notification helper functions
export const emitSwapRequestCreated = (targetUserId: string, data: any) => {
  if (io) {
    io.to(`user:${targetUserId}`).emit('swap-request-created', data);
    console.log(`Emitted swap-request-created to user: ${targetUserId}`);
  }
};

export const emitSwapRequestAccepted = (requesterUserId: string, data: any) => {
  if (io) {
    io.to(`user:${requesterUserId}`).emit('swap-request-accepted', data);
    console.log(`Emitted swap-request-accepted to user: ${requesterUserId}`);
  }
};

export const emitSwapRequestRejected = (requesterUserId: string, data: any) => {
  if (io) {
    io.to(`user:${requesterUserId}`).emit('swap-request-rejected', data);
    console.log(`Emitted swap-request-rejected to user: ${requesterUserId}`);
  }
};
