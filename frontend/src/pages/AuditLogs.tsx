import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Select } from '../components/Input';
import { auditLogsApi } from '../services/auditLogs';
import { AuditAction, AuditLog } from '../types';

const PAGE_SIZE = 20;

const ENTITY_LABELS: Record<string, string> = {
  student: 'Aluno',
  room: 'Ambiente',
};

const ACTION_LABELS: Record<AuditAction, string> = {
  create: 'Criou',
  update: 'Atualizou',
  delete: 'Excluiu',
};

const ACTION_BADGE: Record<AuditAction, string> = {
  create: 'bg-emerald-100 text-emerald-700',
  update: 'bg-amber-100 text-amber-700',
  delete: 'bg-rose-100 text-rose-700',
};

export function AuditLogsPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState<'' | AuditAction>('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    auditLogsApi
      .list({
        entity: entity || undefined,
        action: action || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entity, action, page]);

  useEffect(() => {
    setPage(1);
  }, [entity, action]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
          Auditoria
        </h1>
        <p className="text-sm text-slate-500">
          Histórico de ações administrativas (criação, edição e exclusão).
        </p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Select
          label="Filtrar por entidade"
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
        >
          <option value="">Todas</option>
          <option value="student">Alunos</option>
          <option value="room">Ambientes</option>
        </Select>
        <Select
          label="Filtrar por ação"
          value={action}
          onChange={(e) => setAction(e.target.value as '' | AuditAction)}
        >
          <option value="">Todas</option>
          <option value="create">Criou</option>
          <option value="update">Atualizou</option>
          <option value="delete">Excluiu</option>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Quando</th>
                <th className="px-4 py-3">Quem</th>
                <th className="px-4 py-3">Ação</th>
                <th className="px-4 py-3">Entidade</th>
                <th className="px-4 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Carregando...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                items.map((log) => {
                  const isOpen = expandedId === log.id;
                  return (
                    <tr key={log.id} className="align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {log.userEmail}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs ${ACTION_BADGE[log.action]}`}
                        >
                          {ACTION_LABELS[log.action]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {ENTITY_LABELS[log.entity] ?? log.entity}
                        {log.entityId && (
                          <div className="font-mono text-xs text-slate-400">
                            {log.entityId}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {log.payload ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedId(isOpen ? null : log.id)
                              }
                              className="text-xs font-medium text-marista-navy hover:underline"
                            >
                              {isOpen ? 'Ocultar' : 'Ver payload'}
                            </button>
                            {isOpen && (
                              <pre className="mt-2 max-w-md overflow-x-auto rounded bg-slate-50 p-2 text-xs text-slate-700">
                                {JSON.stringify(log.payload, null, 2)}
                              </pre>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && total > 0 && (
          <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:flex-row">
            <span>
              Mostrando {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, total)} de {total}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <span>
                Página {page} de {totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={page >= totalPages}
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
