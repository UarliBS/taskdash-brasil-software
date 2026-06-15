"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { FormEvent, useState } from "react";

type AuthPanelProps = {
  mode: "login" | "register";
};

export function AuthPanel({ mode }: AuthPanelProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      setError(data.message ?? "Não foi possível autenticar.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="auth-page">
      <section className="auth-shell" aria-labelledby="auth-title">
        <aside className="auth-story" aria-label="Resumo do TaskDash">
          <div className="auth-brand">
            <span className="auth-brand-mark">TD</span>
            <span>TaskDash</span>
          </div>

          <div className="auth-story-copy">
            <p className="eyebrow">Painel de tarefas</p>
            <h1>Organize o dia com clareza.</h1>
            <p>
              Prioridades, status e indicadores em um espaco simples para
              acompanhar o que precisa avancar.
            </p>
          </div>

          <div className="auth-checklist">
            {["Acesso protegido", "Dashboard resumido", "Histórico por tarefa"].map(
              (item) => (
                <div key={item}>
                  <CheckCircle2 size={18} />
                  <span>{item}</span>
                </div>
              ),
            )}
          </div>

          <div className="auth-preview" aria-hidden="true">
            <div className="auth-preview-header">
              <span />
              <span />
              <span />
            </div>
            <div className="auth-preview-row strong">
              <span>Entrega do desafio</span>
              <b>Alta</b>
            </div>
            <div className="auth-preview-row">
              <span>Revisar filtros</span>
              <b>Média</b>
            </div>
            <div className="auth-preview-progress">
              <span />
            </div>
          </div>
        </aside>

        <section className="auth-panel" aria-labelledby="auth-title">
          <div className="auth-mobile-brand">
            <span className="auth-brand-mark">TD</span>
            <span>TaskDash</span>
          </div>

          <div>
            <p className="auth-badge">
              <ShieldCheck size={14} />
              Acesso seguro
            </p>
            <h2 id="auth-title">{isRegister ? "Criar conta" : "Entrar"}</h2>
            <p className="muted">
              {isRegister
                ? "Cadastre-se para organizar suas tarefas em um painel único."
                : "Acesse seu painel de tarefas, filtros e indicadores."}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister ? (
              <label className="auth-field">
                Nome completo
                <span className="auth-input-wrap">
                  <UserRound size={18} />
                  <input name="name" type="text" autoComplete="name" required />
                </span>
              </label>
            ) : null}

            <label className="auth-field">
              E-mail
              <span className="auth-input-wrap">
                <Mail size={18} />
                <input name="email" type="email" autoComplete="email" required />
              </span>
              <span className="field-hint">Informe um e-mail válido.</span>
            </label>

            <label className="auth-field">
              Senha
              <span className="auth-input-wrap">
                <KeyRound size={18} />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  minLength={8}
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
              <span className="field-hint">
                A senha deve ter no mínimo 8 caracteres.
              </span>
            </label>

            {error ? <p className="form-error">{error}</p> : null}

            <button
              className="primary-button auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Aguarde..." : isRegister ? "Cadastrar" : "Entrar"}
              <ArrowRight size={17} />
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? "Já possui conta?" : "Ainda não possui conta?"}{" "}
            <Link href={isRegister ? "/login" : "/register"}>
              {isRegister ? "Entrar" : "Criar conta"}
            </Link>
          </p>
        </section>
      </section>
    </main>
  );
}
