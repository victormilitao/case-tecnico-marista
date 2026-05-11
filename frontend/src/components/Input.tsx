import {
  forwardRef,
  InputHTMLAttributes,
  SelectHTMLAttributes,
} from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className = '', ...props },
  ref,
) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-sm font-medium text-body">
          {label}
        </span>
      )}
      <input
        ref={ref}
        {...props}
        className={`w-full rounded-md border border-line bg-surface px-3 py-2 text-sm leading-5 text-primary shadow-sm placeholder:text-subtle focus:border-marista-navy focus:outline-none focus:ring-1 focus:ring-marista-navy dark:focus:border-marista-navy-light dark:focus:ring-marista-navy-light ${className}`}
      />
      {error && (
        <span className="mt-1 block text-xs text-rose-600 dark:text-rose-400">{error}</span>
      )}
    </label>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

const SELECT_CHEVRON =
  "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%2364748b' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 8 10 12 14 8'/%3E%3C/svg%3E\")";

export function Select({
  label,
  className = '',
  style,
  children,
  ...props
}: SelectProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-sm font-medium text-body">
          {label}
        </span>
      )}
      <select
        {...props}
        style={{
          backgroundImage: SELECT_CHEVRON,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
          backgroundSize: '1rem 1rem',
          ...style,
        }}
        className={`w-full appearance-none rounded-md border border-line bg-surface py-2 pl-3 pr-9 text-sm leading-5 text-primary shadow-sm focus:border-marista-navy focus:outline-none focus:ring-1 focus:ring-marista-navy dark:focus:border-marista-navy-light dark:focus:ring-marista-navy-light ${className}`}
      >
        {children}
      </select>
    </label>
  );
}
