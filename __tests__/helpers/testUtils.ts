import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import Event from '@/models/Event';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing';

export const generateToken = (userId: string, email: string) => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
};

export const createTestUser = async (userData?: {
  name?: string;
  email?: string;
  password?: string;
}) => {
  const hashedPassword = await bcrypt.hash(userData?.password || 'password123', 10);
  
  const user = await User.create({
    name: userData?.name || 'Test User',
    email: userData?.email || `test${Date.now()}@example.com`,
    password: hashedPassword,
  });

  const userId = (user._id as any).toString();
  const token = generateToken(userId, user.email);

  return {
    user,
    token,
    userId,
  };
};

export const createTestEvent = async (userId: string, eventData?: {
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  isSwappable?: boolean;
  status?: string;
}) => {
  const now = new Date();
  const event = await Event.create({
    userId,
    title: eventData?.title || 'Test Event',
    description: eventData?.description || 'Test Description',
    startTime: eventData?.startTime || new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
    endTime: eventData?.endTime || new Date(now.getTime() + 25 * 60 * 60 * 1000), // Tomorrow + 1 hour
    isSwappable: eventData?.isSwappable !== undefined ? eventData.isSwappable : true,
    status: eventData?.status || 'SCHEDULED',
  });

  return event;
};

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
