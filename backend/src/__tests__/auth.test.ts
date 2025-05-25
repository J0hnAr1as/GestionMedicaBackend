import request from 'supertest';
import { app } from '../index';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

describe('Auth Endpoints', () => {
  const baseUser = {
    address: 'Calle Falsa 123',
    phone: '123456789',
    birthDate: '1990-01-01',
    documentId: 'ABC123456',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'patient',
        ...baseUser
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should not register a user with existing email', async () => {
      // Primero creamos un usuario
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
        role: 'patient',
        ...baseUser
      };

      await User.create({
        ...userData,
        password: await bcrypt.hash(userData.password, 10)
      });

      // Intentamos registrar el mismo email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/login', () => {
    let loginUser: any;

    beforeEach(async () => {
      // Crear un usuario de prueba antes de cada prueba
      const userData = {
        email: 'login@example.com',
        password: 'password123',
        name: 'Login Test User',
        role: 'patient',
        ...baseUser
      };

      // Usar el mismo método que en el registro
      const user = new User(userData);
      loginUser = await user.save();
      console.log('Usuario creado en login (beforeEach):', loginUser);
    });

    afterEach(async () => {
      // Limpiar la colección solo si no estamos en la prueba de login (para evitar borrar el usuario antes de la prueba de login)
      if (expect.getState().currentTestName?.includes('login')) {
         console.log('No se borra la colección en login (afterEach)');
         return;
      }
      const collections = (await (await (await mongoose.connection).db).collections());
      for (const coll of collections) {
         await coll.deleteMany({});
      }
    });

    it('should login with valid credentials', async () => {
      const credentials = {
        email: 'login@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', credentials.email);
    });

    it('should not login with invalid password', async () => {
      const credentials = {
        email: 'login@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });
  });
}); 