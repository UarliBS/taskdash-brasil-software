"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AuthPanelProps = {
  mode: "login" | "register";
};

export function AuthPanel({ mode }: AuthPanelProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch(`/api/auth/${isRegister ? "register" : "login"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setError(data.message ?? "Nao foi possivel autenticar.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div>
          <p className="eyebrow">TaskDash</p>
          <h1 id="auth-title">{isRegister ? "Criar conta" : "Entrar"}</h1>
          <p className="muted">
            {isRegister
              ? "Cadastre-se para organizar suas tarefas em um painel unico."
              : "Acesse seu painel de tarefas, filtros e indicadores."}
          </p>
        </div>

        <form className="stack" onSubmit={handleSubmit}>
          {isRegister ? (
            <label>
              Nome completo
              <input name="name" type="text" autoComplete="name" required />
            </label>
          ) : null}

          <label>
            E-mail
            <input name="email" type="email" autoComplete="email" required />
          </label>

          <label>
            Senha
            <input
              name="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              minLength={isRegister ? 8 : undefined}
              required
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Aguarde..." : isRegister ? "Cadastrar" : "Entrar"}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? "Ja possui conta?" : "Ainda nao possui conta?"}{" "}
          <Link href={isRegister ? "/login" : "/register"}>
            {isRegister ? "Entrar" : "Criar conta"}
          </Link>
        </p>
      </section>
    </main>
  );
}
