# TaskDash - Brasil Software

Sistema web de gerenciamento de tarefas desenvolvido para o desafio técnico do Programa de Trainee Brasil Software.

Aplicação publicada: https://taskdash-brasil-software.vercel.app

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

## Capturas da Aplicação

### Autenticação

| Login | Cadastro |
| --- | --- |
| ![Tela de login](docs/screenshots/login.png) | ![Tela de cadastro](docs/screenshots/cadastro.png) |

### Dashboard e Tarefas

| Dashboard vazio | Dashboard com tarefas |
| --- | --- |
| ![Dashboard sem tarefas](docs/screenshots/dashboard-vazio.png) | ![Dashboard com tarefa cadastrada](docs/screenshots/dashboard-tarefas.png) |

| Detalhes da tarefa | Editar tarefa |
| --- | --- |
| ![Modal de detalhes da tarefa](docs/screenshots/detalhes-tarefa.png) | ![Modal de edição da tarefa](docs/screenshots/editar-tarefa.png) |

| Confirmação de exclusão | Recuperação de senha |
| --- | --- |
| ![Modal de confirmação de exclusão](docs/screenshots/confirmacao-exclusao.png) | ![Tela de recuperação de senha](docs/screenshots/recuperar-senha.png) |

### E-mail de Redefinição

![E-mail de redefinição de senha](docs/screenshots/email-redefinicao-senha.png)

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

## Deploy com Supabase e Vercel

### 1. Banco de dados no Supabase

Crie um projeto no Supabase e copie a connection string do PostgreSQL. Para produção na Vercel, prefira a URL com pooler quando disponível.

Rode as migrations no banco do Supabase:

```powershell
$env:DATABASE_URL="postgresql://usuario:senha@host:porta/database?schema=public"
npx.cmd prisma migrate deploy
```

No terminal Linux/macOS:

```bash
DATABASE_URL="postgresql://usuario:senha@host:porta/database?schema=public" npx prisma migrate deploy
```

### 2. Variáveis na Vercel

Configure em **Project Settings > Environment Variables**:

```env
DATABASE_URL="postgresql://usuario:senha@host:porta/database?schema=public"
AUTH_SECRET="gere-uma-chave-grande-e-segura"
AUTH_COOKIE_SECURE="true"
APP_URL="https://seu-projeto.vercel.app"
RESEND_API_KEY="sua-chave-do-resend"
RESEND_FROM_EMAIL="TaskDash <email@seudominio.com>"
```

Use o mesmo `APP_URL` do domínio final da Vercel. Esse valor é usado para montar o link de recuperação de senha.

### 3. Configuração do build

A Vercel pode usar o comando padrão do projeto:

```bash
npm run build
```

O script executa `prisma generate` antes do build do Next.js.

### 4. Resend em produção

Para envio real de e-mails, configure `RESEND_API_KEY` e utilize um remetente/domínio verificado no `RESEND_FROM_EMAIL`. Sem essa configuração, a recuperação de senha não enviará e-mail em produção.

### 5. Checklist pós-deploy

- Criar uma conta nova.
- Fazer login e logout.
- Criar, editar, visualizar e excluir uma tarefa.
- Testar filtros por status, prioridade, responsável e data.
- Conferir dashboard, incluindo tarefas atrasadas.
- Solicitar recuperação de senha e abrir o link recebido por e-mail.
- Confirmar que os cookies funcionam em HTTPS com `AUTH_COOKIE_SECURE="true"`.

## Observações de Escopo

A recuperação de senha por e-mail foi implementada com token temporário e envio via Resend. O MVP prioriza autenticação, regras de tarefa, dashboard, filtros e histórico.
