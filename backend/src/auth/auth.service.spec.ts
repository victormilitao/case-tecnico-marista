import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { createDbMock, DbMock } from '../../test/db-mock';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let db: DbMock;
  let jwt: jest.Mocked<JwtService>;
  const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(() => {
    db = createDbMock();
    jwt = { sign: jest.fn(() => 'signed.jwt.token') } as unknown as jest.Mocked<JwtService>;
    service = new AuthService(db as never, jwt);
    bcryptMock.hash.mockReset();
    bcryptMock.compare.mockReset();
  });

  describe('register', () => {
    it('cria usuário admin e retorna token', async () => {
      db.queueResult([]); // existing check
      bcryptMock.hash.mockResolvedValue('hashed' as never);
      const created = { id: 'u1', name: 'Admin', email: 'a@x.com' };
      db.queueResult([created]); // insert.returning

      const result = await service.register({
        name: 'Admin',
        email: 'a@x.com',
        password: 'pwd12345',
      });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user).toMatchObject({ id: 'u1', role: 'admin' });
      expect(bcryptMock.hash).toHaveBeenCalledWith('pwd12345', 10);
    });

    it('falha com ConflictException quando email já existe', async () => {
      db.queueResult([{ id: 'u-existente' }]);
      await expect(
        service.register({ name: 'A', email: 'a@x.com', password: 'pwd12345' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('autentica e retorna token quando senha confere', async () => {
      db.queueResult([
        { id: 'u1', name: 'Admin', email: 'a@x.com', passwordHash: 'h' },
      ]);
      bcryptMock.compare.mockResolvedValue(true as never);

      const result = await service.login({ email: 'a@x.com', password: 'p' });
      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user.role).toBe('admin');
    });

    it('falha quando usuário não existe', async () => {
      db.queueResult([]);
      await expect(
        service.login({ email: 'a@x.com', password: 'p' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('falha quando senha não confere', async () => {
      db.queueResult([
        { id: 'u1', name: 'Admin', email: 'a@x.com', passwordHash: 'h' },
      ]);
      bcryptMock.compare.mockResolvedValue(false as never);
      await expect(
        service.login({ email: 'a@x.com', password: 'p' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('studentLogin', () => {
    it('retorna requiresPasswordSetup quando aluno não tem senha', async () => {
      db.queueResult([
        { id: 's1', registration: '123', passwordHash: null },
      ]);
      const result = await service.studentLogin({ registration: '123' });
      expect(result).toEqual({ requiresPasswordSetup: true });
    });

    it('retorna requiresPassword quando senha não foi enviada', async () => {
      db.queueResult([
        { id: 's1', registration: '123', passwordHash: 'h' },
      ]);
      const result = await service.studentLogin({ registration: '123' });
      expect(result).toEqual({ requiresPassword: true });
    });

    it('autentica quando senha confere', async () => {
      db.queueResult([
        {
          id: 's1',
          name: 'Aluno',
          email: 'a@x.com',
          registration: '123',
          passwordHash: 'h',
        },
      ]);
      bcryptMock.compare.mockResolvedValue(true as never);

      const result = await service.studentLogin({
        registration: '123',
        password: 'p',
      });
      expect(result).toMatchObject({
        accessToken: 'signed.jwt.token',
        user: { role: 'student', registration: '123' },
      });
    });

    it('falha quando matrícula não existe', async () => {
      db.queueResult([]);
      await expect(
        service.studentLogin({ registration: '999' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('falha quando senha incorreta', async () => {
      db.queueResult([
        { id: 's1', registration: '123', passwordHash: 'h', email: '', name: '' },
      ]);
      bcryptMock.compare.mockResolvedValue(false as never);
      await expect(
        service.studentLogin({ registration: '123', password: 'p' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('studentSetPassword', () => {
    it('define senha quando aluno ainda não tem', async () => {
      db.queueResult([
        {
          id: 's1',
          name: 'Aluno',
          email: 'a@x.com',
          registration: '123',
          passwordHash: null,
        },
      ]);
      bcryptMock.hash.mockResolvedValue('hashed' as never);
      db.queueResult([{ id: 's1' }]); // update returning (não usado aqui, mas chain consome)

      const result = await service.studentSetPassword({
        registration: '123',
        password: 'pwd123',
      });
      expect(result).toMatchObject({
        accessToken: 'signed.jwt.token',
        user: { role: 'student' },
      });
      expect(db.update).toHaveBeenCalled();
    });

    it('falha com NotFound quando matrícula não existe', async () => {
      db.queueResult([]);
      await expect(
        service.studentSetPassword({ registration: '999', password: 'p' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('falha com BadRequest quando aluno já tem senha', async () => {
      db.queueResult([{ id: 's1', registration: '123', passwordHash: 'h' }]);
      await expect(
        service.studentSetPassword({ registration: '123', password: 'p' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
