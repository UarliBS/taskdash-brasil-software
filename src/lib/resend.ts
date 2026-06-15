type SendPasswordResetEmailParams = {
  to: string;
  name: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: SendPasswordResetEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    if (!isLocalAppUrl()) {
      throw new Error("Resend não foi configurado.");
    }

    console.info("[TaskDash] Link de recuperação de senha:", resetUrl);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Redefinição de senha do TaskDash",
      html: passwordResetEmailHtml({ name, resetUrl }),
      text: `Olá, ${name}. Para redefinir sua senha no TaskDash, acesse: ${resetUrl}. Este link expira em 30 minutos.`,
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Não foi possível enviar o e-mail pelo Resend. ${details}`);
  }
}

export function isLocalAppUrl() {
  const appUrl = process.env.APP_URL ?? "";
  return appUrl.includes("localhost") || appUrl.includes("127.0.0.1");
}

function passwordResetEmailHtml({
  name,
  resetUrl,
}: {
  name: string;
  resetUrl: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; color: #092f25; line-height: 1.6;">
      <h1 style="color: #064e3b;">Redefinição de senha</h1>
      <p>Olá, ${escapeHtml(name)}.</p>
      <p>Recebemos uma solicitação para redefinir sua senha no TaskDash.</p>
      <p>
        <a href="${resetUrl}" style="display: inline-block; background: #064e3b; color: #ffffff; padding: 12px 16px; border-radius: 8px; text-decoration: none; font-weight: 700;">
          Redefinir senha
        </a>
      </p>
      <p>Este link expira em 30 minutos. Se você não solicitou essa alteração, ignore este e-mail.</p>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
