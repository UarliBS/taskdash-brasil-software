import { createPasswordResetToken } from "@/lib/password-reset";
import { jsonError, validationError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { isLocalAppUrl, sendPasswordResetEmail } from "@/lib/resend";
import { passwordResetRequestSchema } from "@/lib/validation";

const genericMessage =
  "Se o e-mail estiver cadastrado, enviaremos um link de recuperação.";

export async function POST(request: Request) {
  try {
    const body = passwordResetRequestSchema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { email: body.email },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return Response.json({ message: genericMessage });
    }

    const resetToken = createPasswordResetToken();
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl.replace(/\/$/, "")}/reset-password?token=${
      resetToken.token
    }`;

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: resetToken.tokenHash,
        expiresAt: resetToken.expiresAt,
      },
    });

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });

    return Response.json({
      message: genericMessage,
      previewResetUrl: isLocalAppUrl() ? resetUrl : undefined,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Resend")) {
      return jsonError(error.message, 502);
    }

    return validationError(error);
  }
}
