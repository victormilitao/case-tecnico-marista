import axios from 'axios';
import { Room } from '../types';

export interface StudentStatus {
  found: boolean;
  student?: { id: string; name: string };
  activeCheckIn: {
    id: string;
    checkInAt: string;
    room: { id: string; name: string; type: string };
  } | null;
}

const kioskClient = axios.create({ baseURL: '/api/kiosk' });

export const kioskApi = {
  rooms: () => kioskClient.get<Room[]>('/rooms').then((r) => r.data),
  checkIn: (registration: string, roomId: string) =>
    kioskClient
      .post('/checkin', { registration, roomId })
      .then((r) => r.data),
  checkOut: (registration: string) =>
    kioskClient.post('/checkout', { registration }).then((r) => r.data),
  status: (registration: string) =>
    kioskClient.get<StudentStatus>(`/status/${encodeURIComponent(registration)}`).then((r) => r.data),
};
