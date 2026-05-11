/**
 * API helpers for seeding support data (admin, room, student).
 * Authentication and check-in/check-out flows are exercised through the UI
 * in the specs; these helpers exist only to set up preconditions quickly.
 */
import { request } from '@playwright/test';
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
    throw new Error(`Failed to register admin: ${res.status()} ${await res.text()}`);
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
    throw new Error(`Failed to create room: ${res.status()} ${await res.text()}`);
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
    throw new Error(`Failed to create student: ${res.status()} ${await res.text()}`);
  }
  const student = await res.json();
  await ctx.dispose();
  return student;
}
