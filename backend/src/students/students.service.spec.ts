import { ConflictException, NotFoundException } from '@nestjs/common';
import { StudentsService } from './students.service';
import { createDbMock, DbMock } from '../../test/db-mock';

describe('StudentsService', () => {
  let service: StudentsService;
  let db: DbMock;

  beforeEach(() => {
    db = createDbMock();
    service = new StudentsService(db as never);
  });

  describe('create', () => {
    it('creates student when there is no conflict', async () => {
      db.queueResult([]);
      const created = { id: 'uuid-1', registration: '123', name: 'Ana', email: 'a@x.com' };
      db.queueResult([created]);

      const result = await service.create({
        registration: '123',
        name: 'Ana',
        email: 'a@x.com',
      });

      expect(result).toEqual(created);
      expect(db.insert).toHaveBeenCalledTimes(1);
    });

    it('throws ConflictException when registration already exists', async () => {
      db.queueResult([{ registration: '123', email: 'outra@x.com' }]);

      await expect(
        service.create({ registration: '123', name: 'Ana', email: 'a@x.com' }),
      ).rejects.toThrow(/Matrícula já cadastrada/);
    });

    it('throws ConflictException when email already exists', async () => {
      db.queueResult([{ registration: 'outra', email: 'a@x.com' }]);

      await expect(
        service.create({ registration: '123', name: 'Ana', email: 'a@x.com' }),
      ).rejects.toThrow('E-mail já cadastrado');
    });
  });

  describe('findOne', () => {
    it('returns the student when found', async () => {
      const student = { id: 'uuid-1', name: 'Ana' };
      db.queueResult([student]);

      const result = await service.findOne('uuid-1');
      expect(result).toEqual(student);
    });

    it('throws NotFoundException when not found', async () => {
      db.queueResult([]);
      await expect(service.findOne('uuid-x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates an existing student and re-checks uniqueness when email changes', async () => {
      db.queueResult([{ id: 'uuid-1' }]);
      db.queueResult([]);
      const updated = { id: 'uuid-1', name: 'Ana B', email: 'b@x.com' };
      db.queueResult([updated]);

      const result = await service.update('uuid-1', { email: 'b@x.com' });
      expect(result).toEqual(updated);
    });

    it('skips uniqueness check when registration and email are not provided', async () => {
      db.queueResult([{ id: 'uuid-1' }]);
      const updated = { id: 'uuid-1', name: 'Ana B' };
      db.queueResult([updated]);

      const result = await service.update('uuid-1', { name: 'Ana B' });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when student does not exist', async () => {
      db.queueResult([]);
      await expect(
        service.update('uuid-x', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes student and returns the id', async () => {
      db.queueResult([{ id: 'uuid-1' }]);
      await expect(service.remove('uuid-1')).resolves.toEqual({ id: 'uuid-1' });
    });

    it('throws NotFoundException when student does not exist', async () => {
      db.queueResult([]);
      await expect(service.remove('uuid-x')).rejects.toThrow(NotFoundException);
    });
  });
});
