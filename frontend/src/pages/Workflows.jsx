import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

function Workflows() {
  const navigate = useNavigate();

  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [sort, setSort] = useState("-created_at");

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "DRAFT",
    priority: "MEDIUM",
    assigned_to: "",
    due_date: "",
  });

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (status) {
        params.append("status", status);
      }

      if (priority) {
        params.append("priority", priority);
      }

      if (sort) {
        params.append("sort", sort);
      }

      const query = params.toString();

      const data = await apiRequest(
        `/workflows/${query ? `?${query}` : ""}`
      );

      const results = Array.isArray(data)
        ? data
        : data.results || [];

      setWorkflows(results);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWorkflows();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, status, priority, sort]);

  const handleCreateChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    setCreateError("");

    if (!formData.name.trim()) {
      setCreateError("Workflow name is required.");
      return;
    }

    try {
      setCreating(true);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
      };

      if (formData.assigned_to.trim()) {
        payload.assigned_to = Number(
          formData.assigned_to
        );
      }

      if (formData.due_date) {
        payload.due_date = new Date(
          formData.due_date
        ).toISOString();
      }

      const workflow = await apiRequest(
        "/workflows/create/",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      setShowCreate(false);

      setFormData({
        name: "",
        description: "",
        status: "DRAFT",
        priority: "MEDIUM",
        assigned_to: "",
        due_date: "",
      });

      navigate(`/workflows/${workflow.id}`);
    } catch (error) {
      setCreateError(error.message);
    } finally {
      setCreating(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setSort("-created_at");
  };

  const stats = useMemo(() => {
    return {
      total: workflows.length,
      active: workflows.filter(
        (workflow) => workflow.status === "ACTIVE"
      ).length,
      completed: workflows.filter(
        (workflow) => workflow.status === "COMPLETED"
      ).length,
      overdue: workflows.filter(
        (workflow) => workflow.is_overdue
      ).length,
    };
  }, [workflows]);

  const getStatusStyle = (workflowStatus) => {
    switch (workflowStatus) {
      case "DRAFT":
        return "bg-zinc-500/10 text-zinc-400";

      case "ACTIVE":
        return "bg-violet-500/10 text-violet-400";

      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-400";

      case "ARCHIVED":
        return "bg-zinc-600/10 text-zinc-500";

      default:
        return "bg-zinc-500/10 text-zinc-400";
    }
  };

  const getPriorityStyle = (workflowPriority) => {
    switch (workflowPriority) {
      case "CRITICAL":
        return "text-red-400";

      case "HIGH":
        return "text-orange-400";

      case "MEDIUM":
        return "text-yellow-400";

      case "LOW":
        return "text-emerald-400";

      default:
        return "text-zinc-400";
    }
  };

  const formatStatus = (value) => {
    return value
      ?.replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  return (
    <div className="min-h-full bg-[#0a0a0f] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-sm font-medium text-violet-400">
              WORKSPACE
            </p>

            <h1 className="text-3xl font-semibold tracking-tight">
              Workflows
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Manage and track your workflow tasks.
            </p>
          </div>

          <button
            onClick={() => {
              setShowCreate(true);
              setCreateError("");
            }}
            className="rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-medium transition hover:bg-violet-400"
          >
            + New Workflow
          </button>
        </div>

        {/* Statistics */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-zinc-500">
              Total Workflows
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-zinc-500">
              Active
            </p>
            <p className="mt-2 text-3xl font-semibold text-violet-400">
              {stats.active}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-zinc-500">
              Completed
            </p>
            <p className="mt-2 text-3xl font-semibold text-emerald-400">
              {stats.completed}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-zinc-500">
              Overdue
            </p>
            <p className="mt-2 text-3xl font-semibold text-red-400">
              {stats.overdue}
            </p>
          </div>

        </div>

        {/* Search / Filters */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search workflows..."
              className="rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-500/50 lg:col-span-2"
            />

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className="rounded-lg border border-white/10 bg-[#111118] px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-violet-500/50"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">
                Completed
              </option>
              <option value="ARCHIVED">
                Archived
              </option>
            </select>

            <select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value)
              }
              className="rounded-lg border border-white/10 bg-[#111118] px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-violet-500/50"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">
                Critical
              </option>
            </select>

          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">

            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value)
              }
              className="rounded-lg border border-white/10 bg-[#111118] px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-violet-500/50"
            >
              <option value="-created_at">
                Newest first
              </option>
              <option value="created_at">
                Oldest first
              </option>
              <option value="name">
                Name A-Z
              </option>
              <option value="-name">
                Name Z-A
              </option>
              <option value="due_date">
                Due date
              </option>
              <option value="-due_date">
                Due date descending
              </option>
            </select>

            {(search || status || priority) && (
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-violet-400 transition hover:text-violet-300"
              >
                Clear filters
              </button>
            )}

          </div>
        </div>

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center">
            <p className="text-sm text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center">
            <p className="text-sm text-zinc-500">
              Loading workflows...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          workflows.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                W
              </div>

              <h2 className="mt-4 text-base font-semibold">
                No workflows found
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Create your first workflow to get started.
              </p>

            </div>
          )}

        {/* Workflow list */}
        {!loading &&
          !error &&
          workflows.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">

              <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 border-b border-white/10 px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 md:grid">
                <span>Workflow</span>
                <span>Status</span>
                <span>Priority</span>
                <span>Assigned</span>
                <span>Due</span>
              </div>

              <div className="divide-y divide-white/5">

                {workflows.map((workflow) => (
                  <button
                    key={workflow.id}
                    onClick={() =>
                      navigate(
                        `/workflows/${workflow.id}`
                      )
                    }
                    className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-white/[0.03] md:grid-cols-[2fr_1fr_1fr_1fr_1fr] md:items-center md:gap-4"
                  >

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-200">
                        {workflow.name}
                      </p>

                      <p className="mt-1 truncate text-xs text-zinc-600">
                        {workflow.description ||
                          "No description"}
                      </p>
                    </div>

                    <div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${getStatusStyle(
                          workflow.status
                        )}`}
                      >
                        {formatStatus(
                          workflow.status
                        )}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-medium ${getPriorityStyle(
                        workflow.priority
                      )}`}
                    >
                      {formatStatus(
                        workflow.priority
                      )}
                    </span>

                    <span className="text-xs text-zinc-400">
                      {workflow.assigned_to ||
                        "Unassigned"}
                    </span>

                    <div>
                      {workflow.due_date ? (
                        <span
                          className={`text-xs ${
                            workflow.is_overdue
                              ? "text-red-400"
                              : "text-zinc-500"
                          }`}
                        >
                          {new Date(
                            workflow.due_date
                          ).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-700">
                          No due date
                        </span>
                      )}
                    </div>

                  </button>
                ))}

              </div>
            </div>
          )}

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">

            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111118] p-6 shadow-2xl">

              <div className="mb-6">
                <p className="text-xs uppercase tracking-wider text-violet-400">
                  New Workflow
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Create workflow
                </h2>
              </div>

              {createError && (
                <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                  <p className="text-sm text-red-400">
                    {createError}
                  </p>
                </div>
              )}

              <form
                onSubmit={handleCreate}
                className="space-y-4"
              >

                <input
                  name="name"
                  value={formData.name}
                  onChange={handleCreateChange}
                  placeholder="Workflow name"
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-500/50"
                />

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleCreateChange}
                  rows={3}
                  placeholder="Description"
                  className="w-full resize-none rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-500/50"
                />

                <div className="grid gap-4 sm:grid-cols-2">

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleCreateChange}
                    className="rounded-lg border border-white/10 bg-[#111118] px-4 py-3 text-sm text-zinc-300 outline-none focus:border-violet-500/50"
                  >
                    <option value="DRAFT">
                      Draft
                    </option>
                    <option value="ACTIVE">
                      Active
                    </option>
                  </select>

                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleCreateChange}
                    className="rounded-lg border border-white/10 bg-[#111118] px-4 py-3 text-sm text-zinc-300 outline-none focus:border-violet-500/50"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">
                      Medium
                    </option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">
                      Critical
                    </option>
                  </select>

                </div>

                <input
                  type="number"
                  min="1"
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleCreateChange}
                  placeholder="Assigned user ID (optional)"
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-500/50"
                />

                <div>
                  <label className="mb-2 block text-xs text-zinc-500">
                    Due date
                  </label>

                  <input
                    type="datetime-local"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleCreateChange}
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300 outline-none focus:border-violet-500/50"
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-white/5 pt-5">

                  <button
                    type="button"
                    onClick={() =>
                      setShowCreate(false)
                    }
                    className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-lg bg-violet-500 px-5 py-2.5 text-sm font-medium transition hover:bg-violet-400 disabled:opacity-50"
                  >
                    {creating
                      ? "Creating..."
                      : "Create Workflow"}
                  </button>

                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Workflows;