import { describe, expect, it } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { getApiErrorMessage } from './errors';

function makeAxiosError(data: unknown) {
  const headers = new AxiosHeaders();
  const err = new AxiosError(
    'Request failed',
    'ERR_BAD_REQUEST',
    { headers } as never,
    null,
    {
      data,
      status: 400,
      statusText: 'Bad Request',
      headers,
      config: { headers } as never,
    },
  );
  return err;
}

describe('getApiErrorMessage', () => {
  it('extrai message string do payload Axios', () => {
    const err = makeAxiosError({ message: 'E-mail já cadastrado' });
    expect(getApiErrorMessage(err)).toBe('E-mail já cadastrado');
  });

  it('junta array de mensagens (validation pipe)', () => {
    const err = makeAxiosError({
      message: ['email must be valid', 'password too short'],
    });
    expect(getApiErrorMessage(err)).toBe('email must be valid, password too short');
  });

  it('cai no err.message quando payload não tem message', () => {
    const err = makeAxiosError({});
    expect(getApiErrorMessage(err)).toBe('Request failed');
  });

  it('extrai message de Error padrão', () => {
    expect(getApiErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('usa fallback para tipos desconhecidos', () => {
    expect(getApiErrorMessage('coisa estranha', 'fallback!')).toBe('fallback!');
  });
});
