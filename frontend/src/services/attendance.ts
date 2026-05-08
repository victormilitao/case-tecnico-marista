import { api } from './api';
import { Attendance } from '../types';

export const attendanceApi = {
  list: (filter?: { studentId?: string; roomId?: string }) =>
    api
      .get<Attendance[]>('/attendance', { params: filter })
      .then((r) => r.data),
};
