import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';
import { attendanceApi } from '../services/attendance';
import { roomsApi } from '../services/rooms';
import { Attendance, Room } from '../types';

const PAGE_SIZE = 15;

export function AttendancePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [studentQuery, setStudentQuery] = useState('');
  const [debouncedStudentQuery, setDebouncedStudentQuery] = useState('');
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  async function loadHistory() {
    setLoading(true);
    try {
      setHistory(
        await attendanceApi.list({
          roomId: roomId || undefined,
        }),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    roomsApi.list().then(setRooms);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedStudentQuery(studentQuery), 300);
    return () => clearTimeout(id);
  }, [studentQuery]);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const filteredHistory = useMemo(() => {
    const q = debouncedStudentQuery.trim().toLowerCase();
    if (!q) return history;
    return history.filter(
      (h) =>
        h.student.name.toLowerCase().includes(q) ||
        h.student.registration.toLowerCase().includes(q),
    );
  }, [history, debouncedStudentQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedHistory = filteredHistory.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedStudentQuery, roomId]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 sm:text-2xl">
          Histórico de presença
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Visualização dos registros de entrada e saída feitos pelos alunos.
        </p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Input
          label="Filtrar por aluno"
          placeholder="Buscar por nome ou matrícula"
          value={studentQuery}
          onChange={(e) => setStudentQuery(e.target.value)}
        />
        <Select
          label="Filtrar por ambiente"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        >
          <option value="">Todos os ambientes</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Aluno</th>
              <th className="px-4 py-3">Ambiente</th>
              <th className="px-4 py-3">Entrada</th>
              <th className="px-4 py-3">Saída</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                  Carregando...
                </td>
              </tr>
            ) : filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                  Nenhum registro encontrado
                </td>
              </tr>
            ) : (
              pagedHistory.map((h) => (
                <tr key={h.id}>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                    {h.student.name}
                    <div className="font-mono text-xs text-slate-400 dark:text-slate-500">
                      {h.student.registration}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{h.room.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(h.checkInAt).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
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
        {!loading && filteredHistory.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 sm:flex-row">
            <span>
              Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filteredHistory.length)} de{' '}
              {filteredHistory.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <span>
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
