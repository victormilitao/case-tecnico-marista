import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { kioskApi, StudentStatus } from '../services/kiosk';
import { Room, ROOM_TYPE_LABELS } from '../types';
import { getApiErrorMessage } from '../lib/errors';

const TEAL = '#1aabbc';
const TEAL_DARK = '#148898';
const NAVY = '#1c3d7a';

type Mode = 'checkin' | 'checkout';

interface Feedback {
  type: 'success' | 'error';
  message: string;
}

export function KioskPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [mode, setMode] = useState<Mode>('checkin');
  const [registration, setRegistration] = useState('');
  const [roomId, setRoomId] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [studentStatus, setStudentStatus] = useState<StudentStatus | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lookupRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    kioskApi.rooms().then(setRooms);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(t);
  }, [feedback]);

  useEffect(() => {
    if (lookupRef.current) clearTimeout(lookupRef.current);
    const trimmed = registration.trim();
    if (!trimmed) {
      setStudentStatus(null);
      return;
    }
    setLookingUp(true);
    lookupRef.current = setTimeout(async () => {
      try {
        const status = await kioskApi.status(trimmed);
        setStudentStatus(status);
        if (status.found && status.activeCheckIn) {
          setMode('checkout');
        } else if (status.found && !status.activeCheckIn) {
          setMode('checkin');
        }
      } catch {
        setStudentStatus(null);
      } finally {
        setLookingUp(false);
      }
    }, 600);
    return () => {
      if (lookupRef.current) clearTimeout(lookupRef.current);
    };
  }, [registration]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!registration.trim()) return;
    if (mode === 'checkin' && !roomId) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      if (mode === 'checkin') {
        await kioskApi.checkIn(registration.trim(), roomId);
        const room = rooms.find((r) => r.id === roomId);
        setFeedback({
          type: 'success',
          message: `Entrada registrada em "${room?.name}".`,
        });
      } else {
        const result = await kioskApi.checkOut(registration.trim());
        const minutes = result?.durationMinutes ?? 0;
        setFeedback({
          type: 'success',
          message: `Saída registrada. Permanência: ${minutes} min.`,
        });
      }
      setRegistration('');
      setRoomId('');
      setStudentStatus(null);
      setMode('checkin');
      inputRef.current?.focus();
    } catch (err) {
      setFeedback({ type: 'error', message: getApiErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  }

  const activeRoom = studentStatus?.activeCheckIn?.room;

  return (
    <div
      className="flex min-h-screen flex-col justify-between px-8 py-10"
      style={{ backgroundColor: TEAL }}
    >
      <div className="flex items-center pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition"
          style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.28)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)')}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Voltar
        </Link>
      </div>

      <div className="mx-auto w-full max-w-md py-12 lg:py-0">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: TEAL }}
            >
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
                />
              </svg>
            </div>
            <span
              className="text-sm font-semibold uppercase tracking-widest"
              style={{ color: NAVY }}
            >
              Grupo Marista
            </span>
          </div>
          <h1 className="mb-1 text-3xl font-bold" style={{ color: NAVY }}>
            {mode === 'checkin' ? 'Registrar entrada' : 'Registrar saída'}
          </h1>
          <p className="mb-8 text-sm text-slate-500">
            {mode === 'checkin'
              ? 'Digite sua matrícula e selecione o ambiente'
              : 'Confirme sua saída do ambiente atual'}
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Matrícula
              </span>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={registration}
                  onChange={(e) => setRegistration(e.target.value)}
                  required
                  autoFocus
                  placeholder="Ex: 2026001"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400"
                  onFocus={(e) => (e.currentTarget.style.borderColor = TEAL)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                />
                {lookingUp && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    verificando...
                  </span>
                )}
              </div>
            </label>

            {studentStatus?.found && activeRoom && (
              <div
                className="rounded-xl border px-4 py-3 text-sm"
                style={{ backgroundColor: '#e8f8fa', borderColor: '#b8e6ec', color: NAVY }}
              >
                <span className="font-semibold">{studentStatus.student?.name}</span> está em{' '}
                <span className="font-semibold">"{activeRoom.name}"</span>.
              </div>
            )}

            {mode === 'checkin' && (
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Ambiente
                </span>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition"
                  onFocus={(e) => (e.currentTarget.style.borderColor = TEAL)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                >
                  <option value="">Selecione o ambiente...</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({ROOM_TYPE_LABELS[r.type]})
                    </option>
                  ))}
                </select>
              </label>
            )}

            {feedback && (
              <div
                className="rounded-xl border px-4 py-3 text-sm"
                style={
                  feedback.type === 'success'
                    ? { backgroundColor: '#e8f8fa', borderColor: '#b8e6ec', color: NAVY }
                    : { backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }
                }
              >
                {feedback.message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white shadow-md transition disabled:opacity-40"
              style={{ backgroundColor: TEAL }}
              onMouseEnter={(e) => !submitting && (e.currentTarget.style.backgroundColor = TEAL_DARK)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = TEAL)}
            >
              {submitting
                ? 'Aguarde...'
                : mode === 'checkin'
                  ? 'Registrar entrada'
                  : 'Registrar saída'}
              {!submitting && (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>

      <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>
        © {new Date().getFullYear()} Grupo Marista. Humanidade no ser. Excelência no fazer.
      </p>
    </div>
  );
}
