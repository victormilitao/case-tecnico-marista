import { FormEvent, useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';
import { Modal } from '../components/Modal';
import { roomsApi } from '../services/rooms';
import { Room, RoomType, ROOM_TYPE_LABELS } from '../types';
import { getApiErrorMessage } from '../lib/errors';

interface FormState {
  name: string;
  type: RoomType;
  capacity: number;
}

const emptyForm: FormState = { name: '', type: 'classroom', capacity: 30 };

export function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setRooms(await roomsApi.list());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(room: Room) {
    setEditing(room);
    setForm({ name: room.name, type: room.type, capacity: room.capacity });
    setError(null);
    setModalOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = { ...form, capacity: Number(form.capacity) };
      if (editing) {
        await roomsApi.update(editing.id, payload);
      } else {
        await roomsApi.create(payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(room: Room) {
    if (!confirm(`Excluir o ambiente "${room.name}"?`)) return;
    try {
      await roomsApi.remove(room.id);
      await load();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Ambientes</h1>
        <Button onClick={openCreate}>+ Novo ambiente</Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Capacidade</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Carregando...
                </td>
              </tr>
            ) : rooms.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Nenhum ambiente cadastrado
                </td>
              </tr>
            ) : (
              rooms.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-slate-800">{r.name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {ROOM_TYPE_LABELS[r.type]}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.capacity}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      onClick={() => openEdit(r)}
                      className="!px-2 !py-1 text-xs"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => onDelete(r)}
                      className="!px-2 !py-1 text-xs text-rose-600 hover:bg-rose-50"
                    >
                      Excluir
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Editar ambiente' : 'Novo ambiente'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Select
            label="Tipo"
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value as RoomType })
            }
          >
            {(Object.keys(ROOM_TYPE_LABELS) as RoomType[]).map((t) => (
              <option key={t} value={t}>
                {ROOM_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
          <Input
            label="Capacidade"
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) =>
              setForm({ ...form, capacity: Number(e.target.value) })
            }
            required
          />
          {error && (
            <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
