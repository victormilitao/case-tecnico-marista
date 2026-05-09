import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from './Login';
import { AuthProvider } from '../contexts/AuthContext';
import { authApi } from '../services/auth';

vi.mock('../services/auth', () => ({
  authApi: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
  },
}));

vi.mock('../assets/logo-marista-site.svg', () => ({ default: 'logo.svg' }));

function setup() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>dashboard</div>} />
          <Route path="/" element={<div>home</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows the login form by default', async () => {
    setup();
    expect(await screen.findByRole('heading', { name: 'Área administrativa' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
  });

  it('switches to register mode when clicking "Cadastre-se"', async () => {
    setup();
    await userEvent.click(
      await screen.findByRole('button', { name: /Cadastre-se/i }),
    );
    expect(screen.getByRole('heading', { name: 'Criar conta' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Seu nome completo')).toBeInTheDocument();
  });

  it('logs in successfully and navigates to /dashboard', async () => {
    (authApi.login as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      accessToken: 't',
      user: { id: 'u1', name: 'A', email: 'a@x.com', role: 'admin' },
    });
    setup();
    await userEvent.type(
      await screen.findByPlaceholderText('seu@email.com'),
      'a@x.com',
    );
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'pwd12345');
    await userEvent.click(screen.getByRole('button', { name: /Entrar/i }));
    await waitFor(() => expect(screen.getByText('dashboard')).toBeInTheDocument());
  });

  it('shows error when login fails', async () => {
    const err = Object.assign(new Error('boom'), {
      isAxiosError: true,
      response: { data: { message: 'Credenciais inválidas' } },
    });
    (authApi.login as never as ReturnType<typeof vi.fn>).mockRejectedValue(err);
    setup();
    await userEvent.type(
      await screen.findByPlaceholderText('seu@email.com'),
      'a@x.com',
    );
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'pwd12345');
    await userEvent.click(screen.getByRole('button', { name: /Entrar/i }));
    expect(await screen.findByText(/Credenciais inválidas|Falha na autentica/i)).toBeInTheDocument();
  });
});
