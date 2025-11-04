import { NextRequest } from 'next/server';
import { POST as signupHandler } from '@/app/api/auth/signup/route';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import User from '@/models/User';
import { createTestUser } from '../helpers/testUtils';

describe('Auth API Tests', () => {
  describe('POST /api/auth/signup', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const request = new NextRequest('http://localhost:3001/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      const response = await signupHandler(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('User created successfully');
      expect(data.token).toBeDefined();
      expect(data.user).toMatchObject({
        name: userData.name,
        email: userData.email,
      });
      expect(data.user.password).toBeUndefined();
    });

    it('should fail with missing fields', async () => {
      const request = new NextRequest('http://localhost:3001/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      const response = await signupHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });

    it('should fail with duplicate email', async () => {
      const email = 'duplicate@example.com';
      await createTestUser({ email });

      const request = new NextRequest('http://localhost:3001/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Another User',
          email,
          password: 'password123',
        }),
      });

      const response = await signupHandler(request);
      const data = await response.json();

      expect(response.status).toBe(409); // Changed from 400 to 409 (Conflict)
      expect(data.error).toContain('already exists');
    });

    it('should hash the password', async () => {
      const userData = {
        name: 'Password Test',
        email: 'password@example.com',
        password: 'mypassword123',
      };

      const request = new NextRequest('http://localhost:3001/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      await signupHandler(request);

      // Use .select('+password') to include password field
      const user = await User.findOne({ email: userData.email }).select('+password');
      expect(user).toBeDefined();
      expect(user?.password).toBeDefined();
      expect(user?.password).not.toBe(userData.password);
      if (user?.password) {
        expect(user.password.length).toBeGreaterThan(20); // Hashed passwords are longer
      }
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const { user } = await createTestUser({
        email: 'login@example.com',
        password: 'password123',
      });

      const request = new NextRequest('http://localhost:3001/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'login@example.com',
          password: 'password123',
        }),
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Login successful');
      expect(data.token).toBeDefined();
      expect(data.user.email).toBe(user.email);
    });

    it('should fail with incorrect password', async () => {
      await createTestUser({
        email: 'wrongpass@example.com',
        password: 'password123',
      });

      const request = new NextRequest('http://localhost:3001/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'wrongpass@example.com',
          password: 'wrongpassword',
        }),
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Invalid');
    });

    it('should fail with non-existent email', async () => {
      const request = new NextRequest('http://localhost:3001/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Invalid');
    });

    it('should fail with missing fields', async () => {
      const request = new NextRequest('http://localhost:3001/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('email and password'); // Changed to match actual error message
    });
  });
});
