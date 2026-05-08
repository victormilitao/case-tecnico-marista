import { api } from './api';
import { Room, RoomType } from '../types';

export interface MyAttendance {
  id: string;
  checkInAt: string;
  checkOutAt: string | null;
  room: { id: string; name: string; type: RoomType };
}

export interface MyStatus {
  activeCheckIn: {
    id: string;
    checkInAt: string;
    room: { id: string; name: string; type: RoomType };
  } | null;
}

export const meApi = {
  rooms: () => api.get<Room[]>('/me/rooms').then((r) => r.data),
  status: () => api.get<MyStatus>('/me/status').then((r) => r.data),
  checkIn: (roomId: string) =>
    api.post<MyAttendance>('/me/checkin', { roomId }).then((r) => r.data),
  checkOut: () => api.post<MyAttendance>('/me/checkout').then((r) => r.data),
  attendance: () =>
    api.get<MyAttendance[]>('/me/attendance').then((r) => r.data),
};
