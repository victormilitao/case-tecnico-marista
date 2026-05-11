import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input, Select } from './Input';

describe('Input', () => {
  it('renders label tied to the input', () => {
    render(<Input label="E-mail" />);
    expect(screen.getByText('E-mail')).toBeInTheDocument();
  });

  it('accepts typing', async () => {
    render(<Input label="Nome" />);
    const input = screen.getByLabelText('Nome');
    await userEvent.type(input, 'Ana');
    expect(input).toHaveValue('Ana');
  });

  it('shows error message when provided', () => {
    render(<Input label="X" error="Campo obrigatório" />);
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument();
  });

  it('does not render label when not provided', () => {
    const { container } = render(<Input placeholder="só placeholder" />);
    expect(container.querySelector('span')).toBeNull();
  });
});

describe('Select', () => {
  it('renders options and dispatches onChange', async () => {
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
