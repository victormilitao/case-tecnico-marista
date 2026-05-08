import axios from 'axios';

export const TOKEN_KEY = 'marista.token';

export const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AUTH_ATTEMPT_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/student/login',
  '/auth/student/set-password',
];

function isAuthAttempt(url?: string) {
  if (!url) return false;
  return AUTH_ATTEMPT_PATHS.some((p) => url.endsWith(p));
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isAuthAttempt(error.config?.url)) {
      localStorage.removeItem(TOKEN_KEY);
      const path = window.location.pathname;
      const target = path.startsWith('/aluno') ? '/aluno/login' : '/login';
      if (path !== target) {
        window.location.href = target;
      }
    }
    return Promise.reject(error);
  },
);
