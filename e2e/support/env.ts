export const TEST_BACKEND_PORT = 4000;
export const TEST_FRONTEND_PORT = 4173;

export const TEST_DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  'postgres://marista:marista@localhost:5435/marista_test';

export const TEST_JWT_SECRET = 'e2e-test-secret';

// Trailing slash matters: with playwright `request.newContext({ baseURL })`,
// relative paths without a leading slash preserve the /api/ prefix.
export const TEST_API_BASE = `http://localhost:${TEST_BACKEND_PORT}/api/`;
export const TEST_FRONT_BASE = `http://localhost:${TEST_FRONTEND_PORT}`;
