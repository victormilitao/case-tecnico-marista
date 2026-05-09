import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudentsPage } from './Students';
import { studentsApi } from '../services/students';

vi.mock('../services/students', () => ({
  studentsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const mocked = (fn: unknown) => fn as ReturnType<typeof vi.fn>;

const sampleStudents = [
  { id: 's1', registration: '111', name: 'Ana', email: 'ana@x.com', createdAt: '', updatedAt: '' },
  { id: 's2', registration: '222', name: 'Bia', email: 'bia@x.com', createdAt: '', updatedAt: '' },
];

describe('StudentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked(studentsApi.list).mockResolvedValue(sampleStudents);
  });

  it('lists students returned by the backend', async () => {
    render(<StudentsPage />);
    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Bia')).toBeInTheDocument();
  });

  it('shows empty state when list is empty', async () => {
    mocked(studentsApi.list).mockResolvedValue([]);
    render(<StudentsPage />);
    expect(await screen.findByText(/Nenhum aluno cadastrado/i)).toBeInTheDocument();
  });

  it('opens the create modal when clicking "+ Novo aluno"', async () => {
    render(<StudentsPage />);
    await screen.findByText('Ana');
    await userEvent.click(screen.getByRole('button', { name: /Novo aluno/i }));
    expect(
      await screen.findByRole('heading', { name: 'Novo aluno' }),
    ).toBeInTheDocument();
  });

  it('creates student and reloads list on submit', async () => {
    mocked(studentsApi.create).mockResolvedValue({} as never);
    render(<StudentsPage />);
    await screen.findByText('Ana');

    await userEvent.click(screen.getByRole('button', { name: /Novo aluno/i }));
    await userEvent.type(screen.getByLabelText('Matrícula'), '999');
    await userEvent.type(screen.getByLabelText('Nome'), 'Carla');
    await userEvent.type(screen.getByLabelText('E-mail'), 'c@x.com');

    mocked(studentsApi.list).mockResolvedValueOnce([
      ...sampleStudents,
      { id: 's3', registration: '999', name: 'Carla', email: 'c@x.com', createdAt: '', updatedAt: '' },
    ]);
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(studentsApi.create).toHaveBeenCalledWith({
        registration: '999',
        name: 'Carla',
        email: 'c@x.com',
      }),
    );
    await waitFor(() => expect(screen.getByText('Carla')).toBeInTheDocument());
  });

  it('shows API error inside the modal and keeps it open', async () => {
    mocked(studentsApi.create).mockRejectedValue(
      Object.assign(new Error('boom'), {
        isAxiosError: true,
        response: { data: { message: 'Matrícula já cadastrada' } },
      }),
    );
    render(<StudentsPage />);
    await screen.findByText('Ana');
    await userEvent.click(screen.getByRole('button', { name: /Novo aluno/i }));
    await userEvent.type(screen.getByLabelText('Matrícula'), '111');
    await userEvent.type(screen.getByLabelText('Nome'), 'X');
    await userEvent.type(screen.getByLabelText('E-mail'), 'x@x.com');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Matrícula já cadastrada')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Novo aluno' })).toBeInTheDocument();
  });

  it('opens edit modal pre-filled with the student values', async () => {
    render(<StudentsPage />);
    const row = (await screen.findByText('Ana')).closest('tr')!;
    await userEvent.click(within(row).getByRole('button', { name: 'Editar' }));

    expect(
      await screen.findByRole('heading', { name: 'Editar aluno' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Matrícula')).toHaveValue('111');
    expect(screen.getByLabelText('Nome')).toHaveValue('Ana');
  });

  it('updates student via PATCH when saving the edit', async () => {
    mocked(studentsApi.update).mockResolvedValue({} as never);
    render(<StudentsPage />);
    const row = (await screen.findByText('Ana')).closest('tr')!;
    await userEvent.click(within(row).getByRole('button', { name: 'Editar' }));

    const nameInput = await screen.findByLabelText('Nome');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Ana Maria');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(studentsApi.update).toHaveBeenCalledWith(
        's1',
        expect.objectContaining({ name: 'Ana Maria' }),
      ),
    );
  });

  it('cancels deletion when user dismisses confirm', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<StudentsPage />);
    const row = (await screen.findByText('Ana')).closest('tr')!;
    await userEvent.click(within(row).getByRole('button', { name: 'Excluir' }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(studentsApi.remove).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('deletes student when user confirms', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    mocked(studentsApi.remove).mockResolvedValue({} as never);
    mocked(studentsApi.list)
      .mockResolvedValueOnce(sampleStudents)
      .mockResolvedValueOnce([sampleStudents[1]]);
    render(<StudentsPage />);
    const row = (await screen.findByText('Ana')).closest('tr')!;
    await userEvent.click(within(row).getByRole('button', { name: 'Excluir' }));
    await waitFor(() => expect(studentsApi.remove).toHaveBeenCalledWith('s1'));
    confirmSpy.mockRestore();
  });
});
