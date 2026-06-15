"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  ClipboardList,
  Eye,
  Filter,
  LogOut,
  Pencil,
  Plus,
  Save,
  Search,
  TimerReset,
  Trash2,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

type Priority = "LOW" | "MEDIUM" | "HIGH";
type TaskStatus = "PENDING" | "IN_PROGRESS" | "DONE";
type HistoryType = "CREATED" | "UPDATED" | "STATUS_CHANGED" | "DELETED";

type User = {
  id: string;
  name: string;
  email: string;
};

type TaskHistory = {
  id: string;
  changeType: HistoryType;
  description: string;
  createdAt: string;
  user: User;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  responsible: string;
  dueDate: string | null;
  priority: Priority;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  histories: TaskHistory[];
};

type DashboardCounts = {
  total: number;
  PENDING: number;
  IN_PROGRESS: number;
  DONE: number;
  OVERDUE: number;
};

const emptyCounts: DashboardCounts = {
  total: 0,
  PENDING: 0,
  IN_PROGRESS: 0,
  DONE: 0,
  OVERDUE: 0,
};

const priorityLabels: Record<Priority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
};

const statusLabels: Record<TaskStatus, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluída",
};

const historyLabels: Record<HistoryType, string> = {
  CREATED: "Criação",
  UPDATED: "Atualização",
  STATUS_CHANGED: "Mudança de status",
  DELETED: "Exclusão",
};

const initialForm = {
  title: "",
  responsible: "",
  description: "",
  dueDate: "",
  priority: "MEDIUM" as Priority,
  status: "PENDING" as TaskStatus,
};

const TASKS_PER_PAGE = 4;

type DashboardClientProps = {
  user: User;
};

export function DashboardClient({ user }: DashboardClientProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dashboard, setDashboard] = useState<DashboardCounts>(emptyCounts);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [createForm, setCreateForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    priority: "",
    responsible: "",
    dueDate: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        params.set(key, value);
      }
    }

    return params.toString();
  }, [filters]);

  useEffect(() => {
    void loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(tasks.length / TASKS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * TASKS_PER_PAGE;
  const pageEnd = Math.min(pageStart + TASKS_PER_PAGE, tasks.length);
  const paginatedTasks = tasks.slice(pageStart, pageEnd);

  function updateFilters(nextFilters: typeof filters) {
    setCurrentPage(1);
    setFilters(nextFilters);
  }

  async function loadTasks() {
    setLoading(true);
    setError("");

    const response = await fetch(`/api/tasks${query ? `?${query}` : ""}`, {
      cache: "no-store",
    });

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setError(data.message ?? "Não foi possível carregar as tarefas.");
      return;
    }

    setTasks(data.tasks ?? []);
    setDashboard(data.dashboard ?? emptyCounts);
  }

  function resetCreateForm() {
    setCreateForm(initialForm);
  }

  function closeEditModal() {
    setEditingTask(null);
    setEditForm(initialForm);
    setError("");
  }

  function startEdit(task: Task) {
    setError("");
    setEditingTask(task);
    setEditForm({
      title: task.title,
      responsible: task.responsible,
      description: task.description ?? "",
      dueDate: toInputDate(task.dueDate),
      priority: task.priority,
      status: task.status,
    });
  }

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });

    const data = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setError(data.message ?? "Não foi possível salvar a tarefa.");
      return;
    }

    resetCreateForm();
    await loadTasks();
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingTask) {
      return;
    }

    setSaving(true);
    setError("");

    const response = await fetch(`/api/tasks/${editingTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });

    const data = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setError(data.message ?? "Não foi possível salvar a tarefa.");
      return;
    }

    closeEditModal();
    await loadTasks();
  }

  async function removeTask(task: Task) {
    setDeleting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.message ?? "Não foi possível excluir a tarefa.");
        return;
      }

      if (selectedTask?.id === task.id) {
        setSelectedTask(null);
      }

      setTaskToDelete(null);
      await loadTasks();
    } finally {
      setDeleting(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="topbar-title">
          <span className="auth-brand-mark">TD</span>
          <div>
            <p className="eyebrow">TaskDash</p>
            <h1>Gerenciamento de tarefas</h1>
          </div>
        </div>
        <div className="user-area">
          <span>{user.name}</span>
          <button className="icon-button" type="button" onClick={logout} title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <section className="metrics-grid" aria-label="Indicadores">
        <Metric
          icon={<ClipboardList size={20} />}
          label="Total"
          value={dashboard.total}
        />
        <Metric
          icon={<CircleDashed size={20} />}
          label="Pendentes"
          value={dashboard.PENDING}
          tone="warning"
        />
        <Metric
          icon={<TimerReset size={20} />}
          label="Em andamento"
          value={dashboard.IN_PROGRESS}
          tone="info"
        />
        <Metric
          icon={<TrendingUp size={20} />}
          label="Concluídas"
          value={dashboard.DONE}
          tone="success"
        />
        <Metric
          icon={<AlertTriangle size={20} />}
          label="Atrasadas"
          value={dashboard.OVERDUE}
          tone="danger"
        />
      </section>

      <section className="workspace">
        <aside className="task-form-panel">
          <div className="section-heading">
            <h2>Nova tarefa</h2>
          </div>

          <form className="stack" onSubmit={handleCreateSubmit}>
            <label>
              Título
              <input
                value={createForm.title}
                onChange={(event) =>
                  setCreateForm({ ...createForm, title: event.target.value })
                }
                required
              />
            </label>

            <label>
              Responsável
              <input
                value={createForm.responsible}
                onChange={(event) =>
                  setCreateForm({ ...createForm, responsible: event.target.value })
                }
                required
              />
            </label>

            <label>
              Descrição
              <textarea
                value={createForm.description}
                rows={4}
                onChange={(event) =>
                  setCreateForm({ ...createForm, description: event.target.value })
                }
              />
            </label>

            <label>
              Data de vencimento
              <input
                type="date"
                value={createForm.dueDate}
                onChange={(event) =>
                  setCreateForm({ ...createForm, dueDate: event.target.value })
                }
                required
              />
            </label>

            <div className="field-grid">
              <label>
                Prioridade
                <select
                  value={createForm.priority}
                  onChange={(event) =>
                    setCreateForm({
                      ...createForm,
                      priority: event.target.value as Priority,
                    })
                  }
                >
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Status
                <select
                  value={createForm.status}
                  onChange={(event) =>
                    setCreateForm({
                      ...createForm,
                      status: event.target.value as TaskStatus,
                    })
                  }
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {error ? <p className="form-error">{error}</p> : null}

            <button className="primary-button" type="submit" disabled={saving}>
              <Plus size={18} />
              {saving ? "Salvando..." : "Criar tarefa"}
            </button>
          </form>
        </aside>

        <section className="task-list-panel">
          <div className="section-heading">
            <h2>Tarefas</h2>
            <span className="result-count">{tasks.length} resultado(s)</span>
          </div>

          <div className="filters" aria-label="Filtros de tarefas">
            <label className="search-field">
              <Search size={17} />
              <input
                value={filters.q}
                placeholder="Pesquisar por título ou descrição"
                onChange={(event) =>
                  updateFilters({ ...filters, q: event.target.value })
                }
              />
            </label>

            <label className="search-field">
              <UserRound size={17} />
              <input
                value={filters.responsible}
                placeholder="Responsável"
                onChange={(event) =>
                  updateFilters({ ...filters, responsible: event.target.value })
                }
              />
            </label>

            <label>
              <Filter size={16} />
              <select
                value={filters.status}
                onChange={(event) =>
                  updateFilters({ ...filters, status: event.target.value })
                }
              >
                <option value="">Status</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <Filter size={16} />
              <select
                value={filters.priority}
                onChange={(event) =>
                  updateFilters({ ...filters, priority: event.target.value })
                }
              >
                <option value="">Prioridade</option>
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <input
              aria-label="Filtrar por data de vencimento"
              type="date"
              value={filters.dueDate}
              onChange={(event) =>
                updateFilters({ ...filters, dueDate: event.target.value })
              }
            />
          </div>

          {loading ? (
            <div className="empty-state">Carregando tarefas...</div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">Nenhuma tarefa encontrada.</div>
          ) : (
            <div className="task-table">
              <div className="task-row task-row-head">
                <span>Título</span>
                <span>Responsável</span>
                <span>Status</span>
                <span>Prioridade</span>
                <span>Vencimento</span>
                <span>Ações</span>
              </div>
              {paginatedTasks.map((task) => (
                <article className="task-row" key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <p>{task.description || "Sem descrição"}</p>
                  </div>
                  <span className="responsible-cell">{task.responsible}</span>
                  <span className={`pill status-${task.status.toLowerCase()}`}>
                    {statusLabels[task.status]}
                  </span>
                  <span className={`pill priority-${task.priority.toLowerCase()}`}>
                    {priorityLabels[task.priority]}
                  </span>
                  <span>{formatDate(task.dueDate)}</span>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => setSelectedTask(task)}
                      title="Ver detalhes"
                    >
                      <Eye size={17} />
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => startEdit(task)}
                      title="Editar"
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      className="icon-button danger"
                      type="button"
                      onClick={() => setTaskToDelete(task)}
                      title="Excluir"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {tasks.length > TASKS_PER_PAGE ? (
            <nav className="pagination" aria-label="Paginação de tarefas">
              <span>
                Exibindo {pageStart + 1}-{pageEnd} de {tasks.length}
              </span>
              <div className="pagination-actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={safeCurrentPage === 1}
                >
                  <ChevronLeft size={16} />
                  Anterior
                </button>
                <strong>
                  {safeCurrentPage} / {totalPages}
                </strong>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={safeCurrentPage === totalPages}
                >
                  Próxima
                  <ChevronRight size={16} />
                </button>
              </div>
            </nav>
          ) : null}
        </section>
      </section>

      {selectedTask ? (
        <div className="modal-backdrop" role="presentation">
          <section className="task-modal" role="dialog" aria-modal="true">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Detalhes</p>
                <h2>{selectedTask.title}</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setSelectedTask(null)}
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="detail-grid">
              <Detail label="Status" value={statusLabels[selectedTask.status]} />
              <Detail label="Responsável" value={selectedTask.responsible} />
              <Detail
                label="Prioridade"
                value={priorityLabels[selectedTask.priority]}
              />
              <Detail label="Vencimento" value={formatDate(selectedTask.dueDate)} />
              <Detail label="Criada em" value={formatDateTime(selectedTask.createdAt)} />
            </div>

            <p className="description-block">
              {selectedTask.description || "Sem descrição informada."}
            </p>

            <h3>Histórico</h3>
            <div className="history-list">
              {selectedTask.histories.map((history) => (
                <div className="history-item" key={history.id}>
                  <CheckCircle2 size={16} />
                  <div>
                    <strong>{historyLabels[history.changeType]}</strong>
                    <p>{history.description}</p>
                    <span>
                      {formatDateTime(history.createdAt)} por {history.user.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {editingTask ? (
        <div className="modal-backdrop" role="presentation">
          <section
            className="task-modal edit-task-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-task-title"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">Editar</p>
                <h2 id="edit-task-title">Editar tarefa</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={closeEditModal}
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <form className="stack" onSubmit={handleEditSubmit}>
              <label>
                Título
                <input
                  value={editForm.title}
                  onChange={(event) =>
                    setEditForm({ ...editForm, title: event.target.value })
                  }
                  required
                />
              </label>

              <label>
                Responsável
                <input
                  value={editForm.responsible}
                  onChange={(event) =>
                    setEditForm({ ...editForm, responsible: event.target.value })
                  }
                  required
                />
              </label>

              <label>
                Descrição
                <textarea
                  value={editForm.description}
                  rows={4}
                  onChange={(event) =>
                    setEditForm({ ...editForm, description: event.target.value })
                  }
                />
              </label>

              <label>
                Data de vencimento
                <input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(event) =>
                    setEditForm({ ...editForm, dueDate: event.target.value })
                  }
                  required
                />
              </label>

              <div className="field-grid">
                <label>
                  Prioridade
                  <select
                    value={editForm.priority}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        priority: event.target.value as Priority,
                      })
                    }
                  >
                    {Object.entries(priorityLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Status
                  <select
                    value={editForm.status}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        status: event.target.value as TaskStatus,
                      })
                    }
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {error ? <p className="form-error">{error}</p> : null}

              <div className="modal-form-actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={closeEditModal}
                >
                  Cancelar
                </button>
                <button className="primary-button" type="submit" disabled={saving}>
                  <Save size={18} />
                  {saving ? "Salvando..." : "Salvar tarefa"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {taskToDelete ? (
        <div className="modal-backdrop" role="presentation">
          <section
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-task-title"
          >
            <div className="confirm-icon">
              <Trash2 size={22} />
            </div>
            <div>
              <p className="eyebrow">Confirmar exclusão</p>
              <h2 id="delete-task-title">Excluir esta tarefa?</h2>
              <p className="confirm-text">
                A tarefa <strong>{taskToDelete.title}</strong> será removida das
                consultas e do dashboard.
              </p>
            </div>
            <div className="confirm-actions">
              <button
                className="ghost-button"
                type="button"
                onClick={() => setTaskToDelete(null)}
              >
                Cancelar
              </button>
              <button
                className="danger-button"
                type="button"
                disabled={deleting}
                onClick={() => void removeTask(taskToDelete)}
              >
                <Trash2 size={17} />
                {deleting ? "Excluindo..." : "Excluir tarefa"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone?: "neutral" | "warning" | "info" | "success" | "danger";
}) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <span className="metric-icon">{icon}</span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function toInputDate(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
