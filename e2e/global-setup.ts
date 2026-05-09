/**
 * Roda uma vez antes de toda a suíte: garante que o banco de teste está acessível
 * e aplica as migrations do drizzle.
 *
 * Pré-requisito: o serviço `postgres-test` do docker-compose precisa estar de pé.
 *   docker compose --profile test up -d postgres-test
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'node:path';
import { Pool } from 'pg';
import { TEST_DATABASE_URL } from './support/env';
import { waitForPostgres } from './support/db';

export default async function globalSetup() {
  console.log('[e2e] aguardando Postgres de teste...');
  await waitForPostgres();

  console.log('[e2e] aplicando migrations...');
  const pool = new Pool({ connectionString: TEST_DATABASE_URL });
  const db = drizzle(pool);
  const migrationsFolder = path.resolve(
    __dirname,
    '../backend/src/database/migrations',
  );
  await migrate(db, { migrationsFolder });
  await pool.end();

  console.log('[e2e] DB pronto.');
}
