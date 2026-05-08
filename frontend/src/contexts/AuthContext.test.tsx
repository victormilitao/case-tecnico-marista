import { describe, expect, it, beforeEach, vi } from 'vitest';
import { act, render, renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { authApi } from '../services/auth';
import { TOKEN_KEY } from '../services/api';

vi.mock('../services/auth', () => ({
  authApi: {
    login: vi.fn(),
    me: vi.fn(),
  },
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('inicia com user=null e loading=false quando não há token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(authApi.me).not.toHaveBeenCalled();
  });

  it('busca o usuário com token salvo no bootstrap', async () => {
    localStorage.setItem(TOKEN_KEY, 't');
    (authApi.me as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'u1',
      name: 'Admin',
      email: 'a@x.com',
      role: 'admin',
    });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user?.id).toBe('u1');
  });

  it('limpa token quando authApi.me falha', async () => {
    localStorage.setItem(TOKEN_KEY, 't-invalido');
    (authApi.me as never as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('401'),
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('login persiste token e seta user', async () => {
    (authApi.login as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      accessToken: 'novo-token',
      user: { id: 'u1', name: 'A', email: 'a@x.com', role: 'admin' },
    });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.login('a@x.com', 'p');
    });
    expect(localStorage.getItem(TOKEN_KEY)).toBe('novo-token');
    expect(result.current.user?.id).toBe('u1');
  });

  it('applySession seta token e user diretamente (fluxo do aluno)', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.applySession('t-aluno', {
        id: 's1',
        name: 'Ana',
        email: 'a@x.com',
        role: 'student',
        registration: '123',
      });
    });
    expect(localStorage.getItem(TOKEN_KEY)).toBe('t-aluno');
    expect(result.current.user?.role).toBe('student');
  });

  it('logout limpa token e zera user', async () => {
    localStorage.setItem(TOKEN_KEY, 't');
    (authApi.me as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'u1',
      name: 'Admin',
      email: 'a@x.com',
      role: 'admin',
    });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user?.id).toBe('u1'));
    act(() => result.current.logout());
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('useAuth fora do provider lança erro', () => {
    // Renderizamos um componente filho que usa o hook sem provider
    const Bad = () => {
      useAuth();
      return null;
    };
    const original = console.error;
    console.error = () => {};
    expect(() => render(<Bad />)).toThrow(/within AuthProvider/);
    console.error = original;
  });
});
