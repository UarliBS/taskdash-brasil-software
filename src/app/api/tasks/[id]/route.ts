import type { TaskStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, validationError } from "@/lib/http";
import { statusLabels } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { parseDueDate, taskSchema } from "@/lib/validation";

type RouteContext = {
  params: {
    id: string;
  };
};

const allowedStatusTransitions: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ["IN_PROGRESS"],
  IN_PROGRESS: ["DONE"],
  DONE: ["IN_PROGRESS"],
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Acesso nao autorizado.", 401);
  }

  const task = await prisma.task.findFirst({
    where: {
      id: context.params.id,
      userId: user.id,
      deletedAt: null,
    },
    include: {
      histories: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!task) {
    return jsonError("Tarefa nao encontrada.", 404);
  }

  return Response.json({ task });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Acesso nao autorizado.", 401);
  }

  try {
    const body = taskSchema.parse(await request.json());
    const existingTask = await prisma.task.findFirst({
      where: {
        id: context.params.id,
        userId: user.id,
        deletedAt: null,
      },
    });

    if (!existingTask) {
      return jsonError("Tarefa nao encontrada.", 404);
    }

    const statusChanged = existingTask.status !== body.status;

    if (
      statusChanged &&
      !allowedStatusTransitions[existingTask.status].includes(body.status)
    ) {
      return jsonError("Transicao de status nao permitida.", 422);
    }

    const changeType = statusChanged ? "STATUS_CHANGED" : "UPDATED";
    const description = statusChanged
      ? `Status alterado de ${statusLabels[existingTask.status]} para ${
          statusLabels[body.status]
        }.`
      : "Dados da tarefa atualizados.";

    const task = await prisma.task.update({
      where: { id: existingTask.id },
      data: {
        title: body.title,
        description: body.description || null,
        dueDate: parseDueDate(body.dueDate),
        priority: body.priority,
        status: body.status,
        histories: {
          create: {
            changeType,
            description,
            userId: user.id,
          },
        },
      },
      include: {
        histories: {
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return Response.json({ task });
  } catch (error) {
    return validationError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Acesso nao autorizado.", 401);
  }

  const existingTask = await prisma.task.findFirst({
    where: {
      id: context.params.id,
      userId: user.id,
      deletedAt: null,
    },
  });

  if (!existingTask) {
    return jsonError("Tarefa nao encontrada.", 404);
  }

  await prisma.task.update({
    where: { id: existingTask.id },
    data: {
      deletedAt: new Date(),
      histories: {
        create: {
          changeType: "DELETED",
          description: "Tarefa excluida.",
          userId: user.id,
        },
      },
    },
  });

  return Response.json({ ok: true });
}
