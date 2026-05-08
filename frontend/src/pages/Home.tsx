import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from '../components/Icon';
import maristaLogo from '../assets/logo-marista-site.svg';

export function HomePage() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to="/dashboard" replace />;
  if (user?.role === 'student') return <Navigate to="/aluno" replace />;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="px-4 pt-8 pb-4 sm:px-8 sm:pt-10 sm:pb-6">
        <div className="flex items-center justify-center">
          <img
            src={maristaLogo}
            alt="Grupo Marista"
            className="h-16 w-auto sm:h-20"
          />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
        <div className="w-full max-w-4xl">
          <div className="mb-8 text-center sm:mb-10">
            <h1 className="text-3xl font-bold text-marista-navy sm:text-3xl">
              Controle de Espaços
            </h1>
            <p className="mt-3 text-sm text-slate-500 sm:text-base">
              Selecione como deseja continuar
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
            <Link
              to="/login"
              className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8"
            >
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-marista-navy-soft">
                <Icon
                  name="user-cog"
                  className="h-10 w-10 text-marista-navy"
                  strokeWidth={1.5}
                />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-marista-navy">
                Área administrativa
              </h2>
              <p className="mb-6 text-sm text-slate-500">
                Gerencie alunos, ambientes e visualize relatórios de presença.
              </p>
              <span className="mt-auto inline-flex items-center gap-2 rounded-full bg-marista-navy px-6 py-2.5 text-sm font-bold text-white shadow-md transition group-hover:bg-marista-navy-dark">
                Entrar
                <Icon name="arrow-right" className="h-4 w-4" strokeWidth={2.5} />
              </span>
            </Link>

            <Link
              to="/aluno/login"
              className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8"
            >
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-marista-teal-light">
                <Icon
                  name="graduation-cap"
                  className="h-10 w-10 text-marista-teal"
                  strokeWidth={1.5}
                />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-marista-navy">
                Área do aluno
              </h2>
              <p className="mb-6 text-sm text-slate-500">
                Registre sua entrada e saída nos ambientes de ensino.
              </p>
              <span className="mt-auto inline-flex items-center gap-2 rounded-full bg-marista-teal px-6 py-2.5 text-sm font-bold text-white shadow-md transition group-hover:bg-marista-teal-dark">
                Entrar
                <Icon name="arrow-right" className="h-4 w-4" strokeWidth={2.5} />
              </span>
            </Link>
          </div>
        </div>
      </main>

      <footer className="px-8 py-6 text-center">
        <p className="text-xs text-marista-navy">
          Grupo Marista {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
