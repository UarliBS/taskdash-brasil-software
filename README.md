# TaskDash - Brasil Software

Sistema web de gerenciamento de tarefas desenvolvido para o desafio técnico do Programa de Trainee Brasil Software.

## Stack

- Next.js 16
- TypeScript
- PostgreSQL
- Prisma
- bcryptjs
- JWT em cookie httpOnly

## Requisitos Atendidos

- Cadastro de usuário com nome, e-mail único e senha mínima de 8 caracteres.
- Login e logout.
- Recuperação de senha por e-mail com Resend.
- Senhas armazenadas com hash bcrypt.
- Rotas internas protegidas por autenticação.
- CRUD de tarefas por usuário autenticado.
- Tarefas com responsável e data de vencimento obrigatórios.
- Prioridades: Baixa, Média e Alta.
- Status: Pendente, Em andamento e Concluída.
- Transições de status validadas no backend.
- Pesquisa por título e descrição.
- Filtros por status, prioridade, responsável e data de vencimento.
- Dashboard com total geral, totais por status e tarefas atrasadas.
- Histórico de alterações por tarefa.
- Exclusão com confirmação na interface e remoção lógica das consultas.
- Interface responsiva.

## Como Rodar

1. Instale as dependências:

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

Para validar a versão de produção local:

```bash
npm run build
npm run start
```

Para executar a suíte de testes automatizados:

```bash
npm test
```

Os testes sobem a aplicação em `http://localhost:3100`, exercitam as rotas reais e validam autenticação, tarefas, filtros, dashboard, histórico, isolamento por usuário e recuperação de senha.

## Variáveis de Ambiente

```env
DATABASE_URL="postgresql://taskdash:taskdash@localhost:5432/taskdash?schema=public"
AUTH_SECRET="change-this-secret-before-production"
AUTH_COOKIE_SECURE="false"
APP_URL="http://localhost:3000"
RESEND_API_KEY=""
RESEND_FROM_EMAIL="TaskDash <onboarding@resend.dev>"
```

Use `AUTH_COOKIE_SECURE="true"` apenas em ambientes HTTPS.

Para envio real de recuperação de senha, configure `RESEND_API_KEY` e um remetente verificado em `RESEND_FROM_EMAIL`. Em ambiente local com `APP_URL` apontando para `localhost`, a API retorna um link de preview para facilitar testes sem disparar e-mail real.

## Observações de Escopo

A recuperação de senha por e-mail foi implementada com token temporário e envio via Resend. O MVP prioriza autenticação, regras de tarefa, dashboard, filtros e histórico.
