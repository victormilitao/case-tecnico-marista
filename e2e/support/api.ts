/**
 * Helpers para criar dados de suporte via API (admin, sala, aluno).
 * Os fluxos de autenticação e check-in/check-out são exercitados via UI nos specs;
 * estes helpers existem só para o setup quando precisamos de pré-condições rápidas.
 */
import { request, APIRequestContext } from '@playwright/test';
import { TEST_API_BASE } from './env';

export interface AdminFixture {
  email: string;
  password: string;
  name: string;
  accessToken: string;
}

export async function createAdminViaApi(opts?: {
  name?: string;
  email?: string;
  password?: string;
}): Promise<AdminFixture> {
  const ctx = await request.newContext({ baseURL: TEST_API_BASE });
  const email = opts?.email ?? `admin+${Date.now()}@e2e.local`;
  const password = opts?.password ?? 'pwd12345';
  const name = opts?.name ?? 'E2E Admin';

  const res = await ctx.post('auth/register', {
    data: { name, email, password },
  });
  if (!res.ok()) {
    throw new Error(`Falha ao registrar admin: ${res.status()} ${await res.text()}`);
  }
  const body = (await res.json()) as { accessToken: string };
  await ctx.dispose();
  return { email, password, name, accessToken: body.accessToken };
}

export async function createRoomViaApi(
  admin: AdminFixture,
  data: { name: string; type: 'classroom' | 'laboratory' | 'study_room'; capacity: number },
): Promise<{ id: string; name: string }> {
  const ctx = await request.newContext({
    baseURL: TEST_API_BASE,
    extraHTTPHeaders: { Authorization: `Bearer ${admin.accessToken}` },
  });
  const res = await ctx.post('rooms', { data });
  if (!res.ok()) {
    throw new Error(`Falha ao criar sala: ${res.status()} ${await res.text()}`);
  }
  const room = await res.json();
  await ctx.dispose();
  return room;
}

export async function createStudentViaApi(
  admin: AdminFixture,
  data: { registration: string; name: string; email: string },
): Promise<{ id: string; registration: string; name: string; email: string }> {
  const ctx = await request.newContext({
    baseURL: TEST_API_BASE,
    extraHTTPHeaders: { Authorization: `Bearer ${admin.accessToken}` },
  });
  const res = await ctx.post('students', { data });
  if (!res.ok()) {
    throw new Error(`Falha ao criar aluno: ${res.status()} ${await res.text()}`);
  }
  const student = await res.json();
  await ctx.dispose();
  return student;
}

/**
 * Espera o backend ficar saudável (responde a /api/auth/login).
 * Útil em casos de race entre webServer e os specs.
 */
export async function waitForBackend(
  ctx: APIRequestContext,
  timeoutMs = 30_000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await ctx.post('/auth/login', { data: { email: 'x@x.com', password: 'x' } });
      // backend responde 400 (validation) ou 401 — qualquer < 500 serve
      if (res.status() < 500) return;
    } catch {
      /* ignore */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Backend não respondeu a tempo');
}
