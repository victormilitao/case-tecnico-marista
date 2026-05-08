/**
 * Testes do interceptor do axios.
 * Não executamos requisições reais; usamos os interceptors diretamente.
 */
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { api, TOKEN_KEY } from './api';

function makeRequestConfig(): InternalAxiosRequestConfig {
  return {
    headers: new AxiosHeaders(),
  } as InternalAxiosRequestConfig;
}

function makeError(status: number, url: string): AxiosError {
  const headers = new AxiosHeaders();
  return new AxiosError(
    'fail',
    'ERR',
    { headers, url } as never,
    null,
    {
      data: {},
      status,
      statusText: '',
      headers,
      config: { headers, url } as never,
    },
  );
}

function getRequestInterceptor() {
  // @ts-expect-error acesso interno só para teste
  const handlers = api.interceptors.request.handlers as Array<{
    fulfilled: (cfg: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
  }>;
  return handlers[0].fulfilled;
}

function getResponseRejected() {
  // @ts-expect-error acesso interno só para teste
  const handlers = api.interceptors.response.handlers as Array<{
    rejected: (err: AxiosError) => unknown;
  }>;
  return handlers[0].rejected;
}

describe('api request interceptor', () => {
  beforeEach(() => localStorage.clear());

  it('adiciona Bearer token quando há token no storage', () => {
    localStorage.setItem(TOKEN_KEY, 'abc');
    const cfg = getRequestInterceptor()(makeRequestConfig());
    expect(cfg.headers.Authorization).toBe('Bearer abc');
  });

  it('não define Authorization quando não há token', () => {
    const cfg = getRequestInterceptor()(makeRequestConfig());
    expect(cfg.headers.Authorization).toBeUndefined();
  });
});

describe('api response interceptor (401)', () => {
  beforeEach(() => {
    localStorage.setItem(TOKEN_KEY, 'abc');
    Object.defineProperty(window, 'location', {
      value: { pathname: '/dashboard', href: '/dashboard' },
      writable: true,
    });
  });

  it('limpa token e redireciona admin para /login', async () => {
    await expect(
      getResponseRejected()(makeError(401, '/api/students')),
    ).rejects.toBeDefined();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  it('redireciona aluno para /aluno/login', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/aluno/dashboard', href: '/aluno/dashboard' },
      writable: true,
    });
    await expect(
      getResponseRejected()(makeError(401, '/api/me')),
    ).rejects.toBeDefined();
    expect(window.location.href).toBe('/aluno/login');
  });

  it('NÃO desloga quando 401 vem de tentativa de login (deixa o caller tratar)', async () => {
    await expect(
      getResponseRejected()(makeError(401, '/api/auth/login')),
    ).rejects.toBeDefined();
    expect(localStorage.getItem(TOKEN_KEY)).toBe('abc');
  });

  it('rejeita normalmente erros não-401', async () => {
    await expect(
      getResponseRejected()(makeError(500, '/api/students')),
    ).rejects.toBeDefined();
    expect(localStorage.getItem(TOKEN_KEY)).toBe('abc');
  });
});

describe('exporta TOKEN_KEY constante', () => {
  it('valor estável', () => {
    expect(TOKEN_KEY).toBe('marista.token');
  });
});

// silenciar warning de async
void vi.fn;
