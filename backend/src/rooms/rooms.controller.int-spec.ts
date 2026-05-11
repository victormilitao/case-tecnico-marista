import request from 'supertest';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { AttendanceService } from '../attendance/attendance.service';
import { createDbMock, DbMock } from '../../test/db-mock';
import { asTestUser, AppHandle, createTestApp } from '../../test/setup-app';

describe('RoomsController (integration)', () => {
  let handle: AppHandle;
  let db: DbMock;
  const adminHeader = asTestUser({ id: 'u1', role: 'admin' });
  const studentHeader = asTestUser({ id: 's1', role: 'student' });

  beforeEach(async () => {
    db = createDbMock();
    handle = await createTestApp({
      controllers: [RoomsController],
      providers: [RoomsService, AttendanceService],
      db: db as never,
    });
  });

  afterEach(() => handle.close());

  it('GET /api/rooms requires admin role', async () => {
    await request(handle.app.getHttpServer())
      .get('/api/rooms')
      .set('X-Test-User', studentHeader)
      .expect(403);
  });

  it('GET /api/rooms lists rooms for admin', async () => {
    db.queueResult([{ id: 'r1', name: 'Lab' }]);
    const res = await request(handle.app.getHttpServer())
      .get('/api/rooms')
      .set('X-Test-User', adminHeader)
      .expect(200);
    expect(res.body).toHaveLength(1);
  });

  it('POST /api/rooms validates payload type', async () => {
    await request(handle.app.getHttpServer())
      .post('/api/rooms')
      .set('X-Test-User', adminHeader)
      .send({ name: 'Lab', type: 'invalid-type', capacity: 10 })
      .expect(400);
  });

  it('POST /api/rooms creates a room', async () => {
    const created = { id: 'r1', name: 'Lab', type: 'laboratory', capacity: 10 };
    db.queueResult([created]);
    const res = await request(handle.app.getHttpServer())
      .post('/api/rooms')
      .set('X-Test-User', adminHeader)
      .send({ name: 'Lab', type: 'laboratory', capacity: 10 })
      .expect(201);
    expect(res.body).toMatchObject(created);
  });

  it('GET /api/rooms/:id/occupancy returns metrics', async () => {
    db.queueResult([{ id: 'r1', name: 'Lab', capacity: 5 }]);
    db.queueResult([
      { attendanceId: 'a1', checkInAt: new Date().toISOString(), student: { id: 's1', name: 'Ana', registration: '1' } },
    ]);
    const res = await request(handle.app.getHttpServer())
      .get('/api/rooms/00000000-0000-0000-0000-000000000010/occupancy')
      .set('X-Test-User', adminHeader)
      .expect(200);
    expect(res.body).toMatchObject({ occupancy: 1, capacity: 5 });
  });
});
