import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renderiza children e dispara onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Salvar</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('aplica classes da variant primary por padrão', () => {
    render(<Button>Ok</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-marista-navy');
  });

  it('aplica classes da variant danger', () => {
    render(<Button variant="danger">Apagar</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-rose-600');
  });

  it('respeita disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Off
      </Button>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});
