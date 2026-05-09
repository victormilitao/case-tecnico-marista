import { Pool } from 'pg';
import { TEST_DATABASE_URL } from './env';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: TEST_DATABASE_URL });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Aguarda o Postgres aceitar conexões.
 * Útil quando o container acabou de subir.
 */
export async function waitForPostgres(timeoutMs = 30_000): Promise<void> {
  const start = Date.now();
  let lastErr: unknown;
  while (Date.now() - start < timeoutMs) {
    try {
      const p = new Pool({ connectionString: TEST_DATABASE_URL });
      await p.query('SELECT 1');
      await p.end();
      return;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`Postgres não respondeu em ${timeoutMs}ms: ${String(lastErr)}`);
}

/**
 * Limpa todas as tabelas em ordem (respeitando FK).
 * Chamar em beforeEach.
 */
export async function resetDatabase(): Promise<void> {
  await getPool().query(
    'TRUNCATE TABLE attendances, students, rooms, users RESTART IDENTITY CASCADE',
  );
}
