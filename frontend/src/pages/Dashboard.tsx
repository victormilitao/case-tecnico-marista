import { useEffect, useState } from 'react';
import { roomsApi } from '../services/rooms';
import { Occupancy, ROOM_TYPE_LABELS } from '../types';
import { Icon } from '../components/Icon';

function rateColor(rate: number) {
  if (rate >= 1) return 'bg-rose-500';
  if (rate >= 0.75) return 'bg-amber-500';
  if (rate > 0) return 'bg-emerald-500';
  return 'bg-slate-300 dark:bg-slate-700';
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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary sm:text-2xl">Dashboard</h1>
          <p className="text-sm text-muted">
            Ocupação dos ambientes de ensino
          </p>
        </div>
        {!loading && (
          <div className="text-right">
            <div className="text-2xl font-bold text-primary sm:text-3xl">
              {totalOccupied}/{totalCapacity}
            </div>
            <div className="text-xs uppercase text-muted">
              Ocupação geral · {Math.round(overallRate * 100)}%
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-subtle">Carregando...</div>
      ) : data.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-surface p-12 text-center text-muted">
          Nenhum ambiente cadastrado.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((d) => (
            <div
              key={d.room.id}
              className="rounded-lg border border-line bg-surface p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-primary">
                    {d.room.name}
                  </h3>
                  <p className="text-xs text-muted">
                    {ROOM_TYPE_LABELS[d.room.type]}
                  </p>
                </div>
                <span className="text-2xl font-bold text-primary">
                  {d.occupancy}
                  <span className="text-base text-subtle">
                    /{d.capacity}
                  </span>
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  className={`h-full ${rateColor(d.occupancyRate)} transition-all`}
                  style={{
                    width: `${Math.min(100, d.occupancyRate * 100)}%`,
                  }}
                />
              </div>
              {d.occupants.length > 0 && (
                <ul className="mt-4 space-y-1 text-xs text-muted">
                  {d.occupants.slice(0, 5).map((o) => (
                    <li key={o.attendanceId} className="flex items-center gap-1.5">
                      <Icon name="user" className="h-3.5 w-3.5 text-subtle" />
                      <span className="font-medium">{o.student.name}</span>
                      <span className="text-subtle">
                        · desde{' '}
                        {new Date(o.checkInAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </li>
                  ))}
                  {d.occupants.length > 5 && (
                    <li className="text-subtle">
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
