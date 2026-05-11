import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from '../components/Icon';
import { Select } from '../components/Input';
import { ThemeToggle } from '../components/ThemeToggle';
import { meApi, MyAttendance, MyStatus } from '../services/me';
import { Room, ROOM_TYPE_LABELS } from '../types';
import { getApiErrorMessage } from '../lib/errors';

export function StudentDashboardPage() {
  const { user, logout } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [status, setStatus] = useState<MyStatus | null>(null);
  const [history, setHistory] = useState<MyAttendance[]>([]);
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [r, s, h] = await Promise.all([
        meApi.rooms(),
        meApi.status(),
        meApi.attendance(),
      ]);
      setRooms(r);
      setStatus(s);
      setHistory(h);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function flashSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  }

  async function onCheckIn(e: FormEvent) {
    e.preventDefault();
    if (!roomId) return;
    setSubmitting(true);
    setError(null);
    try {
      await meApi.checkIn(roomId);
      setRoomId('');
      flashSuccess('Entrada registrada com sucesso!');
      await refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível registrar entrada.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function onCheckOut() {
    setSubmitting(true);
    setError(null);
    try {
      await meApi.checkOut();
      flashSuccess('Saída registrada com sucesso!');
      await refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível registrar saída.'));
    } finally {
      setSubmitting(false);
    }
  }

  const active = status?.activeCheckIn ?? null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-marista-teal dark:bg-marista-teal-dark">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="truncate text-base font-bold text-white sm:text-lg">
              Marista · Espaços
            </span>
            <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
              Aluno
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm sm:gap-3">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="truncate font-medium text-white">
                {user?.name}
              </span>
              <span className="shrink-0 font-mono text-xs text-white/70">
                {user?.registration}
              </span>
            </div>
            <ThemeToggle />
            <button
              onClick={logout}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Icon name="log-out" className="h-4 w-4" strokeWidth={2} />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 sm:text-2xl">
            Olá, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Registre sua entrada e saída nos ambientes de ensino.
          </p>

          {success && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              {success}
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-6 text-sm text-slate-400 dark:text-slate-500">Carregando...</div>
          ) : active ? (
            <div className="mt-6 rounded-xl border border-marista-teal-light bg-marista-teal-light/40 p-5 dark:border-marista-teal-dark/60 dark:bg-marista-teal-dark/30">
              <div className="text-xs font-semibold uppercase tracking-wider text-marista-teal-dark dark:text-marista-teal-light">
                Você está no ambiente
              </div>
              <div className="mt-1 break-words text-xl font-bold text-marista-teal-dark dark:text-marista-teal-light">
                {active.room.name}
              </div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Entrada em {new Date(active.checkInAt).toLocaleString()}
              </div>
              <button
                onClick={onCheckOut}
                disabled={submitting}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-marista-teal px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-marista-teal-dark disabled:opacity-40 sm:w-auto"
              >
                {submitting ? 'Aguarde...' : 'Registrar saída'}
              </button>
            </div>
          ) : (
            <form onSubmit={onCheckIn} className="mt-6 space-y-4">
              <Select
                label="Selecione o ambiente"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                required
              >
                <option value="">Escolha um ambiente</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {ROOM_TYPE_LABELS[r.type]} (cap. {r.capacity})
                  </option>
                ))}
              </Select>
              <button
                type="submit"
                disabled={submitting || !roomId}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-marista-teal px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-marista-teal-dark disabled:opacity-40 sm:w-auto"
              >
                {submitting ? 'Aguarde...' : 'Registrar entrada'}
              </button>
            </form>
          )}
        </section>

        <section>
          <div className="mb-3">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Meu histórico de presença
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Registros de entrada e saída em sua conta.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Ambiente</th>
                    <th className="px-4 py-3">Entrada</th>
                    <th className="px-4 py-3">Saída</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                        Carregando...
                      </td>
                    </tr>
                  ) : history.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                        Você ainda não tem registros.
                      </td>
                    </tr>
                  ) : (
                    history.map((h) => (
                      <tr key={h.id}>
                        <td className="px-4 py-3 text-slate-800 dark:text-slate-100">{h.room.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {new Date(h.checkInAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {h.checkOutAt
                            ? new Date(h.checkOutAt).toLocaleString()
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {h.checkOutAt ? (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              Encerrado
                            </span>
                          ) : (
                            <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                              No ambiente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
