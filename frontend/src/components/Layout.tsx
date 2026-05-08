import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from './Icon';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/attendance', label: 'Histórico' },
  { to: '/students', label: 'Alunos' },
  { to: '/rooms', label: 'Ambientes' },
];

export function Layout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-marista-navy">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-4 sm:gap-8">
            <span className="truncate text-base font-bold text-white sm:text-lg">
              Marista · Espaços
            </span>
            <nav className="hidden gap-1 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="hidden items-center gap-3 text-sm md:flex">
            <span className="max-w-[12rem] truncate text-white/90">
              {user?.name}
            </span>
            <button
              onClick={logout}
              className="rounded-md px-3 py-1.5 text-white/80 hover:bg-white/10 hover:text-white"
            >
              Sair
            </button>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white hover:bg-white/10 md:hidden"
          >
            <Icon
              name={menuOpen ? 'close' : 'menu'}
              className="h-6 w-6"
              strokeWidth={2}
            />
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-white/15 bg-marista-navy md:hidden">
            <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-white/15 pt-3 text-sm">
                <span className="truncate text-white/90">{user?.name}</span>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="rounded-md px-3 py-1.5 text-white/80 hover:bg-white/10 hover:text-white"
                >
                  Sair
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
