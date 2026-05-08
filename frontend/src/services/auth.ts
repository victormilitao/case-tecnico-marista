import { api } from './api';
import { User } from '../types';

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface StudentLoginResponse {
  accessToken?: string;
  user?: User;
  requiresPasswordSetup?: boolean;
  requiresPassword?: boolean;
}

export const authApi = {
  login: (email: string, password: string) =>
    api
      .post<AuthResponse>('/auth/login', { email, password })
      .then((r) => r.data),
  register: (name: string, email: string, password: string) =>
    api
      .post<AuthResponse>('/auth/register', { name, email, password })
      .then((r) => r.data),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
  studentLogin: (registration: string, password?: string) =>
    api
      .post<StudentLoginResponse>('/auth/student/login', {
        registration,
        password,
      })
      .then((r) => r.data),
  studentSetPassword: (registration: string, password: string) =>
    api
      .post<AuthResponse>('/auth/student/set-password', {
        registration,
        password,
      })
      .then((r) => r.data),
};
