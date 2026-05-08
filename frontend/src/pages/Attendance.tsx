import { useEffect, useState } from 'react';
import { Select } from '../components/Input';
import { attendanceApi } from '../services/attendance';
import { roomsApi } from '../services/rooms';
import { studentsApi } from '../services/students';
import { Attendance, Room, Student } from '../types';

export function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [studentId, setStudentId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadHistory() {
    setLoading(true);
    try {
      setHistory(
        await attendanceApi.list({
          studentId: studentId || undefined,
          roomId: roomId || undefined,
        }),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    Promise.all([studentsApi.list(), roomsApi.list()]).then(([s, r]) => {
      setStudents(s);
      setRooms(r);
    });
  }, []);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, roomId]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
          Histórico de presença
        </h1>
        <p className="text-sm text-slate-500">
          Visualização dos registros de entrada e saída feitos pelos alunos.
        </p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Select
          label="Filtrar por aluno"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        >
          <option value="">Todos os alunos</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.registration})
            </option>
          ))}
        </Select>
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

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Aluno</th>
              <th className="px-4 py-3">Ambiente</th>
              <th className="px-4 py-3">Entrada</th>
              <th className="px-4 py-3">Saída</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Carregando...
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Nenhum registro encontrado
                </td>
              </tr>
            ) : (
              history.map((h) => (
                <tr key={h.id}>
                  <td className="px-4 py-3 text-slate-800">
                    {h.student.name}
                    <div className="font-mono text-xs text-slate-400">
                      {h.student.registration}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{h.room.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {new Date(h.checkInAt).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {h.checkOutAt
                      ? new Date(h.checkOutAt).toLocaleString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {h.checkOutAt ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        Encerrado
                      </span>
                    ) : (
                      <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
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
    </div>
  );
}
