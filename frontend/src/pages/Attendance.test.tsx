import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AttendancePage } from './Attendance';
import { attendanceApi } from '../services/attendance';
import { roomsApi } from '../services/rooms';
import { Attendance } from '../types';

vi.mock('../services/attendance', () => ({
  attendanceApi: { list: vi.fn() },
}));
vi.mock('../services/rooms', () => ({
  roomsApi: { list: vi.fn() },
}));

const mocked = (fn: unknown) => fn as ReturnType<typeof vi.fn>;

const sampleRooms = [
  { id: 'r1', name: 'Lab A', type: 'laboratory' as const, capacity: 10, createdAt: '', updatedAt: '' },
  { id: 'r2', name: 'Sala 1', type: 'classroom' as const, capacity: 30, createdAt: '', updatedAt: '' },
];

function makeHistory(n: number): Attendance[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `a${i}`,
    checkInAt: new Date(2024, 0, 1, 8 + i).toISOString(),
    checkOutAt: i % 2 === 0 ? new Date(2024, 0, 1, 9 + i).toISOString() : null,
    student: {
      id: `s${i}`,
      name: i < 3 ? `Aluno ${i}` : `Outro ${i}`,
      registration: String(100 + i),
    },
    room: { id: 'r1', name: 'Lab A', type: 'laboratory' as const },
  }));
}

describe('AttendancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked(roomsApi.list).mockResolvedValue(sampleRooms);
    mocked(attendanceApi.list).mockResolvedValue(makeHistory(20));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('lista histórico (paginado em 15 por página)', async () => {
    render(<AttendancePage />);
    expect(await screen.findByText('Aluno 0')).toBeInTheDocument();
    // a 20ª linha (index 19) só aparece na página 2
    expect(screen.queryByText('Outro 19')).not.toBeInTheDocument();
    expect(screen.getByText(/Página 1 de 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Mostrando 1–15 de 20/i)).toBeInTheDocument();
  });

  it('navega para a próxima página', async () => {
    render(<AttendancePage />);
    await screen.findByText('Aluno 0');
    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(screen.getByText('Outro 19')).toBeInTheDocument();
    expect(screen.getByText(/Página 2 de 2/i)).toBeInTheDocument();
  });

  it('filtra por nome do aluno (com debounce de 300ms)', async () => {
    render(<AttendancePage />);
    await screen.findByText('Aluno 0');
    await userEvent.type(screen.getByLabelText(/Filtrar por aluno/i), 'Aluno');
    // depois do debounce: só os 3 "Aluno N"
    await waitFor(
      () => expect(screen.queryByText('Outro 5')).not.toBeInTheDocument(),
      { timeout: 1000 },
    );
    expect(screen.getByText('Aluno 0')).toBeInTheDocument();
    expect(screen.getByText(/de 3/i)).toBeInTheDocument();
  });

  it('filtra por ambiente recarregando do backend', async () => {
    render(<AttendancePage />);
    await screen.findByText('Aluno 0');
    mocked(attendanceApi.list).mockClear();
    mocked(attendanceApi.list).mockResolvedValueOnce([]);
    await userEvent.selectOptions(screen.getByLabelText(/Filtrar por ambiente/i), 'r2');
    await waitFor(() =>
      expect(attendanceApi.list).toHaveBeenCalledWith({ roomId: 'r2' }),
    );
    expect(await screen.findByText(/Nenhum registro encontrado/i)).toBeInTheDocument();
  });

  it('mostra estado vazio quando filtro não casa', async () => {
    render(<AttendancePage />);
    await screen.findByText('Aluno 0');
    await userEvent.type(screen.getByLabelText(/Filtrar por aluno/i), 'inexistente');
    expect(
      await screen.findByText(/Nenhum registro encontrado/i, undefined, { timeout: 1000 }),
    ).toBeInTheDocument();
  });
});
