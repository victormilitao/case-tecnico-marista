import { test, expect } from '@playwright/test';
import { resetDatabase, closePool } from '../support/db';
import { createAdminViaApi, createRoomViaApi, createStudentViaApi } from '../support/api';

test.describe('Fluxo do aluno: primeiro acesso, check-in e check-out', () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test.afterAll(async () => {
    await closePool();
  });

  test('Primeiro acesso (set-password) → check-in → check-out → histórico', async ({ page }) => {
    // Suporte: precisamos de um admin (pra criar dados), uma sala e um aluno cadastrado.
    // O aluno é criado SEM senha — primeiro acesso vai exigir cadastrá-la.
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

    // Aluno acessa a área dele e informa a matrícula
    await page.goto('/aluno/login');
    await expect(page.getByRole('heading', { name: 'Área do aluno' })).toBeVisible();
    await page.getByPlaceholder('Sua matrícula').fill(student.registration);
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Como é o primeiro acesso, deve cair no fluxo de criar senha
    await expect(page.getByRole('heading', { name: 'Criar senha' })).toBeVisible();

    const senhas = page.getByPlaceholder('••••••••');
    await senhas.nth(0).fill('aluno-senha-1');
    await senhas.nth(1).fill('aluno-senha-1');
    await page.getByRole('button', { name: /Criar senha e entrar/i }).click();

    // Já no dashboard do aluno
    await expect(page).toHaveURL(/\/aluno$/);
    await expect(page.getByText('Olá, João!')).toBeVisible();

    // Faz check-in escolhendo a sala (option value = roomId)
    await page.getByLabel(/Selecione o ambiente/i).selectOption(room.id);
    await page.getByRole('button', { name: /Registrar entrada/i }).click();

    // UI confirma a entrada e mostra info do ambiente atual
    await expect(page.getByText(/Entrada registrada com sucesso/i)).toBeVisible();
    await expect(page.getByText('Você está no ambiente')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Registrar saída/i }),
    ).toBeVisible();

    // Faz check-out
    await page.getByRole('button', { name: /Registrar saída/i }).click();
    await expect(page.getByText(/Saída registrada com sucesso/i)).toBeVisible();

    // Volta a poder fazer check-in (formulário disponível de novo)
    await expect(page.getByLabel(/Selecione o ambiente/i)).toBeVisible();

    // Histórico mostra o registro com status "Encerrado"
    const historicoRow = page
      .getByRole('row')
      .filter({ has: page.getByText(room.name) });
    await expect(historicoRow.getByText(/Encerrado/)).toBeVisible();
  });

  test('Login posterior: aluno que já tem senha entra direto e vê o dashboard', async ({ page }) => {
    // Setup: cria admin, sala e aluno; depois, simula primeiro acesso pela UI
    // pra deixar o aluno com senha cadastrada.
    const admin = await createAdminViaApi();
    await createRoomViaApi(admin, { name: 'Sala 12', type: 'classroom', capacity: 30 });
    const student = await createStudentViaApi(admin, {
      registration: '20240002',
      name: 'Ana Souza',
      email: 'ana@e2e.local',
    });

    // Cria a senha do aluno via UI (set-password)
    await page.goto('/aluno/login');
    await page.getByPlaceholder('Sua matrícula').fill(student.registration);
    await page.getByRole('button', { name: 'Continuar' }).click();
    const senhas = page.getByPlaceholder('••••••••');
    await senhas.nth(0).fill('senha-da-ana');
    await senhas.nth(1).fill('senha-da-ana');
    await page.getByRole('button', { name: /Criar senha e entrar/i }).click();
    await expect(page).toHaveURL(/\/aluno$/);

    // Faz logout
    await page.getByRole('button', { name: /Sair/i }).click();
    await expect(page).toHaveURL(/\/aluno\/login$/);

    // Login normal: matrícula → senha
    await page.getByPlaceholder('Sua matrícula').fill(student.registration);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible();
    await page.getByPlaceholder('Sua senha').fill('senha-da-ana');
    await page.getByRole('button', { name: /^Entrar$/i }).click();

    await expect(page).toHaveURL(/\/aluno$/);
    await expect(page.getByText('Olá, Ana!')).toBeVisible();
  });
});
