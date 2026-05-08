import { useEffect, useState } from 'react';
import { roomsApi } from '../services/rooms';
import { Occupancy, ROOM_TYPE_LABELS } from '../types';

function rateColor(rate: number) {
  if (rate >= 1) return 'bg-rose-500';
  if (rate >= 0.75) return 'bg-amber-500';
  if (rate > 0) return 'bg-emerald-500';
  return 'bg-slate-300';
}

export function DashboardPage() {
  const [data, setData] = useState<Occupancy[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const rooms = await roomsApi.list();
    const result = await Promise.all(rooms.map((r) => roomsApi.occupancy(r.id)));
    setData(result);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const totalCapacity = data.reduce((acc, d) => acc + d.capacity, 0);
  const totalOccupied = data.reduce((acc, d) => acc + d.occupancy, 0);
  const overallRate =
    totalCapacity > 0 ? totalOccupied / totalCapacity : 0;

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Atualiza automaticamente a cada 15 segundos
          </p>
        </div>
        {!loading && (
          <div className="text-right">
            <div className="text-3xl font-bold text-slate-800">
              {totalOccupied}/{totalCapacity}
            </div>
            <div className="text-xs uppercase text-slate-500">
              Ocupação geral · {Math.round(overallRate * 100)}%
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-slate-400">Carregando...</div>
      ) : data.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          Nenhum ambiente cadastrado.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((d) => (
            <div
              key={d.room.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">
                    {d.room.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {ROOM_TYPE_LABELS[d.room.type]}
                  </p>
                </div>
                <span className="text-2xl font-bold text-slate-700">
                  {d.occupancy}
                  <span className="text-base text-slate-400">
                    /{d.capacity}
                  </span>
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full ${rateColor(d.occupancyRate)} transition-all`}
                  style={{
                    width: `${Math.min(100, d.occupancyRate * 100)}%`,
                  }}
                />
              </div>
              {d.occupants.length > 0 && (
                <ul className="mt-4 space-y-1 text-xs text-slate-600">
                  {d.occupants.slice(0, 5).map((o) => (
                    <li key={o.attendanceId}>
                      <span className="font-medium">{o.student.name}</span>
                      <span className="text-slate-400">
                        {' '}
                        · desde{' '}
                        {new Date(o.checkInAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </li>
                  ))}
                  {d.occupants.length > 5 && (
                    <li className="text-slate-400">
                      +{d.occupants.length - 5} outros...
                    </li>
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
