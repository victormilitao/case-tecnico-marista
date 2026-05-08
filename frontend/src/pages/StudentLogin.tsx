import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/auth';
import { getApiErrorMessage } from '../lib/errors';
import { Icon } from '../components/Icon';
import maristaLogo from '../assets/logo-marista-site.svg';

type Step = 'identify' | 'set-password' | 'login';

export function StudentLoginPage() {
  const { user, applySession } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('identify');
  const [registration, setRegistration] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user?.role === 'student') return <Navigate to="/aluno" replace />;
  if (user?.role === 'admin') return <Navigate to="/dashboard" replace />;

  async function onIdentify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.studentLogin(registration);
      if (res.requiresPasswordSetup) {
        setStep('set-password');
      } else {
        setStep('login');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Matrícula não encontrada.'));
    } finally {
      setLoading(false);
    }
  }

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.studentLogin(registration, password);
      if (!res.accessToken || !res.user) {
        throw new Error('Resposta inválida do servidor.');
      }
      applySession(res.accessToken, res.user);
      navigate('/aluno');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Matrícula ou senha inválidos.'));
    } finally {
      setLoading(false);
    }
  }

  async function onSetPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.studentSetPassword(registration, password);
      applySession(res.accessToken, res.user);
      navigate('/aluno');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível criar a senha.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-marista-teal px-4 py-6 sm:px-8 sm:py-10">
      <div className="flex items-center pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          <Icon name="arrow-left" className="h-4 w-4" strokeWidth={2.5} />
          Voltar
        </Link>
      </div>

      <div className="mx-auto w-full max-w-md py-8 sm:py-12 lg:py-0">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex justify-center">
            <img src={maristaLogo} alt="Grupo Marista" className="h-12 w-auto sm:h-14" />
          </div>

          <h1 className="mb-1 text-2xl font-bold text-marista-navy sm:text-2xl">
            {step === 'identify' && 'Área do aluno'}
            {step === 'set-password' && 'Criar senha'}
            {step === 'login' && 'Bem-vindo de volta'}
          </h1>
          <p className="mb-8 text-sm text-slate-500">
            {step === 'identify' && 'Informe sua matrícula para começar.'}
            {step === 'set-password' &&
              'Primeiro acesso detectado. Defina uma senha para suas próximas entradas.'}
            {step === 'login' && 'Informe sua senha para continuar.'}
          </p>

          {step === 'identify' && (
            <form onSubmit={onIdentify} className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Matrícula
                </span>
                <input
                  type="text"
                  value={registration}
                  onChange={(e) => setRegistration(e.target.value.trim())}
                  required
                  autoFocus
                  placeholder="Sua matrícula"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-marista-teal"
                />
              </label>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !registration}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-marista-teal py-3 text-sm font-bold text-white shadow-md transition hover:bg-marista-teal-dark disabled:opacity-40"
              >
                {loading ? 'Aguarde...' : 'Continuar'}
              </button>
            </form>
          )}

          {step === 'login' && (
            <form onSubmit={onLogin} className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Matrícula <strong className="text-slate-800">{registration}</strong>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Senha
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  placeholder="Sua senha"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-marista-teal"
                />
              </label>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-marista-teal py-3 text-sm font-bold text-white shadow-md transition hover:bg-marista-teal-dark disabled:opacity-40"
              >
                {loading ? 'Aguarde...' : 'Entrar'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('identify');
                  setPassword('');
                  setError(null);
                }}
                className="w-full text-center text-sm text-slate-500 transition hover:text-slate-800"
              >
                Trocar matrícula
              </button>
            </form>
          )}

          {step === 'set-password' && (
            <form onSubmit={onSetPassword} className="space-y-4">
              <div className="rounded-xl border border-marista-teal-light bg-marista-teal-light/40 px-4 py-3 text-sm text-marista-navy">
                Olá! Como este é seu primeiro acesso, você precisa criar uma senha.
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Nova senha (mínimo 6 caracteres)
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoFocus
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-marista-teal"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Confirmar senha
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-marista-teal"
                />
              </label>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-marista-teal py-3 text-sm font-bold text-white shadow-md transition hover:bg-marista-teal-dark disabled:opacity-40"
              >
                {loading ? 'Aguarde...' : 'Criar senha e entrar'}
              </button>
            </form>
          )}
        </div>
      </div>

      <p className="text-xs text-center text-white">
        Grupo Marista {new Date().getFullYear()}
      </p>
    </div>
  );
}
