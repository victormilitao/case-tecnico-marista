import { describe, expect, it, beforeEach, vi } from 'vitest';
import { api } from './api';
import { studentsApi } from './students';

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  TOKEN_KEY: 'marista.token',
}));

describe('studentsApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('list calls GET /students', async () => {
    (api.get as never as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
    await studentsApi.list();
    expect(api.get).toHaveBeenCalledWith('/students');
  });

  it('create sends full payload', async () => {
    (api.post as never as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: 's1' } });
    await studentsApi.create({ registration: '1', name: 'A', email: 'a@x.com' });
    expect(api.post).toHaveBeenCalledWith('/students', {
      registration: '1',
      name: 'A',
      email: 'a@x.com',
    });
  });

  it('update sends partial patch with id in path', async () => {
    (api.patch as never as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: 's1' } });
    await studentsApi.update('s1', { name: 'B' });
    expect(api.patch).toHaveBeenCalledWith('/students/s1', { name: 'B' });
  });

  it('remove calls DELETE with id', async () => {
    (api.delete as never as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
    await studentsApi.remove('s1');
    expect(api.delete).toHaveBeenCalledWith('/students/s1');
  });
});
