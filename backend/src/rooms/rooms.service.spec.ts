import { NotFoundException } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { createDbMock, DbMock } from '../../test/db-mock';

describe('RoomsService', () => {
  let service: RoomsService;
  let db: DbMock;

  beforeEach(() => {
    db = createDbMock();
    service = new RoomsService(db as never);
  });

  it('create insere e retorna o ambiente', async () => {
    const room = { id: 'r1', name: 'Lab 1', type: 'laboratory', capacity: 10 };
    db.queueResult([room]);

    const result = await service.create({
      name: 'Lab 1',
      type: 'laboratory',
      capacity: 10,
    });
    expect(result).toEqual(room);
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it('findOne retorna o ambiente', async () => {
    const room = { id: 'r1', name: 'Lab 1' };
    db.queueResult([room]);
    await expect(service.findOne('r1')).resolves.toEqual(room);
  });

  it('findOne lança NotFound quando inexistente', async () => {
    db.queueResult([]);
    await expect(service.findOne('r1')).rejects.toThrow(NotFoundException);
  });

  it('update modifica e retorna o ambiente', async () => {
    db.queueResult([{ id: 'r1' }]); // findOne
    const updated = { id: 'r1', name: 'Lab 1 - Renomeada', capacity: 20 };
    db.queueResult([updated]);

    const result = await service.update('r1', {
      name: 'Lab 1 - Renomeada',
      capacity: 20,
    });
    expect(result).toEqual(updated);
  });

  it('update falha quando ambiente não existe', async () => {
    db.queueResult([]);
    await expect(service.update('r1', { name: 'X' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('remove deleta e retorna o id', async () => {
    db.queueResult([{ id: 'r1' }]);
    await expect(service.remove('r1')).resolves.toEqual({ id: 'r1' });
  });

  it('remove lança NotFound quando inexistente', async () => {
    db.queueResult([]);
    await expect(service.remove('r1')).rejects.toThrow(NotFoundException);
  });
});
