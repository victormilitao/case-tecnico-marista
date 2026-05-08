import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { createDbMock, DbMock } from '../../test/db-mock';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let db: DbMock;

  beforeEach(() => {
    db = createDbMock();
    service = new AttendanceService(db as never);
  });

  describe('checkIn', () => {
    const dto = { studentId: 's1', roomId: 'r1' };

    it('cria check-in quando aluno e sala existem e há vaga', async () => {
      db.queueResult([{ id: 's1' }]); // student
      db.queueResult([{ id: 'r1', capacity: 10, name: 'Lab' }]); // room
      db.queueResult([]); // open for student
      db.queueResult([]); // occupants
      const created = { id: 'a1', studentId: 's1', roomId: 'r1' };
      db.queueResult([created]);

      await expect(service.checkIn(dto)).resolves.toEqual(created);
    });

    it('falha quando aluno não existe', async () => {
      db.queueResult([]);
      await expect(service.checkIn(dto)).rejects.toThrow(NotFoundException);
    });

    it('falha quando sala não existe', async () => {
      db.queueResult([{ id: 's1' }]);
      db.queueResult([]);
      await expect(service.checkIn(dto)).rejects.toThrow(NotFoundException);
    });

    it('falha quando aluno já está em uma sala', async () => {
      db.queueResult([{ id: 's1' }]);
      db.queueResult([{ id: 'r1', capacity: 10, name: 'Lab' }]);
      db.queueResult([{ id: 'a-aberto', roomId: 'r2' }]);
      await expect(service.checkIn(dto)).rejects.toThrow(ConflictException);
    });

    it('falha quando capacidade está esgotada', async () => {
      db.queueResult([{ id: 's1' }]);
      db.queueResult([{ id: 'r1', capacity: 2, name: 'Lab' }]);
      db.queueResult([]); // sem check-in aberto
      db.queueResult([{ id: 'a1' }, { id: 'a2' }]); // 2 ocupantes (capacidade 2)
      await expect(service.checkIn(dto)).rejects.toThrow(/capacidade máxima/);
    });
  });

  describe('checkOut', () => {
    it('finaliza check-in aberto e retorna duração', async () => {
      const checkInAt = new Date(Date.now() - 30 * 60_000); // 30 min atrás
      db.queueResult([{ id: 'a1', studentId: 's1', checkInAt }]);
      const checkOutAt = new Date();
      db.queueResult([{ id: 'a1', studentId: 's1', checkInAt, checkOutAt }]);

      const result = await service.checkOut({ studentId: 's1' });
      expect(result.id).toBe('a1');
      expect(result.durationMinutes).toBeGreaterThanOrEqual(29);
      expect(result.durationMinutes).toBeLessThanOrEqual(31);
    });

    it('falha quando não há check-in aberto', async () => {
      db.queueResult([]);
      await expect(
        service.checkOut({ studentId: 's1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkInByRegistration / checkOutByRegistration', () => {
    it('checkInByRegistration converte registration em studentId', async () => {
      db.queueResult([{ id: 's1', name: 'Ana' }]); // findStudentByRegistration
      // chain do checkIn:
      db.queueResult([{ id: 's1' }]);
      db.queueResult([{ id: 'r1', capacity: 5, name: 'Lab' }]);
      db.queueResult([]);
      db.queueResult([]);
      db.queueResult([{ id: 'a1' }]);

      await expect(
        service.checkInByRegistration('123', 'r1'),
      ).resolves.toEqual({ id: 'a1' });
    });

    it('checkInByRegistration falha quando matrícula não existe', async () => {
      db.queueResult([]);
      await expect(
        service.checkInByRegistration('999', 'r1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStatusByRegistration', () => {
    it('retorna found=false quando matrícula não existe', async () => {
      db.queueResult([]);
      await expect(
        service.getStatusByRegistration('999'),
      ).resolves.toEqual({ found: false, activeCheckIn: null });
    });

    it('retorna activeCheckIn=null quando aluno não tem check-in aberto', async () => {
      db.queueResult([{ id: 's1', name: 'Ana' }]);
      db.queueResult([]);
      const result = await service.getStatusByRegistration('123');
      expect(result.found).toBe(true);
      expect(result.activeCheckIn).toBeNull();
    });

    it('retorna o check-in aberto quando existe', async () => {
      db.queueResult([{ id: 's1', name: 'Ana' }]);
      const open = {
        id: 'a1',
        checkInAt: new Date(),
        room: { id: 'r1', name: 'Lab', type: 'laboratory' },
      };
      db.queueResult([open]);
      const result = await service.getStatusByRegistration('123');
      expect(result.activeCheckIn).toEqual(open);
    });
  });

  describe('occupancyByRoom', () => {
    it('retorna ocupação corrente da sala', async () => {
      db.queueResult([{ id: 'r1', name: 'Lab', capacity: 4 }]);
      db.queueResult([
        { attendanceId: 'a1', checkInAt: new Date(), student: { id: 's1', name: 'A', registration: '1' } },
        { attendanceId: 'a2', checkInAt: new Date(), student: { id: 's2', name: 'B', registration: '2' } },
      ]);

      const result = await service.occupancyByRoom('r1');
      expect(result.occupancy).toBe(2);
      expect(result.capacity).toBe(4);
      expect(result.occupancyRate).toBe(0.5);
    });

    it('falha quando sala não existe', async () => {
      db.queueResult([]);
      await expect(service.occupancyByRoom('r1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
