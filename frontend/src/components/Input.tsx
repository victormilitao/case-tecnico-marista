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
        <span className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </span>
      )}
      <input
        ref={ref}
        {...props}
        className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-5 text-slate-900 shadow-sm focus:border-marista-navy focus:outline-none focus:ring-1 focus:ring-marista-navy ${className}`}
      />
      {error && (
        <span className="mt-1 block text-xs text-rose-600">{error}</span>
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
        <span className="mb-1 block text-sm font-medium text-slate-700">
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
        className={`w-full appearance-none rounded-md border border-slate-300 bg-white py-2 pl-3 pr-9 text-sm leading-5 text-slate-900 shadow-sm focus:border-marista-navy focus:outline-none focus:ring-1 focus:ring-marista-navy ${className}`}
      >
        {children}
      </select>
    </label>
  );
}
