# TaskDash - Brasil Software

Sistema web de gerenciamento de tarefas desenvolvido para o desafio tecnico do Programa de Trainee Brasil Software.

## Stack

- Next.js 14
- TypeScript
- PostgreSQL
- Prisma
- bcryptjs
- JWT em cookie httpOnly

## Requisitos Atendidos

- Cadastro de usuario com nome, e-mail unico e senha minima de 8 caracteres.
- Login e logout.
- Senhas armazenadas com hash bcrypt.
- Rotas internas protegidas por autenticacao.
- CRUD de tarefas por usuario autenticado.
- Prioridades: Baixa, Media e Alta.
- Status: Pendente, Em andamento e Concluida.
- Transicoes de status validadas no backend.
- Pesquisa por titulo e descricao.
- Filtros por status, prioridade e data de vencimento.
- Dashboard com total geral e totais por status.
- Historico de alteracoes por tarefa.
- Exclusao com confirmacao na interface e remocao logica das consultas.
- Interface responsiva.

## Como Rodar

1. Instale as dependencias:

```bash
npm install
```

2. Suba o PostgreSQL:

```bash
docker compose up -d
```

3. Configure o ambiente:

```bash
cp .env.example .env
```

No Windows PowerShell, se preferir:

```powershell
Copy-Item .env.example .env
```

4. Rode as migrations:

```bash
npx prisma migrate dev
```

5. Inicie o servidor:

```bash
npm run dev
```

Acesse `http://localhost:3000`.

Para validar a versao de producao local:

```bash
npm run build
npm run start
```

## Variaveis de Ambiente

```env
DATABASE_URL="postgresql://taskdash:taskdash@localhost:5432/taskdash?schema=public"
AUTH_SECRET="change-this-secret-before-production"
AUTH_COOKIE_SECURE="false"
```

Use `AUTH_COOKIE_SECURE="true"` apenas em ambientes HTTPS.

## Observacoes de Escopo

A recuperacao de senha por e-mail foi tratada como opcional, pois o documento usa "podera disponibilizar". O MVP prioriza autenticacao, regras de tarefa, dashboard, filtros e historico.
