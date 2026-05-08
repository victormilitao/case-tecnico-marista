import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { StudentLoginPage } from './StudentLogin';
import { AuthProvider } from '../contexts/AuthContext';
import { authApi } from '../services/auth';

vi.mock('../services/auth', () => ({
  authApi: {
    me: vi.fn(),
    studentLogin: vi.fn(),
    studentSetPassword: vi.fn(),
  },
}));

vi.mock('../assets/logo-marista-site.svg', () => ({ default: 'logo.svg' }));

function setup() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/aluno/login']}>
        <Routes>
          <Route path="/aluno/login" element={<StudentLoginPage />} />
          <Route path="/aluno" element={<div>area-aluno</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

const mocked = (fn: unknown) => fn as ReturnType<typeof vi.fn>;

describe('StudentLoginPage (state machine)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('passo identify -> login quando aluno já tem senha', async () => {
    mocked(authApi.studentLogin).mockResolvedValueOnce({ requiresPassword: true });
    setup();
    await userEvent.type(
      await screen.findByPlaceholderText('Sua matrícula'),
      '123',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(
      await screen.findByRole('heading', { name: 'Bem-vindo de volta' }),
    ).toBeInTheDocument();
  });

  it('passo identify -> set-password quando aluno é primeiro acesso', async () => {
    mocked(authApi.studentLogin).mockResolvedValueOnce({ requiresPasswordSetup: true });
    setup();
    await userEvent.type(
      await screen.findByPlaceholderText('Sua matrícula'),
      '123',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(
      await screen.findByRole('heading', { name: 'Criar senha' }),
    ).toBeInTheDocument();
  });

  it('valida confirmação de senha no passo set-password', async () => {
    mocked(authApi.studentLogin).mockResolvedValueOnce({ requiresPasswordSetup: true });
    setup();
    await userEvent.type(
      await screen.findByPlaceholderText('Sua matrícula'),
      '123',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    const inputs = await screen.findAllByPlaceholderText('••••••••');
    await userEvent.type(inputs[0], 'abc123');
    await userEvent.type(inputs[1], 'diferente');
    await userEvent.click(screen.getByRole('button', { name: /Criar senha e entrar/i }));

    expect(await screen.findByText('As senhas não conferem.')).toBeInTheDocument();
    expect(authApi.studentSetPassword).not.toHaveBeenCalled();
  });

  it('login bem-sucedido aplica sessão e navega para /aluno', async () => {
    mocked(authApi.studentLogin)
      .mockResolvedValueOnce({ requiresPassword: true })
      .mockResolvedValueOnce({
        accessToken: 't',
        user: { id: 's1', name: 'Ana', email: 'a@x.com', role: 'student', registration: '123' },
      });
    setup();
    await userEvent.type(
      await screen.findByPlaceholderText('Sua matrícula'),
      '123',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    await userEvent.type(
      await screen.findByPlaceholderText('Sua senha'),
      'pwd123',
    );
    await userEvent.click(screen.getByRole('button', { name: /^Entrar$/i }));
    await waitFor(() =>
      expect(screen.getByText('area-aluno')).toBeInTheDocument(),
    );
  });

  it('botão "Trocar matrícula" volta para o passo identify', async () => {
    mocked(authApi.studentLogin).mockResolvedValueOnce({ requiresPassword: true });
    setup();
    await userEvent.type(
      await screen.findByPlaceholderText('Sua matrícula'),
      '123',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    await userEvent.click(
      await screen.findByRole('button', { name: /Trocar matrícula/i }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Área do aluno' }),
    ).toBeInTheDocument();
  });
});
