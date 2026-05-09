/**
 * Variáveis fixas do ambiente E2E.
 * Usamos portas distintas das de dev pra que o E2E nunca toque o banco/backend reais.
 */
export const TEST_BACKEND_PORT = 4000;
export const TEST_FRONTEND_PORT = 4173;

export const TEST_DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  'postgres://marista:marista@localhost:5435/marista_test';

export const TEST_JWT_SECRET = 'e2e-test-secret';

// Termina com barra: ao usar com playwright `request.newContext({ baseURL })`,
// caminhos relativos sem barra inicial preservam o prefixo /api/.
export const TEST_API_BASE = `http://localhost:${TEST_BACKEND_PORT}/api/`;
export const TEST_FRONT_BASE = `http://localhost:${TEST_FRONTEND_PORT}`;
