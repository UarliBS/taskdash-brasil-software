import bcrypt from "bcryptjs";
import { hashPasswordResetToken } from "@/lib/password-reset";
import { jsonError, validationError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { passwordResetConfirmSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = passwordResetConfirmSchema.parse(await request.json());
    const tokenHash = hashPasswordResetToken(body.token);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt.getTime() < Date.now()
    ) {
      return jsonError("O link de recuperação é inválido ou expirou.", 422);
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          usedAt: null,
          id: { not: resetToken.id },
        },
        data: { usedAt: new Date() },
      }),
    ]);

    return Response.json({ message: "Senha redefinida com sucesso." });
  } catch (error) {
    return validationError(error);
  }
}
