import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { createDbMock, DbMock } from '../../test/db-mock';
import { asTestUser, AppHandle, createTestApp } from '../../test/setup-app';

jest.mock('bcrypt');

describe('AuthController (integration)', () => {
  let handle: AppHandle;
  let db: DbMock;
  const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(async () => {
    db = createDbMock();
    bcryptMock.hash.mockReset();
    bcryptMock.compare.mockReset();
    handle = await createTestApp({
      controllers: [AuthController],
      providers: [AuthService],
      db: db as never,
    });
  });

  afterEach(() => handle.close());

  describe('public routes', () => {
    it('POST /api/auth/login returns token when credentials are correct', async () => {
      db.queueResult([
        { id: 'u1', name: 'Admin', email: 'a@x.com', passwordHash: 'h' },
      ]);
      bcryptMock.compare.mockResolvedValue(true as never);

      const res = await request(handle.app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'a@x.com', password: 'pwd12345' })
        .expect(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user).toMatchObject({ role: 'admin' });
    });

    it('POST /api/auth/login returns 401 with invalid credentials', async () => {
      db.queueResult([]);
      await request(handle.app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'a@x.com', password: 'pwd12345' })
        .expect(401);
    });

    it('POST /api/auth/login validates payload', async () => {
      await request(handle.app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'not-an-email' })
        .expect(400);
    });

    it('POST /api/auth/register returns 201 and creates admin', async () => {
      db.queueResult([]);
      bcryptMock.hash.mockResolvedValue('h' as never);
      db.queueResult([{ id: 'u1', name: 'Admin', email: 'a@x.com' }]);

      const res = await request(handle.app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Admin', email: 'a@x.com', password: 'pwd12345' })
        .expect(201);
      expect(res.body.accessToken).toBeDefined();
    });

    it('POST /api/auth/register returns 409 when email already exists', async () => {
      db.queueResult([{ id: 'u-existing' }]);
      await request(handle.app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Admin', email: 'a@x.com', password: 'pwd12345' })
        .expect(409);
    });

    it('POST /api/auth/student/login signals that password setup is required', async () => {
      db.queueResult([
        { id: 's1', registration: '123', passwordHash: null },
      ]);
      const res = await request(handle.app.getHttpServer())
        .post('/api/auth/student/login')
        .send({ registration: '123' })
        .expect(200);
      expect(res.body).toEqual({ requiresPasswordSetup: true });
    });
  });

  describe('GET /api/auth/me (protected)', () => {
    it('returns 401 without a token', async () => {
      await request(handle.app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });

    it('returns admin profile for authenticated admin', async () => {
      db.queueResult([{ id: 'u1', name: 'Admin', email: 'a@x.com' }]);
      const res = await request(handle.app.getHttpServer())
        .get('/api/auth/me')
        .set('X-Test-User', asTestUser({ id: 'u1', role: 'admin' }))
        .expect(200);
      expect(res.body).toMatchObject({ id: 'u1', role: 'admin' });
    });

    it('returns student profile for authenticated student', async () => {
      db.queueResult([
        { id: 's1', name: 'Ana', email: 'a@x.com', registration: '123' },
      ]);
      const res = await request(handle.app.getHttpServer())
        .get('/api/auth/me')
        .set('X-Test-User', asTestUser({ id: 's1', role: 'student' }))
        .expect(200);
      expect(res.body).toMatchObject({ id: 's1', role: 'student', registration: '123' });
    });
  });
});
