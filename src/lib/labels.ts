import type { HistoryType, Priority, TaskStatus } from "@prisma/client";

export const priorityLabels: Record<Priority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
};

export const statusLabels: Record<TaskStatus, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluída",
};

export const historyLabels: Record<HistoryType, string> = {
  CREATED: "Criação",
  UPDATED: "Atualização",
  STATUS_CHANGED: "Mudança de status",
  DELETED: "Exclusão",
};
