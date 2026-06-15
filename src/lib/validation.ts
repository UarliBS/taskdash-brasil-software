import { Priority, TaskStatus } from "@prisma/client";
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome completo."),
  email: z.string().trim().email("Informe um e-mail válido.").toLowerCase(),
  password: z.string().trim().min(8, "A senha deve ter no mínimo 8 caracteres."),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.").toLowerCase(),
  password: z.string().min(1, "Informe a senha."),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.").toLowerCase(),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().trim().min(1, "Token inválido."),
  password: z.string().trim().min(8, "A senha deve ter no mínimo 8 caracteres."),
});

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Informe o título da tarefa."),
  description: z.string().trim().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.nativeEnum(Priority, {
    errorMap: () => ({ message: "Prioridade inválida." }),
  }),
  status: z.nativeEnum(TaskStatus, {
    errorMap: () => ({ message: "Status inválido." }),
  }),
});

export const taskFiltersSchema = z.object({
  q: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  dueDate: z.string().optional(),
});

export function parseDueDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Data de vencimento inválida.");
  }

  return date;
}
