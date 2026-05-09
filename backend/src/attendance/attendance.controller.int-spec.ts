import request from 'supertest';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { createDbMock, DbMock } from '../../test/db-mock';
import { asTestUser, AppHandle, createTestApp } from '../../test/setup-app';

describe('AttendanceController (integration)', () => {
  let handle: AppHandle;
  let db: DbMock;
  const adminHeader = asTestUser({ id: 'u1', role: 'admin' });
  const studentHeader = asTestUser({ id: 's1', role: 'student' });

  beforeEach(async () => {
    db = createDbMock();
    handle = await createTestApp({
      controllers: [AttendanceController],
      providers: [AttendanceService],
      db: db as never,
    });
  });

  afterEach(() => handle.close());

  it('GET /api/attendance is forbidden for students', async () => {
    await request(handle.app.getHttpServer())
      .get('/api/attendance')
      .set('X-Test-User', studentHeader)
      .expect(403);
  });

  it('GET /api/attendance lists for admin', async () => {
    db.queueResult([
      {
        id: 'a1',
        checkInAt: new Date().toISOString(),
        checkOutAt: null,
        student: { id: 's1', name: 'Ana', registration: '1' },
        room: { id: 'r1', name: 'Lab', type: 'laboratory' },
      },
    ]);
    const res = await request(handle.app.getHttpServer())
      .get('/api/attendance')
      .set('X-Test-User', adminHeader)
      .expect(200);
    expect(res.body).toHaveLength(1);
  });

  it('GET /api/attendance accepts valid filters', async () => {
    db.queueResult([]);
    await request(handle.app.getHttpServer())
      .get('/api/attendance')
      .query({ studentId: '550e8400-e29b-41d4-a716-446655440000' })
      .set('X-Test-User', adminHeader)
      .expect(200);
  });

  it('GET /api/attendance rejects invalid studentId', async () => {
    await request(handle.app.getHttpServer())
      .get('/api/attendance')
      .query({ studentId: 'not-a-uuid' })
      .set('X-Test-User', adminHeader)
      .expect(400);
  });
});
