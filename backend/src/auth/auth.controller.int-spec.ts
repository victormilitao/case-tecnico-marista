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

  describe('rotas públicas', () => {
    it('POST /api/auth/login retorna token quando credenciais corretas', async () => {
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

    it('POST /api/auth/login retorna 401 com credenciais inválidas', async () => {
      db.queueResult([]);
      await request(handle.app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'a@x.com', password: 'pwd12345' })
        .expect(401);
    });

    it('POST /api/auth/login valida payload', async () => {
      await request(handle.app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nao-eh-email' })
        .expect(400);
    });

    it('POST /api/auth/register retorna 201 e cria admin', async () => {
      db.queueResult([]); // existing
      bcryptMock.hash.mockResolvedValue('h' as never);
      db.queueResult([{ id: 'u1', name: 'Admin', email: 'a@x.com' }]);

      const res = await request(handle.app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Admin', email: 'a@x.com', password: 'pwd12345' })
        .expect(201);
      expect(res.body.accessToken).toBeDefined();
    });

    it('POST /api/auth/register retorna 409 quando email já existe', async () => {
      db.queueResult([{ id: 'u-existente' }]);
      await request(handle.app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Admin', email: 'a@x.com', password: 'pwd12345' })
        .expect(409);
    });

    it('POST /api/auth/student/login indica que precisa criar senha', async () => {
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

  describe('GET /api/auth/me (protegida)', () => {
    it('retorna 401 sem token', async () => {
      await request(handle.app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });

    it('retorna dados do admin autenticado', async () => {
      db.queueResult([{ id: 'u1', name: 'Admin', email: 'a@x.com' }]);
      const res = await request(handle.app.getHttpServer())
        .get('/api/auth/me')
        .set('X-Test-User', asTestUser({ id: 'u1', role: 'admin' }))
        .expect(200);
      expect(res.body).toMatchObject({ id: 'u1', role: 'admin' });
    });

    it('retorna dados do aluno autenticado', async () => {
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
