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
  // @ts-expect-error reaching into private handlers for tests
  const handlers = api.interceptors.request.handlers as Array<{
    fulfilled: (cfg: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
  }>;
  return handlers[0].fulfilled;
}

function getResponseRejected() {
  // @ts-expect-error reaching into private handlers for tests
  const handlers = api.interceptors.response.handlers as Array<{
    rejected: (err: AxiosError) => unknown;
  }>;
  return handlers[0].rejected;
}

describe('api request interceptor', () => {
  beforeEach(() => localStorage.clear());

  it('adds Bearer token when storage has one', () => {
    localStorage.setItem(TOKEN_KEY, 'abc');
    const cfg = getRequestInterceptor()(makeRequestConfig());
    expect(cfg.headers.Authorization).toBe('Bearer abc');
  });

  it('does not set Authorization when there is no token', () => {
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

  it('clears token and redirects admin to /login', async () => {
    await expect(
      getResponseRejected()(makeError(401, '/api/students')),
    ).rejects.toBeDefined();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  it('redirects student to /aluno/login', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/aluno/dashboard', href: '/aluno/dashboard' },
      writable: true,
    });
    await expect(
      getResponseRejected()(makeError(401, '/api/me')),
    ).rejects.toBeDefined();
    expect(window.location.href).toBe('/aluno/login');
  });

  it('does NOT log out when 401 comes from a login attempt (caller handles it)', async () => {
    await expect(
      getResponseRejected()(makeError(401, '/api/auth/login')),
    ).rejects.toBeDefined();
    expect(localStorage.getItem(TOKEN_KEY)).toBe('abc');
  });

  it('rejects non-401 errors normally', async () => {
    await expect(
      getResponseRejected()(makeError(500, '/api/students')),
    ).rejects.toBeDefined();
    expect(localStorage.getItem(TOKEN_KEY)).toBe('abc');
  });
});

describe('TOKEN_KEY', () => {
  it('exports stable value', () => {
    expect(TOKEN_KEY).toBe('marista.token');
  });
});

void vi.fn;
