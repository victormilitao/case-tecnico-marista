import request from 'supertest';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { createDbMock, DbMock } from '../../test/db-mock';
import { asTestUser, AppHandle, createTestApp } from '../../test/setup-app';

describe('StudentsController (integration)', () => {
  let handle: AppHandle;
  let db: DbMock;
  const adminHeader = asTestUser({ id: 'u1', role: 'admin' });
  const studentHeader = asTestUser({ id: 's1', role: 'student' });

  beforeEach(async () => {
    db = createDbMock();
    handle = await createTestApp({
      controllers: [StudentsController],
      providers: [StudentsService],
      db: db as never,
    });
  });

  afterEach(() => handle.close());

  it('returns 401 without a token', async () => {
    await request(handle.app.getHttpServer()).get('/api/students').expect(401);
  });

  it('returns 403 for student users (admin only)', async () => {
    await request(handle.app.getHttpServer())
      .get('/api/students')
      .set('X-Test-User', studentHeader)
      .expect(403);
  });

  it('GET /api/students lists students for admin', async () => {
    db.queueResult([
      { id: 's1', name: 'Ana' },
      { id: 's2', name: 'Bia' },
    ]);
    const res = await request(handle.app.getHttpServer())
      .get('/api/students')
      .set('X-Test-User', adminHeader)
      .expect(200);
    expect(res.body).toHaveLength(2);
  });

  it('POST /api/students validates required fields', async () => {
    await request(handle.app.getHttpServer())
      .post('/api/students')
      .set('X-Test-User', adminHeader)
      .send({ name: 'Ana' })
      .expect(400);
  });

  it('POST /api/students rejects extra fields (forbidNonWhitelisted)', async () => {
    await request(handle.app.getHttpServer())
      .post('/api/students')
      .set('X-Test-User', adminHeader)
      .send({
        registration: '123',
        name: 'Ana',
        email: 'a@x.com',
        ehHacker: true,
      })
      .expect(400);
  });

  it('POST /api/students creates a student', async () => {
    db.queueResult([]);
    const created = { id: 's1', registration: '123', name: 'Ana', email: 'a@x.com' };
    db.queueResult([created]);

    const res = await request(handle.app.getHttpServer())
      .post('/api/students')
      .set('X-Test-User', adminHeader)
      .send({ registration: '123', name: 'Ana', email: 'a@x.com' })
      .expect(201);
    expect(res.body).toMatchObject(created);
  });

  it('POST /api/students returns 409 when registration already exists', async () => {
    db.queueResult([{ registration: '123', email: 'outra@x.com' }]);
    await request(handle.app.getHttpServer())
      .post('/api/students')
      .set('X-Test-User', adminHeader)
      .send({ registration: '123', name: 'Ana', email: 'a@x.com' })
      .expect(409);
  });

  it('GET /api/students/:id validates UUID format', async () => {
    await request(handle.app.getHttpServer())
      .get('/api/students/not-a-uuid')
      .set('X-Test-User', adminHeader)
      .expect(400);
  });

  it('GET /api/students/:id returns 404 when not found', async () => {
    db.queueResult([]);
    await request(handle.app.getHttpServer())
      .get('/api/students/00000000-0000-0000-0000-000000000000')
      .set('X-Test-User', adminHeader)
      .expect(404);
  });

  it('DELETE /api/students/:id removes and returns id', async () => {
    db.queueResult([{ id: '00000000-0000-0000-0000-000000000001' }]);
    const res = await request(handle.app.getHttpServer())
      .delete('/api/students/00000000-0000-0000-0000-000000000001')
      .set('X-Test-User', adminHeader)
      .expect(200);
    expect(res.body).toEqual({ id: '00000000-0000-0000-0000-000000000001' });
  });
});
