import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoomsPage } from './Rooms';
import { roomsApi } from '../services/rooms';

vi.mock('../services/rooms', () => ({
  roomsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    occupancy: vi.fn(),
  },
}));

const mocked = (fn: unknown) => fn as ReturnType<typeof vi.fn>;

const sampleRooms = [
  { id: 'r1', name: 'Lab A', type: 'laboratory' as const, capacity: 10, createdAt: '', updatedAt: '' },
  { id: 'r2', name: 'Sala 101', type: 'classroom' as const, capacity: 30, createdAt: '', updatedAt: '' },
];

describe('RoomsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked(roomsApi.list).mockResolvedValue(sampleRooms);
  });

  it('lists rooms with translated type label', async () => {
    render(<RoomsPage />);
    expect(await screen.findByText('Lab A')).toBeInTheDocument();
    expect(screen.getByText('Laboratório')).toBeInTheDocument();
    expect(screen.getByText('Sala de aula')).toBeInTheDocument();
  });

  it('creates room converting capacity to Number', async () => {
    mocked(roomsApi.create).mockResolvedValue({} as never);
    render(<RoomsPage />);
    await screen.findByText('Lab A');

    await userEvent.click(screen.getByRole('button', { name: /Novo ambiente/i }));
    await userEvent.type(screen.getByLabelText('Nome'), 'Lab B');
    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'study_room');
    const cap = screen.getByLabelText('Capacidade');
    await userEvent.clear(cap);
    await userEvent.type(cap, '12');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(roomsApi.create).toHaveBeenCalledWith({
        name: 'Lab B',
        type: 'study_room',
        capacity: 12,
      }),
    );
  });

  it('edits room preserving form fields', async () => {
    mocked(roomsApi.update).mockResolvedValue({} as never);
    render(<RoomsPage />);
    const row = (await screen.findByText('Lab A')).closest('tr')!;
    await userEvent.click(within(row).getByRole('button', { name: 'Editar' }));

    expect(await screen.findByLabelText('Nome')).toHaveValue('Lab A');
    const cap = screen.getByLabelText('Capacidade');
    await userEvent.clear(cap);
    await userEvent.type(cap, '20');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(roomsApi.update).toHaveBeenCalledWith(
        'r1',
        expect.objectContaining({ capacity: 20 }),
      ),
    );
  });

  it('shows backend error inside the modal', async () => {
    mocked(roomsApi.create).mockRejectedValue(
      Object.assign(new Error('boom'), {
        isAxiosError: true,
        response: { data: { message: 'Capacidade inválida' } },
      }),
    );
    render(<RoomsPage />);
    await screen.findByText('Lab A');
    await userEvent.click(screen.getByRole('button', { name: /Novo ambiente/i }));
    await userEvent.type(screen.getByLabelText('Nome'), 'X');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Capacidade inválida')).toBeInTheDocument();
  });
});
