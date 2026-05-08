import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input, Select } from './Input';

describe('Input', () => {
  it('renderiza label associada ao input', () => {
    render(<Input label="E-mail" />);
    expect(screen.getByText('E-mail')).toBeInTheDocument();
  });

  it('aceita digitação', async () => {
    render(<Input label="Nome" />);
    const input = screen.getByLabelText('Nome');
    await userEvent.type(input, 'Ana');
    expect(input).toHaveValue('Ana');
  });

  it('mostra mensagem de erro quando passada', () => {
    render(<Input label="X" error="Campo obrigatório" />);
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument();
  });

  it('não renderiza label quando não passada', () => {
    const { container } = render(<Input placeholder="só placeholder" />);
    expect(container.querySelector('span')).toBeNull();
  });
});

describe('Select', () => {
  it('renderiza opções e dispara onChange', async () => {
    const onChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
      expect(e.target.value).toBe('b');
    render(
      <Select label="Tipo" onChange={onChange} defaultValue="a">
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>,
    );
    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'b');
  });
});
