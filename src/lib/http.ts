import { ZodError } from "zod";

export function jsonError(message: string, status = 400) {
  return Response.json({ message }, { status });
}

export function validationError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError(error.errors[0]?.message ?? "Dados inválidos.", 422);
  }

  if (error instanceof Error) {
    return jsonError(error.message, 422);
  }

  return jsonError("Não foi possível processar a solicitação.", 422);
}
