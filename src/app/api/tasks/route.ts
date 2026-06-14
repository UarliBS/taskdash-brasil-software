import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, validationError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parseDueDate, taskFiltersSchema, taskSchema } from "@/lib/validation";

function endOfDay(dateValue: string) {
  const date = new Date(`${dateValue}T23:59:59.999Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Data de vencimento invalida.");
  }

  return date;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Acesso nao autorizado.", 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const filters = taskFiltersSchema.parse({
      q: searchParams.get("q") || undefined,
      status: searchParams.get("status") || undefined,
      priority: searchParams.get("priority") || undefined,
      dueDate: searchParams.get("dueDate") || undefined,
    });

    const where: Prisma.TaskWhereInput = {
      userId: user.id,
      deletedAt: null,
    };

    if (filters.q) {
      where.OR = [
        { title: { contains: filters.q, mode: "insensitive" } },
        { description: { contains: filters.q, mode: "insensitive" } },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.dueDate) {
      where.dueDate = {
        gte: parseDueDate(filters.dueDate),
        lte: endOfDay(filters.dueDate),
      };
    }

    const [tasks, dashboard] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          histories: {
            orderBy: { createdAt: "desc" },
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      }),
      prisma.task.groupBy({
        by: ["status"],
        where: {
          userId: user.id,
          deletedAt: null,
        },
        _count: { _all: true },
      }),
    ]);

    const counts = {
      total: 0,
      PENDING: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    };

    for (const item of dashboard) {
      counts[item.status] = item._count._all;
      counts.total += item._count._all;
    }

    return Response.json({ tasks, dashboard: counts });
  } catch (error) {
    return validationError(error);
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Acesso nao autorizado.", 401);
  }

  try {
    const body = taskSchema.parse(await request.json());
    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description || null,
        dueDate: parseDueDate(body.dueDate),
        priority: body.priority,
        status: body.status,
        userId: user.id,
        histories: {
          create: {
            changeType: "CREATED",
            description: "Tarefa criada.",
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

    return Response.json({ task }, { status: 201 });
  } catch (error) {
    return validationError(error);
  }
}
