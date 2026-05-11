import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';
import { AuthProvider } from '../contexts/AuthContext';
import { authApi } from '../services/auth';
import { TOKEN_KEY } from '../services/api';

vi.mock('../services/auth', () => ({
  authApi: { me: vi.fn(), login: vi.fn() },
}));

function setup(initialPath = '/dashboard') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<div>conteudo-dashboard</div>} />
            <Route path="/students" element={<div>conteudo-alunos</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem(TOKEN_KEY, 't');
    (authApi.me as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'u1', name: 'Admin User', email: 'a@x.com', role: 'admin',
    });
  });

  it('renders nav items and the routed content', async () => {
    setup();
    expect(await screen.findByText('conteudo-dashboard')).toBeInTheDocument();
    const dashboardLinks = screen.getAllByRole('link', { name: 'Dashboard' });
    expect(dashboardLinks.length).toBeGreaterThan(0);
    expect(dashboardLinks[0]).toHaveAttribute('href', '/dashboard');
  });

  it('shows authenticated user name', async () => {
    setup();
    expect((await screen.findAllByText('Admin User')).length).toBeGreaterThan(0);
  });

  it('logout clears the token', async () => {
    setup();
    await screen.findByText('conteudo-dashboard');
    const logoutButtons = screen.getAllByRole('button', { name: /Sair/i });
    await userEvent.click(logoutButtons[0]);
    await waitFor(() => expect(localStorage.getItem(TOKEN_KEY)).toBeNull());
  });

  it('mobile menu button toggles aria-expanded', async () => {
    setup();
    await screen.findByText('conteudo-dashboard');
    const toggle = screen.getByRole('button', { name: 'Abrir menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});
