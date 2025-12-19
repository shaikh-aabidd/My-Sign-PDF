import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../src/app.js';
import { User } from '../../src/models/user.model.js';
import { DB_NAME } from '../../src/constants.js';

describe('User Routes', () => {
  let authToken;
  let adminToken;
  let testUser;
  let testAdmin;

  beforeAll(async () => {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
  });

  beforeEach(async () => {
    // Cleanup existing data
    await User.deleteMany({});

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'testPassword123',
      role: 'customer'
    });

    // Create admin user
    testAdmin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'adminPassword123',
      role: 'admin'
    });

    // Login test user
    const userLogin = await request(app)
      .post('/api/v1/users/login')
      .send({
        email: 'test@example.com',
        password: 'testPassword123',
      });
    authToken = userLogin.body.data.accessToken;

    // Login admin user
    const adminLogin = await request(app)
      .post('/api/v1/users/login')
      .send({
        email: 'admin@example.com',
        password: 'adminPassword123',
      });
    adminToken = adminLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/v1/users/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/users/register')
        .send({
          name: 'New User',
          email: 'new@example.com',
          password: 'anypassword',
          phone: '+918769031514'
        });
  
      expect(response.statusCode).toBe(201);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.role).toBe('customer');
    });
  
    it('should return 409 for duplicate email', async () => {
      const response = await request(app)
        .post('/api/v1/users/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'testPassword123',
        });
  
      expect(response.statusCode).toBe(409);
      expect(response.body.message).toMatch(/already exist/i);
    });
  
    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/users/register')
        .send({
          name: 'Invalid Email',
          email: 'invalid-email',
          password: 'anypassword'
        });
  
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toMatch(/invalid email/i);
    });
  });

  describe('POST /api/v1/users/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'test@example.com',
          password: 'testPassword123',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'test@example.com',
          password: 'wrongPassword',
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toMatch("Incorrect Password");
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anyPassword',
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toMatch(/user not found/i);
    });
  });

  describe('POST /api/v1/users/logout', () => {
    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/users/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.headers['set-cookie']).toBeDefined();
    });
  });

  describe('POST /api/v1/users/refresh-access-token', () => {
    it('should refresh access token with valid refresh token', async () => {
      const loginResponse = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'test@example.com',
          password: 'testPassword123',
        });
      
      const refreshToken = loginResponse.headers['set-cookie']
        .find(cookie => cookie.startsWith('refreshToken'))
        .split(';')[0]
        .split('=')[1];

      const response = await request(app)
        .post('/api/v1/users/refresh-access-token')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toHaveProperty('accessToken');
    });
  });

  describe('PATCH /api/v1/users/change-password', () => {
    it('should change password successfully', async () => {
      const response = await request(app)
        .patch('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: 'testPassword123',
          newPassword: 'newPassword123!'
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toMatch(/password changed/i);
    });

    it('should return 400 for incorrect old password', async () => {
      const response = await request(app)
        .patch('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: 'wrongPassword',
          newPassword: 'newPassword123!'
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toMatch(/invalid old password/i);
    });
  });

  describe('GET /api/v1/users/me', () => {
    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data).not.toHaveProperty('password');
    });
  });

  describe('PATCH /api/v1/users/update-account-details', () => {
    it('should update user details', async () => {
      const response = await request(app)
        .patch('/api/v1/users/update-account-details')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          email: 'updated@example.com'
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should handle address updates', async () => {
      // Add address
      const addResponse = await request(app)
        .patch('/api/v1/users/update-account-details')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          addresses: [{
            street: '123 Main St',
            city: 'Test City',
            type: 'home'
          }],
          addressAction: 'add'
        });

      expect(addResponse.statusCode).toBe(200);
      expect(addResponse.body.data.addresses.length).toBe(1);

      // Update address
      const updateResponse = await request(app)
        .patch('/api/v1/users/update-account-details')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          addresses: [{
            street: '456 Updated St'
          }],
          addressAction: 'update',
          addressType: 'home'
        });

      expect(updateResponse.statusCode).toBe(200);
      expect(updateResponse.body.data.addresses[0].street).toBe('456 Updated St');

      // Remove address
      const removeResponse = await request(app)
        .patch('/api/v1/users/update-account-details')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          addressAction: 'remove',
          addressType: 'home'
        });

      expect(removeResponse.statusCode).toBe(200);
      expect(removeResponse.body.data.addresses.length).toBe(0);
    });
  });

  describe('Admin Routes', () => {
    describe('DELETE /api/v1/users/delete-user/:userId', () => {
      it('should delete user (admin only)', async () => {
        const response = await request(app)
          .delete(`/api/v1/users/delete-user/${testUser._id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toMatch(/deleted successfully/i);
      });

      it('should return 403 for non-admin users', async () => {
        const response = await request(app)
          .delete(`/api/v1/users/delete-user/${testUser._id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.statusCode).toBe(403);
      });
    });

    describe('GET /api/v1/users/get-all-users', () => {
      it('should get all users (admin only)', async () => {
        const response = await request(app)
          .get('/api/v1/users/get-all-users')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.data.length).toBe(2);
      });
    });

    describe('PATCH /api/v1/users/update-role/:userId', () => {
      it('should update user role (admin only)', async () => {
        const response = await request(app)
          .patch(`/api/v1/users/update-role/${testUser._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role: 'tailor' });

        expect(response.statusCode).toBe(200);
        expect(response.body.data.role).toBe('tailor');
      });
    });
  });
});