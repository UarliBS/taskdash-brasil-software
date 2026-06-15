import crypto from "crypto";

export const PASSWORD_RESET_TOKEN_MINUTES = 30;

export function createPasswordResetToken() {
  const token = crypto.randomBytes(32).toString("base64url");
  return {
    token,
    tokenHash: hashPasswordResetToken(token),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_MINUTES * 60 * 1000),
  };
}

export function hashPasswordResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
