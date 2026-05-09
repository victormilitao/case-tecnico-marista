import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from './Home';
import { AuthProvider } from '../contexts/AuthContext';
import { authApi } from '../services/auth';
import { TOKEN_KEY } from '../services/api';

vi.mock('../services/auth', () => ({
  authApi: { me: vi.fn(), login: vi.fn() },
}));
vi.mock('../assets/logo-marista-site.svg', () => ({ default: 'logo.svg' }));

function setup() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<div>area-admin</div>} />
          <Route path="/aluno" element={<div>area-aluno</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows both CTAs when not authenticated', async () => {
    setup();
    expect(
      await screen.findByRole('heading', { name: /Controle de Espaços/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Área administrativa/i })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /Área do aluno/i })).toHaveAttribute('href', '/aluno/login');
  });

  it('redirects authenticated admin to /dashboard', async () => {
    localStorage.setItem(TOKEN_KEY, 't');
    (authApi.me as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'u1',
      name: 'A',
      email: 'a@x.com',
      role: 'admin',
    });
    setup();
    await waitFor(() => expect(screen.getByText('area-admin')).toBeInTheDocument());
  });

  it('redirects authenticated student to /aluno', async () => {
    localStorage.setItem(TOKEN_KEY, 't');
    (authApi.me as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 's1',
      name: 'Ana',
      email: 'a@x.com',
      role: 'student',
      registration: '123',
    });
    setup();
    await waitFor(() => expect(screen.getByText('area-aluno')).toBeInTheDocument());
  });
});
