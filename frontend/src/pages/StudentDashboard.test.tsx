import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { StudentDashboardPage } from './StudentDashboard';
import { AuthProvider } from '../contexts/AuthContext';
import { authApi } from '../services/auth';
import { meApi } from '../services/me';
import { TOKEN_KEY } from '../services/api';

vi.mock('../services/auth', () => ({
  authApi: { me: vi.fn(), login: vi.fn() },
}));
vi.mock('../services/me', () => ({
  meApi: {
    rooms: vi.fn(),
    status: vi.fn(),
    attendance: vi.fn(),
    checkIn: vi.fn(),
    checkOut: vi.fn(),
  },
}));

const mocked = (fn: unknown) => fn as ReturnType<typeof vi.fn>;

function setup() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/aluno']}>
        <Routes>
          <Route path="/aluno" element={<StudentDashboardPage />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

const sampleRooms = [
  { id: 'r1', name: 'Lab A', type: 'laboratory' as const, capacity: 10, createdAt: '', updatedAt: '' },
  { id: 'r2', name: 'Sala 1', type: 'classroom' as const, capacity: 30, createdAt: '', updatedAt: '' },
];

describe('StudentDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem(TOKEN_KEY, 't');
    mocked(authApi.me).mockResolvedValue({
      id: 's1', name: 'Ana Silva', email: 'a@x.com', role: 'student', registration: '123',
    });
    mocked(meApi.rooms).mockResolvedValue(sampleRooms);
    mocked(meApi.attendance).mockResolvedValue([]);
  });

  it('mostra formulário de check-in quando aluno não tem check-in aberto', async () => {
    mocked(meApi.status).mockResolvedValue({ activeCheckIn: null });
    setup();
    expect(await screen.findByText(/Olá, Ana!/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Selecione o ambiente/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Registrar entrada/i })).toBeDisabled();
  });

  it('habilita check-in após escolher ambiente e envia roomId', async () => {
    mocked(meApi.status)
      .mockResolvedValueOnce({ activeCheckIn: null })
      .mockResolvedValueOnce({
        activeCheckIn: {
          id: 'a1',
          checkInAt: new Date().toISOString(),
          room: { id: 'r1', name: 'Lab A', type: 'laboratory' },
        },
      });
    mocked(meApi.checkIn).mockResolvedValue({} as never);
    setup();

    await userEvent.selectOptions(
      await screen.findByLabelText(/Selecione o ambiente/i),
      'r1',
    );
    await userEvent.click(screen.getByRole('button', { name: /Registrar entrada/i }));
    await waitFor(() => expect(meApi.checkIn).toHaveBeenCalledWith('r1'));
    expect(await screen.findByText(/Entrada registrada/i)).toBeInTheDocument();
  });

  it('mostra info do check-in ativo e permite checkout', async () => {
    mocked(meApi.status)
      .mockResolvedValueOnce({
        activeCheckIn: {
          id: 'a1',
          checkInAt: new Date().toISOString(),
          room: { id: 'r1', name: 'Lab A', type: 'laboratory' },
        },
      })
      .mockResolvedValueOnce({ activeCheckIn: null });
    mocked(meApi.checkOut).mockResolvedValue({} as never);
    setup();

    expect(await screen.findByText('Lab A')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Registrar saída/i }));
    await waitFor(() => expect(meApi.checkOut).toHaveBeenCalled());
    expect(await screen.findByText(/Saída registrada/i)).toBeInTheDocument();
  });

  it('exibe erro quando check-in falha', async () => {
    mocked(meApi.status).mockResolvedValue({ activeCheckIn: null });
    mocked(meApi.checkIn).mockRejectedValue(
      Object.assign(new Error('boom'), {
        isAxiosError: true,
        response: { data: { message: 'Capacidade esgotada' } },
      }),
    );
    setup();
    await userEvent.selectOptions(
      await screen.findByLabelText(/Selecione o ambiente/i),
      'r1',
    );
    await userEvent.click(screen.getByRole('button', { name: /Registrar entrada/i }));
    expect(await screen.findByText('Capacidade esgotada')).toBeInTheDocument();
  });

  it('mostra "Você ainda não tem registros" quando histórico vazio', async () => {
    mocked(meApi.status).mockResolvedValue({ activeCheckIn: null });
    setup();
    expect(
      await screen.findByText(/Você ainda não tem registros/i),
    ).toBeInTheDocument();
  });
});
