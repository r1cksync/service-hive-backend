import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

// Function to get JWT_SECRET - read from env at runtime, not at module load time
const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'fallback-secret-change-in-production';
};

let io: SocketIOServer | null = null;

export const initializeSocket = (server: HTTPServer) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const JWT_SECRET = getJwtSecret(); // Get secret at initialization time
  
  console.log('🔌 Initializing Socket.IO server...');
  console.log('📡 Allowed CORS origin:', frontendUrl);
  
  // Log JWT_SECRET info (hash only for security)
  const crypto = require('crypto');
  const secretHash = crypto.createHash('sha256').update(JWT_SECRET).digest('hex').substring(0, 16);
  console.log('🔑 Using JWT_SECRET hash:', secretHash, '(length:', JWT_SECRET.length, ')');
  
  io = new SocketIOServer(server, {
    cors: {
      origin: [frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Allow connections from any origin in production if FRONTEND_URL includes multiple domains
    allowEIO3: true,
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use((socket, next) => {
    let rawToken = socket.handshake.auth.token;

    if (!rawToken) {
      console.log('🔐 Socket authentication attempt... (no token)');
      console.error('❌ No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    // Normalize token: strip possible "Bearer " prefix and trim whitespace
    if (typeof rawToken === 'string') rawToken = rawToken.trim();
    let token = typeof rawToken === 'string' ? rawToken : '';
    if (token.startsWith('Bearer ')) token = token.slice(7).trim();

    // Mask token for logs (don't log full secret token)
    const masked = token.length > 16 ? `${token.slice(0, 8)}...${token.slice(-8)}` : token;
    console.log('🔐 Socket authentication attempt with token:', masked);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      socket.data.userId = decoded.userId;
      socket.data.email = decoded.email;
      console.log('✅ Socket authenticated for user:', decoded.email);
      next();
    } catch (error) {
      console.error('❌ Token verification failed:', error && (error as Error).message ? (error as Error).message : error);
      // Include a hint if the token appears malformed
      if (typeof token !== 'string' || token.split('.').length !== 3) {
        console.error('⚠️ Provided token does not look like a valid JWT (bad format)');
      }
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    const email = socket.data.email;
    console.log(`✅ User connected: ${email} (${userId}) at ${new Date().toISOString()}`);

    // Join user-specific room for targeted notifications
    socket.join(`user:${userId}`);
    console.log(`👤 User ${email} joined room: user:${userId}`);

    socket.on('disconnect', (reason) => {
      console.log(`❌ User disconnected: ${email} (${userId}) - Reason: ${reason} at ${new Date().toISOString()}`);
    });
    
    socket.on('error', (error) => {
      console.error(`⚠️ Socket error for user ${email}:`, error);
    });
  });

  console.log('✅ Socket.IO server initialized successfully');
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
