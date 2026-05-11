# Marista – Controle de Espaços de Ensino

Aplicação web para gerenciar o uso de ambientes de ensino (salas de aula, laboratórios e salas de estudo), permitindo o cadastro de alunos e ambientes, o registro de entrada/saída e o acompanhamento da taxa de ocupação.

> A descrição do problema e os requisitos do desafio estão em [spec.md](spec.md).

---

## O que a aplicação faz

- **Autenticação JWT** com dois papéis: administrador e aluno.
- **CRUD de alunos** (matrícula, nome, e-mail) — pelo admin.
- **CRUD de ambientes** (nome, tipo: sala de aula / laboratório / sala de estudos, capacidade) — pelo admin.
- **Área do aluno**: login por matrícula (com cadastro de senha no primeiro acesso), check-in / check-out em um ambiente e histórico pessoal de presenças.
- **Dashboard administrativo** com a taxa de ocupação dos ambientes em tempo real.
- **Histórico geral de presenças** para o admin, com filtros.
- **Auditoria** das ações do admin (create / update / delete de alunos, ambientes e usuários) com tela de consulta.
- **Tema claro/escuro** no frontend, com preferência persistida.

### Estrutura de páginas (frontend)

| Rota | Descrição | Acesso |
| --- | --- | --- |
| `/` | Página inicial | Público |
| `/login` | Login do administrador | Público |
| `/aluno/login` | Login do aluno (matrícula + senha) | Público |
| `/aluno` | Área do aluno: check-in/out e histórico pessoal | Aluno |
| `/dashboard` | Visão de ocupação dos ambientes | Admin |
| `/students` | Gestão de alunos | Admin |
| `/rooms` | Gestão de ambientes | Admin |
| `/attendance` | Histórico geral de presenças | Admin |
| `/audit-logs` | Consulta de auditoria das ações do admin | Admin |

---

## Stack

### Backend (`/backend`)
- **Node.js** + **TypeScript**
- **NestJS 10** (framework HTTP)
- **Drizzle ORM** + **drizzle-kit** (migrações)
- **PostgreSQL 16**
- **JWT** (`@nestjs/jwt` + `passport-jwt`) para autenticação
- **bcrypt** para hash de senhas
- **class-validator** / **class-transformer** para validação de DTOs
- **Jest** para testes

### Frontend (`/frontend`)
- **React 18** + **TypeScript**
- **Vite 6** (dev server / build)
- **React Router 6**
- **Axios** (cliente HTTP)
- **Tailwind CSS 3**
- **Vitest** + **Testing Library** para testes de componentes/páginas
- **Playwright** (em `/e2e`) para testes end-to-end

### Infraestrutura
- **Docker Compose** subindo a stack completa: PostgreSQL, backend (NestJS) e frontend (Nginx servindo o build do Vite).

---

## Pré-requisitos

- **Node.js** 20+ e **npm**
- **Docker** + **Docker Compose** (para o PostgreSQL)

---

## Como iniciar

### Opção A — Stack completa via Docker Compose

Sobe Postgres, backend e frontend de uma vez:

```bash
docker compose up -d --build
```

- Frontend (Nginx): http://localhost:8080
- Backend (API): http://localhost:3333/api
- Postgres: `localhost:5434` (usuário/senha/db: `marista`)

O backend aplica as migrations automaticamente no start. Variáveis sensíveis (`JWT_SECRET`, `JWT_EXPIRES_IN`) podem ser sobrescritas via `.env` na raiz.

Ainda é preciso criar o primeiro admin (ver seção abaixo) — apontando o curl para `http://localhost:3333/api/auth/register`.

### Opção B — Desenvolvimento local

#### 1. Subir o banco de dados

Na raiz do projeto:

```bash
docker compose up -d postgres
```

Sobe um Postgres em `localhost:5434` (usuário/senha/db: `marista`).

#### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run db:migrate     # aplica as migrações
npm run start:dev      # API em http://localhost:3333/api
```

Variáveis em `.env`:

```env
DATABASE_URL=postgres://marista:marista@localhost:5434/marista
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=1d
PORT=3333
```

#### Criando o primeiro usuário admin

Não há seed automático. Crie via endpoint público de registro:

```bash
curl -X POST http://localhost:3333/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@marista.dev","password":"123456"}'
```

> Em produção, este endpoint deve ser protegido ou removido.

#### 3. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev            
```

O frontend espera a API em `http://localhost:3333/api` (ver `frontend/src/services/api.ts`).

---

## Scripts úteis

### Backend
```bash
npm run start:dev      # dev com watch
npm run build          # build de produção
npm run start:prod     # roda dist/
npm run db:generate    # gera migration a partir do schema.ts
npm run db:migrate     # aplica migrations
npm run db:studio      # abre o Drizzle Studio
npm test               # Jest (unit + integração: *.spec.ts e *.int-spec.ts)
```

### Frontend
```bash
npm run dev            # vite dev server
npm run build          # build de produção
npm run preview        # preview do build
npm test               # Vitest (testes de componentes/páginas)
npm run test:watch     # Vitest em modo watch
npm run test:coverage  # Vitest com cobertura
```

### E2E (Playwright) — `/e2e`

Suite end-to-end que sobe backend + frontend + Postgres isolado e roda os fluxos no Chromium.

```bash
cd e2e
npm install
npm run db:up          # sobe Postgres de teste em localhost:5435 (profile=test)
npm test               # roda os specs (backend e frontend são iniciados pelo Playwright)
npm run test:headed    # mesma coisa, com navegador visível
npm run test:ui        # modo interativo do Playwright
npm run report         # abre o último relatório HTML
npm run db:down        # derruba o Postgres de teste
```

O Postgres de teste usa porta `5435` e database `marista_test` (separado do dev em `5434`). Backend e frontend de teste sobem nas portas `4000` e `4173` via `webServer` do Playwright.

---
