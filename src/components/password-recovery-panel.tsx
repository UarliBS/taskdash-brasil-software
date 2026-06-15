"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";

type PasswordRecoveryPanelProps = {
  mode: "request" | "confirm";
};

export function PasswordRecoveryPanel({ mode }: PasswordRecoveryPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const isConfirm = mode === "confirm";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setPreviewUrl("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch(
      isConfirm
        ? "/api/auth/password-reset/confirm"
        : "/api/auth/password-reset/request",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isConfirm ? { ...payload, token } : payload),
      },
    );

    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setError(data.message ?? "Não foi possível processar a solicitação.");
      return;
    }

    setMessage(data.message ?? "Solicitação processada.");

    if (data.previewResetUrl) {
      setPreviewUrl(data.previewResetUrl);
    }

    if (isConfirm) {
      setTimeout(() => router.push("/login"), 1400);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-shell" aria-labelledby="password-recovery-title">
        <aside className="auth-story" aria-label="Recuperação de acesso">
          <div className="auth-brand">
            <span className="auth-brand-mark">TD</span>
            <span>TaskDash</span>
          </div>

          <div className="auth-story-copy">
            <p className="eyebrow">Recuperação de acesso</p>
            <h1>Volte para suas tarefas com segurança.</h1>
            <p>
              Enviaremos um link temporário para redefinir sua senha e proteger
              sua conta.
            </p>
          </div>

          <div className="auth-checklist">
            {["Link temporário", "Token único", "Senha protegida"].map((item) => (
              <div key={item}>
                <CheckCircle2 size={18} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </aside>

        <section className="auth-panel" aria-labelledby="password-recovery-title">
          <div>
            <p className="auth-badge">
              <ShieldCheck size={14} />
              Acesso seguro
            </p>
            <h2 id="password-recovery-title">
              {isConfirm ? "Nova senha" : "Recuperar senha"}
            </h2>
            <p className="muted">
              {isConfirm
                ? "Informe uma nova senha para finalizar a recuperação."
                : "Informe seu e-mail para receber o link de redefinição."}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {isConfirm ? (
              <>
                <label className="auth-field">
                  Nova senha
                  <span className="auth-input-wrap">
                    <KeyRound size={18} />
                    <input
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                    />
                  </span>
                  <span className="field-hint">
                    A senha deve ter no mínimo 8 caracteres.
                  </span>
                </label>
                {!token ? (
                  <p className="form-error">
                    Link inválido. Solicite uma nova recuperação de senha.
                  </p>
                ) : null}
              </>
            ) : (
              <label className="auth-field">
                E-mail
                <span className="auth-input-wrap">
                  <Mail size={18} />
                  <input name="email" type="email" autoComplete="email" />
                </span>
                <span className="field-hint">Informe o e-mail cadastrado.</span>
              </label>
            )}

            {error ? <p className="form-error">{error}</p> : null}
            {message ? <p className="form-success">{message}</p> : null}
            {previewUrl ? (
              <p className="dev-preview-link">
                Ambiente local: <Link href={previewUrl}>abrir link de recuperação</Link>
              </p>
            ) : null}

            <button
              className="primary-button auth-submit"
              type="submit"
              disabled={loading || (isConfirm && !token)}
            >
              {loading
                ? "Aguarde..."
                : isConfirm
                  ? "Redefinir senha"
                  : "Enviar link"}
              <ArrowRight size={17} />
            </button>
          </form>

          <p className="auth-switch">
            Lembrou a senha? <Link href="/login">Entrar</Link>
          </p>
        </section>
      </section>
    </main>
  );
}
