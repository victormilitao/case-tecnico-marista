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
      // Backend with isolated DATABASE_URL/PORT so it never touches dev data.
      command: 'npm run start --prefix ../backend',
      cwd: __dirname,
      // /api/auth/me responds 401 without a token (< 500) — Playwright accepts.
      url: `http://localhost:${TEST_BACKEND_PORT}/api/auth/me`,
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
