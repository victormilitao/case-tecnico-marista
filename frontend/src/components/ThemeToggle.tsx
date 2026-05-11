import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
      className={
        className ??
        'inline-flex h-9 w-9 items-center justify-center rounded-md text-white/80 hover:bg-white/10 hover:text-white'
      }
    >
      <Icon name={isDark ? 'sun' : 'moon'} className="h-5 w-5" strokeWidth={2} />
    </button>
  );
}
