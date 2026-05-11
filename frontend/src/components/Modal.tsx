import { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 dark:bg-black/70">
      <div className="w-full max-w-md rounded-lg bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-lg font-semibold text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="text-subtle hover:text-body"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
