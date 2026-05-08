import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthProvider } from '../contexts/AuthContext';
import { authApi } from '../services/auth';
import { TOKEN_KEY } from '../services/api';

vi.mock('../services/auth', () => ({
  authApi: { me: vi.fn(), login: vi.fn() },
}));

function renderAt(path: string, requiredRole?: 'admin' | 'student') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<ProtectedRoute role={requiredRole} />}>
            <Route path="/dashboard" element={<div>area-admin</div>} />
            <Route path="/aluno" element={<div>area-aluno</div>} />
          </Route>
          <Route path="/login" element={<div>login-admin</div>} />
          <Route path="/aluno/login" element={<div>login-aluno</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('redireciona para /login quando não autenticado e não exige role student', async () => {
    renderAt('/dashboard');
    await waitFor(() =>
      expect(screen.getByText('login-admin')).toBeInTheDocument(),
    );
  });

  it('redireciona para /aluno/login quando rota requer role=student', async () => {
    renderAt('/aluno', 'student');
    await waitFor(() =>
      expect(screen.getByText('login-aluno')).toBeInTheDocument(),
    );
  });

  it('libera acesso quando role do usuário bate com a exigência', async () => {
    localStorage.setItem(TOKEN_KEY, 't');
    (authApi.me as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'u1',
      name: 'A',
      email: 'a@x.com',
      role: 'admin',
    });
    renderAt('/dashboard', 'admin');
    await waitFor(() =>
      expect(screen.getByText('area-admin')).toBeInTheDocument(),
    );
  });

  it('redireciona admin para /dashboard ao tentar entrar em rota de aluno', async () => {
    localStorage.setItem(TOKEN_KEY, 't');
    (authApi.me as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'u1',
      name: 'A',
      email: 'a@x.com',
      role: 'admin',
    });
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/aluno']}>
          <Routes>
            <Route element={<ProtectedRoute role="student" />}>
              <Route path="/aluno" element={<div>area-aluno</div>} />
            </Route>
            <Route path="/dashboard" element={<div>destino-admin</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByText('destino-admin')).toBeInTheDocument(),
    );
  });
});
