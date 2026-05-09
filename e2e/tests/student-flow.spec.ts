import { test, expect } from '@playwright/test';
import { resetDatabase, closePool } from '../support/db';
import { createAdminViaApi, createRoomViaApi, createStudentViaApi } from '../support/api';

test.describe('Student flow: first access, check-in and check-out', () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test.afterAll(async () => {
    await closePool();
  });

  test('First access (set-password) → check-in → check-out → history', async ({ page }) => {
    // Support: admin (to seed data), one room and one student without a password yet.
    const admin = await createAdminViaApi();
    const room = await createRoomViaApi(admin, {
      name: 'Laboratório A',
      type: 'laboratory',
      capacity: 10,
    });
    const student = await createStudentViaApi(admin, {
      registration: '20240001',
      name: 'João da Silva',
      email: 'joao@e2e.local',
    });

    await page.goto('/aluno/login');
    await expect(page.getByRole('heading', { name: 'Área do aluno' })).toBeVisible();
    await page.getByPlaceholder('Sua matrícula').fill(student.registration);
    await page.getByRole('button', { name: 'Continuar' }).click();

    await expect(page.getByRole('heading', { name: 'Criar senha' })).toBeVisible();

    const passwordInputs = page.getByPlaceholder('••••••••');
    await passwordInputs.nth(0).fill('aluno-senha-1');
    await passwordInputs.nth(1).fill('aluno-senha-1');
    await page.getByRole('button', { name: /Criar senha e entrar/i }).click();

    await expect(page).toHaveURL(/\/aluno$/);
    await expect(page.getByText('Olá, João!')).toBeVisible();

    await page.getByLabel(/Selecione o ambiente/i).selectOption(room.id);
    await page.getByRole('button', { name: /Registrar entrada/i }).click();

    await expect(page.getByText(/Entrada registrada com sucesso/i)).toBeVisible();
    await expect(page.getByText('Você está no ambiente')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Registrar saída/i }),
    ).toBeVisible();

    await page.getByRole('button', { name: /Registrar saída/i }).click();
    await expect(page.getByText(/Saída registrada com sucesso/i)).toBeVisible();

    await expect(page.getByLabel(/Selecione o ambiente/i)).toBeVisible();

    const historyRow = page
      .getByRole('row')
      .filter({ has: page.getByText(room.name) });
    await expect(historyRow.getByText(/Encerrado/)).toBeVisible();
  });

  test('Returning student with password signs in and sees the dashboard', async ({ page }) => {
    const admin = await createAdminViaApi();
    await createRoomViaApi(admin, { name: 'Sala 12', type: 'classroom', capacity: 30 });
    const student = await createStudentViaApi(admin, {
      registration: '20240002',
      name: 'Ana Souza',
      email: 'ana@e2e.local',
    });

    // Seed the student password through the UI (set-password flow).
    await page.goto('/aluno/login');
    await page.getByPlaceholder('Sua matrícula').fill(student.registration);
    await page.getByRole('button', { name: 'Continuar' }).click();
    const passwordInputs = page.getByPlaceholder('••••••••');
    await passwordInputs.nth(0).fill('senha-da-ana');
    await passwordInputs.nth(1).fill('senha-da-ana');
    await page.getByRole('button', { name: /Criar senha e entrar/i }).click();
    await expect(page).toHaveURL(/\/aluno$/);

    await page.getByRole('button', { name: /Sair/i }).click();
    await expect(page).toHaveURL(/\/aluno\/login$/);

    await page.getByPlaceholder('Sua matrícula').fill(student.registration);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible();
    await page.getByPlaceholder('Sua senha').fill('senha-da-ana');
    await page.getByRole('button', { name: /^Entrar$/i }).click();

    await expect(page).toHaveURL(/\/aluno$/);
    await expect(page.getByText('Olá, Ana!')).toBeVisible();
  });
});
