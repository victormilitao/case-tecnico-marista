/**
 * Runs once before the whole suite: ensures the test database is reachable
 * and applies the drizzle migrations.
 *
 * Prerequisite: the `postgres-test` service from docker-compose must be up.
 *   docker compose --profile test up -d postgres-test
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'node:path';
import { Pool } from 'pg';
import { TEST_DATABASE_URL } from './support/env';
import { waitForPostgres } from './support/db';

export default async function globalSetup() {
  console.log('[e2e] waiting for test Postgres...');
  await waitForPostgres();

  console.log('[e2e] applying migrations...');
  const pool = new Pool({ connectionString: TEST_DATABASE_URL });
  const db = drizzle(pool);
  const migrationsFolder = path.resolve(
    __dirname,
    '../backend/src/database/migrations',
  );
  await migrate(db, { migrationsFolder });
  await pool.end();

  console.log('[e2e] DB ready.');
}
