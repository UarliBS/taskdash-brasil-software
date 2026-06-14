import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "taskdash_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET nao foi configurado.");
  }

  return new TextEncoder().encode(secret);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });
}

export function clearSession() {
  cookies().delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const token = cookies().get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = await jwtVerify(token, getSecret());
    const userId = payload.payload.sub;

    if (!userId) {
      return null;
    }

    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, createdAt: true },
    });
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
