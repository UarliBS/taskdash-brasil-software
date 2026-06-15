import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

const PORT = process.env.TEST_PORT ?? "3100";
const BASE_URL = `http://localhost:${PORT}`;
const NEXT_CLI = fileURLToPath(
  new URL("../../node_modules/next/dist/bin/next", import.meta.url),
);

let server;

before(async () => {
  const serverOutput = { value: "" };

  server = spawn(process.execPath, [NEXT_CLI, "start", "-p", PORT], {
    env: {
      ...process.env,
      APP_URL: BASE_URL,
      AUTH_COOKIE_SECURE: "false",
      RESEND_API_KEY: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  server.stdout.on("data", (chunk) => {
    serverOutput.value += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    serverOutput.value += chunk.toString();
  });

  server.once("exit", (code) => {
    if (code !== null && code !== 0) {
      serverOutput.value += `\nServer exited with code ${code}`;
    }
  });

  await waitForServer(serverOutput);
});

after(async () => {
  if (!server || server.killed) {
    return;
  }

  server.kill();
  await Promise.race([once(server, "exit"), delay(1000)]);
});

test("rejects invalid registration data and duplicate email", async () => {
  const client = createClient();
  const email = uniqueEmail("validacao");

  const invalidEmail = await client.post("/api/auth/register", {
    name: "Teste Validacao",
    email: "email-invalido",
    password: "12345678",
  });

  assert.equal(invalidEmail.status, 422);
  assert.match(invalidEmail.body.message, /e-mail/i);

  const shortPassword = await client.post("/api/auth/register", {
    name: "Teste Validacao",
    email,
    password: "123",
  });

  assert.equal(shortPassword.status, 422);
  assert.match(shortPassword.body.message, /8 caracteres/i);

  const created = await client.post("/api/auth/register", {
    name: "Teste Validacao",
    email,
    password: "12345678",
  });

  assert.equal(created.status, 201);
  assert.equal(created.body.user.email, email);

  const duplicate = await createClient().post("/api/auth/register", {
    name: "Outro Usuario",
    email,
    password: "12345678",
  });

  assert.equal(duplicate.status, 409);
  assert.match(duplicate.body.message, /cadastrado/i);
});

test("protects task routes from unauthenticated access", async () => {
  const response = await createClient().get("/api/tasks");

  assert.equal(response.status, 401);
});

test("creates, filters, updates, deletes and summarizes tasks", async () => {
  const client = await registerUser("tarefas");
  const yesterday = isoDate(-1);
  const tomorrow = isoDate(1);

  const missingDueDate = await client.post("/api/tasks", {
    title: "Sem vencimento",
    responsible: "Ana Silva",
    description: "Deve falhar",
    priority: "HIGH",
    status: "PENDING",
  });

  assert.equal(missingDueDate.status, 422);
  assert.match(missingDueDate.body.message, /vencimento/i);

  const firstTask = await client.post("/api/tasks", {
    title: "Revisar requisitos",
    responsible: "Ana Silva",
    description: "Validar fluxo de filtros e dashboard",
    dueDate: yesterday,
    priority: "HIGH",
    status: "PENDING",
  });

  assert.equal(firstTask.status, 201);
  assert.equal(firstTask.body.task.responsible, "Ana Silva");

  const secondTask = await client.post("/api/tasks", {
    title: "Entrega final",
    responsible: "Bruno Costa",
    description: "Concluir documentacao",
    dueDate: tomorrow,
    priority: "MEDIUM",
    status: "DONE",
  });

  assert.equal(secondTask.status, 201);

  const allTasks = await client.get("/api/tasks");
  assert.equal(allTasks.status, 200);
  assert.equal(allTasks.body.dashboard.total, 2);
  assert.equal(allTasks.body.dashboard.PENDING, 1);
  assert.equal(allTasks.body.dashboard.DONE, 1);
  assert.equal(allTasks.body.dashboard.OVERDUE, 1);

  const filteredByResponsible = await client.get("/api/tasks?responsible=ana");
  assert.equal(filteredByResponsible.body.tasks.length, 1);
  assert.equal(filteredByResponsible.body.tasks[0].responsible, "Ana Silva");

  const searched = await client.get("/api/tasks?q=dashboard");
  assert.equal(searched.body.tasks.length, 1);
  assert.equal(searched.body.tasks[0].title, "Revisar requisitos");

  const invalidTransition = await client.patch(
    `/api/tasks/${firstTask.body.task.id}`,
    {
      title: "Revisar requisitos",
      responsible: "Ana Silva",
      description: "Tentativa invalida",
      dueDate: yesterday,
      priority: "HIGH",
      status: "DONE",
    },
  );

  assert.equal(invalidTransition.status, 422);

  const inProgress = await client.patch(`/api/tasks/${firstTask.body.task.id}`, {
    title: "Revisar requisitos",
    responsible: "Ana Silva",
    description: "Em andamento",
    dueDate: yesterday,
    priority: "HIGH",
    status: "IN_PROGRESS",
  });

  assert.equal(inProgress.status, 200);
  assert.equal(inProgress.body.task.status, "IN_PROGRESS");

  const done = await client.patch(`/api/tasks/${firstTask.body.task.id}`, {
    title: "Revisar requisitos",
    responsible: "Ana Silva",
    description: "Concluida",
    dueDate: yesterday,
    priority: "HIGH",
    status: "DONE",
  });

  assert.equal(done.status, 200);
  assert.equal(done.body.task.status, "DONE");
  assert.ok(done.body.task.histories.length >= 3);

  const deleted = await client.delete(`/api/tasks/${secondTask.body.task.id}`);
  assert.equal(deleted.status, 200);
  assert.equal(deleted.body.ok, true);

  const afterDelete = await client.get("/api/tasks");
  assert.equal(afterDelete.body.dashboard.total, 1);
  assert.equal(afterDelete.body.dashboard.OVERDUE, 0);
});

test("isolates tasks between authenticated users", async () => {
  const owner = await registerUser("dono");
  const other = await registerUser("outro");

  const created = await owner.post("/api/tasks", {
    title: "Tarefa privada",
    responsible: "Usuario Dono",
    description: "Nao deve aparecer para outro usuario",
    dueDate: isoDate(2),
    priority: "LOW",
    status: "PENDING",
  });

  assert.equal(created.status, 201);

  const otherTasks = await other.get("/api/tasks");
  assert.equal(otherTasks.status, 200);
  assert.equal(otherTasks.body.tasks.length, 0);

  const otherDetail = await other.get(`/api/tasks/${created.body.task.id}`);
  assert.equal(otherDetail.status, 404);
});

test("generates a password reset preview link and accepts a new password", async () => {
  const client = await registerUser("reset");
  const email = client.email;

  const requestReset = await createClient().post(
    "/api/auth/password-reset/request",
    { email },
  );

  assert.equal(requestReset.status, 200);
  assert.match(requestReset.body.message, /e-mail/i);
  assert.ok(requestReset.body.previewResetUrl);

  const token = new URL(requestReset.body.previewResetUrl).searchParams.get(
    "token",
  );

  assert.ok(token);

  const confirmReset = await createClient().post(
    "/api/auth/password-reset/confirm",
    {
      token,
      password: "novaSenha123",
    },
  );

  assert.equal(confirmReset.status, 200);

  const loginWithNewPassword = await createClient().post("/api/auth/login", {
    email,
    password: "novaSenha123",
  });

  assert.equal(loginWithNewPassword.status, 200);
  assert.equal(loginWithNewPassword.body.user.email, email);
});

async function waitForServer(serverOutput) {
  const deadline = Date.now() + 20000;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(
        `Test server stopped before startup.\n${serverOutput.value}`,
      );
    }

    try {
      const response = await fetch(`${BASE_URL}/login`);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until Next finishes booting.
    }

    await delay(250);
  }

  throw new Error(`Test server did not start in time.\n${serverOutput.value}`);
}

async function registerUser(prefix) {
  const client = createClient();
  const email = uniqueEmail(prefix);
  const response = await client.post("/api/auth/register", {
    name: `Usuario ${prefix}`,
    email,
    password: "12345678",
  });

  assert.equal(response.status, 201);
  client.email = email;

  return client;
}

function createClient() {
  const cookies = new Map();

  async function request(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    };
    const cookieHeader = serializeCookies(cookies);

    if (cookieHeader) {
      headers.Cookie = cookieHeader;
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      body:
        options.body && typeof options.body !== "string"
          ? JSON.stringify(options.body)
          : options.body,
      redirect: "manual",
    });

    storeCookies(cookies, response.headers.get("set-cookie"));

    const text = await response.text();
    const body = text ? JSON.parse(text) : null;

    return {
      body,
      headers: response.headers,
      status: response.status,
    };
  }

  return {
    delete: (path) => request(path, { method: "DELETE" }),
    get: (path) => request(path, { method: "GET" }),
    patch: (path, body) => request(path, { body, method: "PATCH" }),
    post: (path, body) => request(path, { body, method: "POST" }),
  };
}

function storeCookies(cookies, setCookieHeader) {
  if (!setCookieHeader) {
    return;
  }

  for (const cookie of splitSetCookie(setCookieHeader)) {
    const [nameValue] = cookie.split(";");
    const [name, value] = nameValue.split("=");
    cookies.set(name.trim(), value);
  }
}

function splitSetCookie(header) {
  return header.split(/,(?=\s*[^;,]+=)/);
}

function serializeCookies(cookies) {
  return Array.from(cookies.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}@taskdash.test`;
}

function isoDate(offsetDays) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}
