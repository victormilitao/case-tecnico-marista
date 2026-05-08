# Marista – Controle de Espaços de Ensino

Aplicação web para gerenciar o uso de ambientes de ensino (salas de aula, laboratórios e salas de estudo), permitindo o cadastro de alunos e ambientes, o registro de entrada/saída e o acompanhamento da taxa de ocupação.

> A descrição do problema e os requisitos do desafio estão em [spec.md](spec.md).

---

## O que a aplicação faz

- **Autenticação JWT** para os usuários administrativos.
- **CRUD de alunos** (matrícula, nome, e-mail).
- **CRUD de ambientes** (nome, tipo: sala de aula / laboratório / sala de estudos, capacidade).
- **Registro de presença** (check-in / check-out) dos alunos nos ambientes.
- **Modo Kiosk** — tela pública para o aluno registrar entrada e saída usando a matrícula, sem necessidade de login administrativo.
- **Dashboard** com a taxa de ocupação dos ambientes em tempo real.

### Estrutura de páginas (frontend)

| Rota | Descrição | Acesso |
| --- | --- | --- |
| `/` | Página inicial | Público |
| `/login` | Login do administrador | Público |
| `/kiosk` | Terminal de check-in/out por matrícula | Público |
| `/dashboard` | Visão de ocupação dos ambientes | Autenticado |
| `/students` | Gestão de alunos | Autenticado |
| `/rooms` | Gestão de ambientes | Autenticado |
| `/attendance` | Histórico de presenças | Autenticado |

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

### Infraestrutura
- **Docker Compose** subindo PostgreSQL na porta `5434`.

---

## Pré-requisitos

- **Node.js** 20+ e **npm**
- **Docker** + **Docker Compose** (para o PostgreSQL)

---

## Como iniciar

### 1. Subir o banco de dados

Na raiz do projeto:

```bash
docker compose up -d
```

Sobe um Postgres em `localhost:5434` (usuário/senha/db: `marista`).

### 2. Backend

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

### 3. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

O frontend espera a API em `http://localhost:3333/api` (ver `frontend/src/services/api.ts`).

---

## Estrutura do repositório

```
.
├── docker-compose.yml          # PostgreSQL
├── spec.md                     # Especificação do case
├── backend/
│   ├── drizzle.config.ts
│   └── src/
│       ├── main.ts             # bootstrap Nest
│       ├── app.module.ts
│       ├── auth/               # login, register, JWT guard
│       ├── students/           # CRUD de alunos
│       ├── rooms/              # CRUD de ambientes
│       ├── attendance/         # check-in / check-out / histórico
│       ├── kiosk/              # endpoints públicos do terminal
│       └── database/
│           ├── schema.ts       # tabelas Drizzle
│           ├── migrate.ts
│           └── migrations/
└── frontend/
    └── src/
        ├── main.tsx
        ├── App.tsx             # rotas
        ├── pages/              # Home, Login, Kiosk, Dashboard, Students, Rooms, Attendance
        ├── components/         # Layout, Modal, Button, Input, ProtectedRoute
        ├── contexts/AuthContext.tsx
        └── services/           # axios + chamadas por domínio
```

---

## Modelo de dados

| Tabela | Campos principais |
| --- | --- |
| `users` | `id`, `name`, `email` (unique), `password_hash` |
| `students` | `id`, `registration` (unique), `name`, `email` (unique) |
| `rooms` | `id`, `name`, `type` (`classroom` / `laboratory` / `study_room`), `capacity` |
| `attendances` | `id`, `student_id`, `room_id`, `check_in_at`, `check_out_at` (nullable) |

Um `attendance` em aberto (`check_out_at IS NULL`) representa um aluno presente no ambiente.

---

## API – principais endpoints

Prefixo: `/api`. Salvo `auth/*` e `kiosk/*`, todas as rotas exigem `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/auth/register` | Cria usuário admin |
| POST | `/auth/login` | Retorna JWT |
| GET | `/auth/me` | Usuário autenticado |
| GET/POST/PATCH/DELETE | `/students` | CRUD de alunos |
| GET/POST/PATCH/DELETE | `/rooms` | CRUD de ambientes |
| GET/POST | `/attendance` | Lista e registra presenças |
| POST | `/kiosk/check-in` | Check-in público por matrícula |
| POST | `/kiosk/check-out` | Check-out público por matrícula |

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
npm test               # Jest
```

### Frontend
```bash
npm run dev            # vite dev server
npm run build          # build de produção
npm run preview        # preview do build
```

---

## Próximos passos sugeridos

- Adicionar testes e2e cobrindo o fluxo de check-in/check-out.
- Métricas históricas de ocupação (não só o snapshot atual).
