import { test, expect } from '@playwright/test';
import { resetDatabase, closePool } from '../support/db';
import { createAdminViaApi } from '../support/api';

test.describe('Autenticação admin', () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test.afterAll(async () => {
    await closePool();
  });

  test('Cadastro: cria conta de admin pela UI e entra no Dashboard', async ({ page }) => {
    await page.goto('/login');

    // Vai para o modo de cadastro
    await page.getByRole('button', { name: /Cadastre-se/i }).click();
    await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible();

    await page.getByPlaceholder('Seu nome completo').fill('Maria Admin');
    await page.getByPlaceholder('seu@email.com').fill('maria@e2e.local');
    await page.getByPlaceholder('••••••••').fill('senha-forte-123');

    await page.getByRole('button', { name: /Criar conta/i }).click();

    // Após cadastro, é redirecionado pra /dashboard com sessão válida
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('Login: admin existente entra com credenciais corretas', async ({ page }) => {
    // Suporte: cria o admin via API (a feature em teste é o LOGIN, não o registro)
    const admin = await createAdminViaApi({ email: 'login@e2e.local', password: 'pwd12345' });

    await page.goto('/login');
    await page.getByPlaceholder('seu@email.com').fill(admin.email);
    await page.getByPlaceholder('••••••••').fill(admin.password);
    await page.getByRole('button', { name: /^Entrar$/i }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(admin.name)).toBeVisible();
  });

  test('Login com senha errada exibe mensagem de erro e mantém na tela', async ({ page }) => {
    await createAdminViaApi({ email: 'maria@e2e.local', password: 'pwd12345' });

    await page.goto('/login');
    await page.getByPlaceholder('seu@email.com').fill('maria@e2e.local');
    await page.getByPlaceholder('••••••••').fill('senha-errada');
    await page.getByRole('button', { name: /^Entrar$/i }).click();

    await expect(page.getByText(/Credenciais inválidas/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
