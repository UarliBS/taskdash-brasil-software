import type { HistoryType, Priority, TaskStatus } from "@prisma/client";

export const priorityLabels: Record<Priority, string> = {
  LOW: "Baixa",
  MEDIUM: "Media",
  HIGH: "Alta",
};

export const statusLabels: Record<TaskStatus, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluida",
};

export const historyLabels: Record<HistoryType, string> = {
  CREATED: "Criacao",
  UPDATED: "Atualizacao",
  STATUS_CHANGED: "Mudanca de status",
  DELETED: "Exclusao",
};
