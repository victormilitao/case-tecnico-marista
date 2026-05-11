import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DashboardPage } from './Dashboard';
import { roomsApi } from '../services/rooms';
import { Occupancy } from '../types';

vi.mock('../services/rooms', () => ({
  roomsApi: {
    list: vi.fn(),
    occupancy: vi.fn(),
  },
}));

const mocked = (fn: unknown) => fn as ReturnType<typeof vi.fn>;

const room = (id: string, name: string, capacity: number) => ({
  id,
  name,
  type: 'classroom' as const,
  capacity,
  createdAt: '',
  updatedAt: '',
});

const occ = (id: string, occupants: number, capacity: number, opts?: { manyOccupants?: boolean }): Occupancy => ({
  room: room(id, `Sala ${id}`, capacity),
  occupants: Array.from({ length: opts?.manyOccupants ? occupants : Math.min(occupants, 2) }, (_, i) => ({
    attendanceId: `${id}-a${i}`,
    checkInAt: new Date('2024-01-01T08:00:00Z').toISOString(),
    student: { id: `s${i}`, name: `Aluno ${i}`, registration: `${i}` },
  })),
  occupancy: occupants,
  capacity,
  occupancyRate: occupants / capacity,
});

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows "Nenhum ambiente cadastrado" when there are no rooms', async () => {
    mocked(roomsApi.list).mockResolvedValue([]);
    render(<DashboardPage />);
    expect(
      await screen.findByText(/Nenhum ambiente cadastrado/i),
    ).toBeInTheDocument();
  });

  it('renders cards with totals and overall rate', async () => {
    mocked(roomsApi.list).mockResolvedValue([
      room('r1', 'Lab A', 10),
      room('r2', 'Sala 1', 20),
    ]);
    // Component reads d.room.name from the occupancy payload, not from the list
    const o1 = occ('r1', 5, 10);
    o1.room = room('r1', 'Lab A', 10);
    const o2 = occ('r2', 10, 20);
    o2.room = room('r2', 'Sala 1', 20);
    mocked(roomsApi.occupancy)
      .mockResolvedValueOnce(o1)
      .mockResolvedValueOnce(o2);

    render(<DashboardPage />);
    expect(await screen.findByText('Lab A')).toBeInTheDocument();
    expect(screen.getByText('Sala 1')).toBeInTheDocument();
    expect(screen.getByText('15/30')).toBeInTheDocument();
    expect(screen.getByText(/50%/)).toBeInTheDocument();
  });

  it('shows "+N outros..." when more than 5 occupants', async () => {
    mocked(roomsApi.list).mockResolvedValue([room('r1', 'Lab A', 20)]);
    const o = occ('r1', 8, 20, { manyOccupants: true });
    o.room = room('r1', 'Lab A', 20);
    mocked(roomsApi.occupancy).mockResolvedValueOnce(o);
    render(<DashboardPage />);
    expect(await screen.findByText(/\+3 outros\.\.\./)).toBeInTheDocument();
  });

  it('schedules 15s polling with setInterval', async () => {
    const setIntervalSpy = vi.spyOn(window, 'setInterval');
    mocked(roomsApi.list).mockResolvedValue([]);
    render(<DashboardPage />);
    await waitFor(() => expect(roomsApi.list).toHaveBeenCalledTimes(1));
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 15000);
    setIntervalSpy.mockRestore();
  });
});
