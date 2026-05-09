import { defineConfig, devices } from '@playwright/test';
import { TEST_BACKEND_PORT, TEST_FRONTEND_PORT, TEST_DATABASE_URL, TEST_JWT_SECRET } from './support/env';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './global-setup.ts',
  use: {
    baseURL: `http://localhost:${TEST_FRONTEND_PORT}`,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      // Backend de teste — DATABASE_URL e PORT distintos do dev
      command: 'npm run start --prefix ../backend',
      cwd: __dirname,
      url: `http://localhost:${TEST_BACKEND_PORT}/api/auth/me`,
      // /api/auth/me responde 401 sem token (< 500) — Playwright aceita
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        DATABASE_URL: TEST_DATABASE_URL,
        JWT_SECRET: TEST_JWT_SECRET,
        JWT_EXPIRES_IN: '1d',
        PORT: String(TEST_BACKEND_PORT),
      },
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      // Frontend em dev mode com proxy /api → backend de teste (porta TEST_BACKEND_PORT)
      command: `npx vite --port ${TEST_FRONTEND_PORT} --strictPort`,
      cwd: __dirname + '/../frontend',
      url: `http://localhost:${TEST_FRONTEND_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        VITE_E2E_BACKEND_PORT: String(TEST_BACKEND_PORT),
      },
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
