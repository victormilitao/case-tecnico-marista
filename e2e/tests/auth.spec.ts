import { test, expect } from '@playwright/test';
import { resetDatabase, closePool } from '../support/db';
import { createAdminViaApi } from '../support/api';

test.describe('Admin authentication', () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test.afterAll(async () => {
    await closePool();
  });

  test('Sign up: creates admin account through the UI and lands on Dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /Cadastre-se/i }).click();
    await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible();

    await page.getByPlaceholder('Seu nome completo').fill('Maria Admin');
    await page.getByPlaceholder('seu@email.com').fill('maria@e2e.local');
    await page.getByPlaceholder('••••••••').fill('senha-forte-123');

    await page.getByRole('button', { name: /Criar conta/i }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('Login: existing admin signs in with correct credentials', async ({ page }) => {
    // Support: admin is created via API since the feature under test is LOGIN, not registration.
    const admin = await createAdminViaApi({ email: 'login@e2e.local', password: 'pwd12345' });

    await page.goto('/login');
    await page.getByPlaceholder('seu@email.com').fill(admin.email);
    await page.getByPlaceholder('••••••••').fill(admin.password);
    await page.getByRole('button', { name: /^Entrar$/i }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(admin.name)).toBeVisible();
  });

  test('Login with wrong password shows error and stays on the page', async ({ page }) => {
    await createAdminViaApi({ email: 'maria@e2e.local', password: 'pwd12345' });

    await page.goto('/login');
    await page.getByPlaceholder('seu@email.com').fill('maria@e2e.local');
    await page.getByPlaceholder('••••••••').fill('wrong-password');
    await page.getByRole('button', { name: /^Entrar$/i }).click();

    await expect(page.getByText(/Credenciais inválidas/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
