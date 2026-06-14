import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { jsonError, validationError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      return jsonError("E-mail ou senha invalidos.", 401);
    }

    const passwordMatches = await bcrypt.compare(body.password, user.passwordHash);

    if (!passwordMatches) {
      return jsonError("E-mail ou senha invalidos.", 401);
    }

    await createSession(user.id);

    return Response.json({
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    return validationError(error);
  }
}
