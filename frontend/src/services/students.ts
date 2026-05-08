import { api } from './api';
import { Student } from '../types';

export const studentsApi = {
  list: () => api.get<Student[]>('/students').then((r) => r.data),
  create: (data: { registration: string; name: string; email: string }) =>
    api.post<Student>('/students', data).then((r) => r.data),
  update: (
    id: string,
    data: Partial<{ registration: string; name: string; email: string }>,
  ) => api.patch<Student>(`/students/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/students/${id}`).then((r) => r.data),
};
