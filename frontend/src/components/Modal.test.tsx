import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal', () => {
  it('não renderiza quando open=false', () => {
    render(
      <Modal open={false} title="X" onClose={() => {}}>
        conteudo
      </Modal>,
    );
    expect(screen.queryByText('conteudo')).not.toBeInTheDocument();
  });

  it('renderiza título e children quando aberto', () => {
    render(
      <Modal open title="Editar aluno" onClose={() => {}}>
        <p>conteudo</p>
      </Modal>,
    );
    expect(screen.getByText('Editar aluno')).toBeInTheDocument();
    expect(screen.getByText('conteudo')).toBeInTheDocument();
  });

  it('chama onClose ao clicar no botão fechar', async () => {
    const onClose = vi.fn();
    render(
      <Modal open title="X" onClose={onClose}>
        Y
      </Modal>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
