import './sentry';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './index.css';

const FallbackError = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-center">
    <div className="max-w-md">
      <h1 className="text-xl font-bold text-slate-800">Algo deu errado</h1>
      <p className="mt-2 text-sm text-slate-600">
        A aplicação encontrou um erro inesperado. Recarregue a página para
        tentar novamente.
      </p>
    </div>
  </div>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<FallbackError />}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
