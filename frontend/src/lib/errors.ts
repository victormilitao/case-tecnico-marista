import axios from 'axios';

export function getApiErrorMessage(err: unknown, fallback = 'Erro inesperado') {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string | string[] }
      | undefined;
    if (Array.isArray(data?.message)) return data!.message.join(', ');
    if (typeof data?.message === 'string') return data!.message;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
