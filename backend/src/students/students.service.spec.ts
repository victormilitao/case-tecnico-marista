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
    it('cria aluno quando não há conflito', async () => {
      db.queueResult([]); // assertUniqueness -> sem conflitos
      const created = { id: 'uuid-1', registration: '123', name: 'Ana', email: 'a@x.com' };
      db.queueResult([created]); // insert.returning

      const result = await service.create({
        registration: '123',
        name: 'Ana',
        email: 'a@x.com',
      });

      expect(result).toEqual(created);
      expect(db.insert).toHaveBeenCalledTimes(1);
    });

    it('lança ConflictException quando matrícula já existe', async () => {
      db.queueResult([{ registration: '123', email: 'outra@x.com' }]);

      await expect(
        service.create({ registration: '123', name: 'Ana', email: 'a@x.com' }),
      ).rejects.toThrow(/Matrícula já cadastrada/);
    });

    it('lança ConflictException quando e-mail já existe', async () => {
      db.queueResult([{ registration: 'outra', email: 'a@x.com' }]);

      await expect(
        service.create({ registration: '123', name: 'Ana', email: 'a@x.com' }),
      ).rejects.toThrow('E-mail já cadastrado');
    });
  });

  describe('findOne', () => {
    it('retorna aluno encontrado', async () => {
      const student = { id: 'uuid-1', name: 'Ana' };
      db.queueResult([student]);

      const result = await service.findOne('uuid-1');
      expect(result).toEqual(student);
    });

    it('lança NotFoundException quando não encontrado', async () => {
      db.queueResult([]);
      await expect(service.findOne('uuid-x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('atualiza aluno existente verificando unicidade quando muda email', async () => {
      db.queueResult([{ id: 'uuid-1' }]); // findOne
      db.queueResult([]); // assertUniqueness
      const updated = { id: 'uuid-1', name: 'Ana B', email: 'b@x.com' };
      db.queueResult([updated]); // update.returning

      const result = await service.update('uuid-1', { email: 'b@x.com' });
      expect(result).toEqual(updated);
    });

    it('não verifica unicidade se não enviar registration nem email', async () => {
      db.queueResult([{ id: 'uuid-1' }]); // findOne
      const updated = { id: 'uuid-1', name: 'Ana B' };
      db.queueResult([updated]); // update.returning

      const result = await service.update('uuid-1', { name: 'Ana B' });
      expect(result).toEqual(updated);
    });

    it('falha quando aluno não existe', async () => {
      db.queueResult([]); // findOne -> []
      await expect(
        service.update('uuid-x', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('remove aluno e retorna id', async () => {
      db.queueResult([{ id: 'uuid-1' }]);
      await expect(service.remove('uuid-1')).resolves.toEqual({ id: 'uuid-1' });
    });

    it('falha quando aluno não existe', async () => {
      db.queueResult([]);
      await expect(service.remove('uuid-x')).rejects.toThrow(NotFoundException);
    });
  });
});
