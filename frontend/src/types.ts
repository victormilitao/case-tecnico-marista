export type AuthRole = 'admin' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  registration?: string;
}

export interface Student {
  id: string;
  registration: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export type RoomType = 'classroom' | 'laboratory' | 'study_room';

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  classroom: 'Sala de aula',
  laboratory: 'Laboratório',
  study_room: 'Sala de estudos',
};

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  capacity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  checkInAt: string;
  checkOutAt: string | null;
  student: { id: string; name: string; registration: string };
  room: { id: string; name: string; type: RoomType };
}

export interface Occupancy {
  room: Room;
  occupants: Array<{
    attendanceId: string;
    checkInAt: string;
    student: { id: string; name: string; registration: string };
  }>;
  occupancy: number;
  capacity: number;
  occupancyRate: number;
}
