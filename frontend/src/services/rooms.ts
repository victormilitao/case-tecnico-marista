import { api } from './api';
import { Occupancy, Room, RoomType } from '../types';

export const roomsApi = {
  list: () => api.get<Room[]>('/rooms').then((r) => r.data),
  create: (data: { name: string; type: RoomType; capacity: number }) =>
    api.post<Room>('/rooms', data).then((r) => r.data),
  update: (
    id: string,
    data: Partial<{ name: string; type: RoomType; capacity: number }>,
  ) => api.patch<Room>(`/rooms/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/rooms/${id}`).then((r) => r.data),
  occupancy: (id: string) =>
    api.get<Occupancy>(`/rooms/${id}/occupancy`).then((r) => r.data),
};
