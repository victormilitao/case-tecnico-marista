import { describe, expect, it, beforeEach, vi } from 'vitest';
import { api } from './api';
import { authApi } from './auth';

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  TOKEN_KEY: 'marista.token',
}));

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('login posts to /auth/login and unwraps data', async () => {
    (api.post as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { accessToken: 't', user: { id: 'u1', role: 'admin' } },
    });
    const res = await authApi.login('a@x.com', 'p');
    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'a@x.com',
      password: 'p',
    });
    expect(res.accessToken).toBe('t');
  });

  it('register sends name/email/password', async () => {
    (api.post as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { accessToken: 't', user: { id: 'u1' } },
    });
    await authApi.register('Ana', 'a@x.com', 'p');
    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      name: 'Ana',
      email: 'a@x.com',
      password: 'p',
    });
  });

  it('me calls GET /auth/me', async () => {
    (api.get as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { id: 'u1', role: 'admin' },
    });
    const res = await authApi.me();
    expect(api.get).toHaveBeenCalledWith('/auth/me');
    expect(res.id).toBe('u1');
  });

  it('studentLogin sends optional password', async () => {
    (api.post as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { requiresPasswordSetup: true },
    });
    await authApi.studentLogin('123');
    expect(api.post).toHaveBeenCalledWith('/auth/student/login', {
      registration: '123',
      password: undefined,
    });
  });

  it('studentSetPassword posts to the correct endpoint', async () => {
    (api.post as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { accessToken: 't', user: { id: 's1' } },
    });
    await authApi.studentSetPassword('123', 'pwd');
    expect(api.post).toHaveBeenCalledWith('/auth/student/set-password', {
      registration: '123',
      password: 'pwd',
    });
  });
});
