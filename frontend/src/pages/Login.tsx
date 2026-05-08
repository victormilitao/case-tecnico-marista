import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/auth';
import { TOKEN_KEY } from '../services/api';
import { getApiErrorMessage } from '../lib/errors';
import { Icon } from '../components/Icon';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user?.role === 'admin') return <Navigate to="/dashboard" replace />;
  if (user?.role === 'student') return <Navigate to="/aluno" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        const { accessToken } = await authApi.register(name, email, password);
        localStorage.setItem(TOKEN_KEY, accessToken);
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha na autenticação'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-marista-navy px-4 py-6 sm:px-8 sm:py-10">
        {/* Header com voltar */}
        <div className="flex items-center pt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <Icon name="arrow-left" className="h-4 w-4" strokeWidth={2.5} />
            Voltar
          </Link>
        </div>

        {/* Formulário */}
        <div className="mx-auto w-full max-w-md py-8 sm:py-12 lg:py-0">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-marista-navy">
                <Icon name="graduation-cap" className="h-5 w-5 text-white" strokeWidth={1.8} />
              </div>
              <span className="text-sm font-semibold uppercase tracking-widest text-marista-navy">
                Grupo Marista
              </span>
            </div>
            <h1 className="mb-1 text-2xl font-bold text-marista-navy sm:text-3xl">
              {mode === 'login' ? 'Área administrativa' : 'Criar conta'}
            </h1>
            <p className="mb-8 text-sm text-slate-500">
              {mode === 'login'
                ? 'Entre com suas credenciais para continuar'
                : 'Preencha os dados para criar uma nova conta'}
            </p>

            <form onSubmit={onSubmit} className="space-y-4">
              {mode === 'register' && (
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Nome
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                    placeholder="Seu nome completo"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-marista-navy"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  E-mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus={mode === 'login'}
                  placeholder="seu@email.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-marista-navy"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Senha
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-marista-navy"
                />
              </label>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-marista-navy py-3 text-sm font-bold text-white shadow-md transition hover:bg-marista-navy-dark disabled:opacity-40 disabled:hover:bg-marista-navy"
              >
                {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
                {!loading && (
                  <Icon name="arrow-right" className="h-4 w-4" strokeWidth={2.5} />
                )}
              </button>
            </form>

            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
              className="mt-4 w-full text-center text-sm text-slate-500 transition hover:text-slate-800"
            >
              {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
            </button>
          </div>
        </div>

        {/* Rodapé */}
        <p className="text-xs text-center text-white/25">
          © {new Date().getFullYear()} Grupo Marista. Todos os direitos reservados.
        </p>

    </div>
  );
}
