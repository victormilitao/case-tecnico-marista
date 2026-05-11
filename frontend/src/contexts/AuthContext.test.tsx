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

  it('starts with user=null and loading=false when there is no token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(authApi.me).not.toHaveBeenCalled();
  });

  it('fetches the user on bootstrap when a token exists', async () => {
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

  it('clears the token when authApi.me fails', async () => {
    localStorage.setItem(TOKEN_KEY, 't-invalid');
    (authApi.me as never as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('401'),
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('login persists the token and sets the user', async () => {
    (authApi.login as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      accessToken: 'new-token',
      user: { id: 'u1', name: 'A', email: 'a@x.com', role: 'admin' },
    });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.login('a@x.com', 'p');
    });
    expect(localStorage.getItem(TOKEN_KEY)).toBe('new-token');
    expect(result.current.user?.id).toBe('u1');
  });

  it('applySession sets token and user directly (student flow)', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.applySession('student-token', {
        id: 's1',
        name: 'Ana',
        email: 'a@x.com',
        role: 'student',
        registration: '123',
      });
    });
    expect(localStorage.getItem(TOKEN_KEY)).toBe('student-token');
    expect(result.current.user?.role).toBe('student');
  });

  it('logout clears token and resets user', async () => {
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

  it('useAuth throws when used outside the provider', () => {
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
