import { ConflictException, NotFoundException } from '@nestjs/common';
import { Student } from './domain/student.entity';
import { StudentsRepository } from './domain/students.repository';
import { StudentsService } from './students.service';

function createRepoMock(): jest.Mocked<StudentsRepository> {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findRegistrationEmailConflict: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

const studentFixture = (overrides: Partial<Student> = {}): Student => ({
  id: 'uuid-1',
  registration: '123',
  name: 'Ana',
  email: 'a@x.com',
  passwordHash: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('StudentsService', () => {
  let service: StudentsService;
  let repo: jest.Mocked<StudentsRepository>;

  beforeEach(() => {
    repo = createRepoMock();
    service = new StudentsService(repo);
  });

  describe('create', () => {
    it('creates student when there is no conflict', async () => {
      repo.findRegistrationEmailConflict.mockResolvedValue(null);
      const created = studentFixture();
      repo.create.mockResolvedValue(created);

      const result = await service.create({
        registration: '123',
        name: 'Ana',
        email: 'a@x.com',
      });

      expect(result).toEqual(created);
      expect(repo.create).toHaveBeenCalledTimes(1);
    });

    it('throws ConflictException when registration already exists', async () => {
      repo.findRegistrationEmailConflict.mockResolvedValue({
        registration: '123',
        email: 'outra@x.com',
      });

      await expect(
        service.create({ registration: '123', name: 'Ana', email: 'a@x.com' }),
      ).rejects.toThrow(/Matrícula já cadastrada/);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when email already exists', async () => {
      repo.findRegistrationEmailConflict.mockResolvedValue({
        registration: 'outra',
        email: 'a@x.com',
      });

      await expect(
        service.create({ registration: '123', name: 'Ana', email: 'a@x.com' }),
      ).rejects.toThrow('E-mail já cadastrado');
    });
  });

  describe('findOne', () => {
    it('returns the student when found', async () => {
      const student = studentFixture();
      repo.findById.mockResolvedValue(student);
      await expect(service.findOne('uuid-1')).resolves.toEqual(student);
    });

    it('throws NotFoundException when not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findOne('uuid-x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates an existing student and re-checks uniqueness when email changes', async () => {
      repo.findById.mockResolvedValue(studentFixture());
      repo.findRegistrationEmailConflict.mockResolvedValue(null);
      const updated = studentFixture({ email: 'b@x.com' });
      repo.update.mockResolvedValue(updated);

      const result = await service.update('uuid-1', { email: 'b@x.com' });
      expect(result).toEqual(updated);
      expect(repo.findRegistrationEmailConflict).toHaveBeenCalledWith(
        undefined,
        'b@x.com',
        'uuid-1',
      );
    });

    it('skips uniqueness check when registration and email are not provided', async () => {
      repo.findById.mockResolvedValue(studentFixture());
      const updated = studentFixture({ name: 'Ana B' });
      repo.update.mockResolvedValue(updated);

      const result = await service.update('uuid-1', { name: 'Ana B' });
      expect(result).toEqual(updated);
      expect(repo.findRegistrationEmailConflict).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when student does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.update('uuid-x', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes student and returns the id', async () => {
      repo.delete.mockResolvedValue(true);
      await expect(service.remove('uuid-1')).resolves.toEqual({ id: 'uuid-1' });
    });

    it('throws NotFoundException when student does not exist', async () => {
      repo.delete.mockResolvedValue(false);
      await expect(service.remove('uuid-x')).rejects.toThrow(NotFoundException);
    });
  });
});
