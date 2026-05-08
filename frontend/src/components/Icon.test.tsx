import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Icon } from './Icon';

describe('Icon', () => {
  it('renderiza um SVG correspondente ao nome', () => {
    const { container } = render(<Icon name="user" data-testid="i" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('repassa props (className, strokeWidth) para o ícone', () => {
    const { container } = render(
      <Icon name="arrow-right" className="text-rose-500" strokeWidth={3} />,
    );
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveClass('text-rose-500');
    expect(svg.getAttribute('stroke-width')).toBe('3');
  });
});
