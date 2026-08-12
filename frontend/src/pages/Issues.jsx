import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";
import { useNavigate } from "react-router-dom";

function Issues() {
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    project: "",
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    assignee: "",
    due_date: "",
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);

      const data = await apiRequest("/projects/");

      const results = Array.isArray(data)
        ? data
        : data.results || [];

      setProjects(results);
    } catch (error) {
      setFormError(
        `Unable to load projects: ${error.message}`
      );
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError("");

      const projectsData = await apiRequest("/projects/");

      const projectResults = Array.isArray(projectsData)
        ? projectsData
        : projectsData.results || [];

      const issueResponses = await Promise.all(
        projectResults.map((project) =>
          apiRequest(
            `/projects/${project.id}/issues/`
          )
        )
      );

      const allIssues = issueResponses.flatMap(
        (data) =>
          Array.isArray(data)
            ? data
            : data.results || []
      );

      allIssues.sort(
        (a, b) =>
          new Date(b.created_at) -
          new Date(a.created_at)
      );

      setIssues(allIssues);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
    fetchProjects();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCreateIssue = async (event) => {
    event.preventDefault();

    setFormError("");

    if (!formData.project) {
      setFormError("Please select a project.");
      return;
    }

    if (!formData.title.trim()) {
      setFormError("Issue title is required.");
      return;
    }

    try {
      setCreating(true);

      const body = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
      };

      if (formData.assignee.trim()) {
        body.assignee = Number(formData.assignee);
      }

      if (formData.due_date) {
        body.due_date = new Date(
          formData.due_date
        ).toISOString();
      }

      const createdIssue = await apiRequest(
        `/projects/${formData.project}/issues/`,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );

      setIssues((current) => [
        createdIssue,
        ...current,
      ]);

      setFormData({
        project: "",
        title: "",
        description: "",
        status: "TODO",
        priority: "MEDIUM",
        assignee: "",
        due_date: "",
      });

      setShowCreateForm(false);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setCreating(false);
    }
  };

  const totalIssues = issues.length;

  const completedIssues = useMemo(
    () =>
      issues.filter(
        (issue) => issue.status === "DONE"
      ).length,
    [issues]
  );

  const openIssues = useMemo(
    () =>
      issues.filter(
        (issue) =>
          issue.status !== "DONE" &&
          issue.status !== "CANCELLED"
      ).length,
    [issues]
  );
  const filteredIssues = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return issues.filter((issue) => {
      const matchesSearch =
        !searchValue ||
        issue.title?.toLowerCase().includes(searchValue) ||
        issue.description?.toLowerCase().includes(searchValue) ||
        issue.project_name?.toLowerCase().includes(searchValue) ||
        issue.assignee_username?.toLowerCase().includes(searchValue);

      const matchesStatus =
        !statusFilter ||
        issue.status === statusFilter;

      const matchesPriority =
        !priorityFilter ||
        issue.priority === priorityFilter;

      const matchesProject =
        !projectFilter ||
        String(issue.project) === String(projectFilter);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesProject
      );
    });
  }, [
    issues,
    search,
    statusFilter,
    priorityFilter,
    projectFilter,
  ]);

  const getStatusStyle = (status) => {
    switch (status) {
      case "TODO":
        return "bg-zinc-500/10 text-zinc-400";

      case "IN_PROGRESS":
        return "bg-blue-500/10 text-blue-400";

      case "DONE":
        return "bg-emerald-500/10 text-emerald-400";

      case "BLOCKED":
        return "bg-red-500/10 text-red-400";

      case "CANCELLED":
        return "bg-zinc-500/10 text-zinc-500";

      default:
        return "bg-zinc-500/10 text-zinc-400";
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "CRITICAL":
        return "text-red-400";

      case "HIGH":
        return "text-orange-400";

      case "MEDIUM":
        return "text-yellow-400";

      case "LOW":
        return "text-emerald-400";

      default:
        return "text-zinc-500";
    }
  };

  const formatStatus = (status) => {
    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const formatPriority = (priority) => {
    return priority
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  return (
    <div className="min-h-full bg-[#0a0a0f] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-violet-400">
              WORKSPACE
            </p>

            <h1 className="text-3xl font-semibold tracking-tight">
              Issues
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Track and manage issues across your projects.
            </p>
          </div>

          <button
            onClick={() => {
              setShowCreateForm(true);
              setFormError("");
            }}
            className="rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-400"
          >
            + New Issue
          </button>
        </div>

        {/* Create Issue */}
        {showCreateForm && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">

            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold">
                  Create Issue
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Create an issue inside one of your projects.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormError("");
                }}
                className="text-zinc-500 transition hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                <p className="text-sm text-red-400">
                  {formError}
                </p>
              </div>
            )}

            <form
              onSubmit={handleCreateIssue}
              className="space-y-5"
            >

              {/* Project */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Project
                </label>

                <select
                  name="project"
                  value={formData.project}
                  onChange={handleChange}
                  disabled={loadingProjects}
                  className="w-full rounded-lg border border-white/10 bg-[#111118] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50 disabled:opacity-50"
                >
                  <option value="">
                    {loadingProjects
                      ? "Loading projects..."
                      : "Select a project"}
                  </option>

                  {projects.map((project) => (
                    <option
                      key={project.id}
                      value={project.id}
                    >
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Fix authentication issue"
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-violet-500/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe the issue..."
                  className="w-full resize-none rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-violet-500/50"
                />
              </div>

              {/* Status + Priority */}
              <div className="grid gap-5 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/10 bg-[#111118] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50"
                  >
                    <option value="TODO">
                      To Do
                    </option>

                    <option value="IN_PROGRESS">
                      In Progress
                    </option>

                    <option value="BLOCKED">
                      Blocked
                    </option>

                    <option value="DONE">
                      Done
                    </option>

                    <option value="CANCELLED">
                      Cancelled
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Priority
                  </label>

                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/10 bg-[#111118] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50"
                  >
                    <option value="LOW">
                      Low
                    </option>

                    <option value="MEDIUM">
                      Medium
                    </option>

                    <option value="HIGH">
                      High
                    </option>

                    <option value="CRITICAL">
                      Critical
                    </option>
                  </select>
                </div>

              </div>

              {/* Assignee + Due date */}
              <div className="grid gap-5 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Assignee
                    <span className="ml-2 text-xs font-normal text-zinc-600">
                      Optional
                    </span>
                  </label>

                  <input
                    type="number"
                    min="1"
                    name="assignee"
                    value={formData.assignee}
                    onChange={handleChange}
                    placeholder="User ID"
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-violet-500/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Due Date
                    <span className="ml-2 text-xs font-normal text-zinc-600">
                      Optional
                    </span>
                  </label>

                  <input
                    type="datetime-local"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300 outline-none focus:border-violet-500/50"
                  />
                </div>

              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-white/5 pt-5">

                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormError("");
                  }}
                  className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    creating || loadingProjects
                  }
                  className="rounded-lg bg-violet-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating
                    ? "Creating..."
                    : "Create Issue"}
                </button>

              </div>
            </form>
          </div>
        )}

        {/* Statistics */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-zinc-400">
              Total Issues
            </p>

            <p className="mt-3 text-3xl font-semibold">
              {loading ? "..." : totalIssues}
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              All project issues
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-zinc-400">
              Open Issues
            </p>

            <p className="mt-3 text-3xl font-semibold text-blue-400">
              {loading ? "..." : openIssues}
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Issues requiring attention
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-zinc-400">
              Completed
            </p>

            <p className="mt-3 text-3xl font-semibold text-emerald-400">
              {loading ? "..." : completedIssues}
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Successfully completed
            </p>
          </div>

        </div>

        {/* Search & Filters */}
        {!loading && !error && issues.length > 0 && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">

              {/* Search */}
              <div className="lg:col-span-2">
                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search issues..."
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-500/50"
                />
              </div>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="rounded-lg border border-white/10 bg-[#111118] px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-violet-500/50"
              >
                <option value="">All Statuses</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">
                  In Progress
                </option>
                <option value="BLOCKED">Blocked</option>
                <option value="DONE">Done</option>
                <option value="CANCELLED">
                  Cancelled
                </option>
              </select>

              {/* Priority */}
              <select
                value={priorityFilter}
                onChange={(event) =>
                  setPriorityFilter(event.target.value)
                }
                className="rounded-lg border border-white/10 bg-[#111118] px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-violet-500/50"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>

            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">

              {/* Project */}
              <select
                value={projectFilter}
                onChange={(event) =>
                  setProjectFilter(event.target.value)
                }
                className="rounded-lg border border-white/10 bg-[#111118] px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-violet-500/50"
              >
                <option value="">All Projects</option>

                {projects.map((project) => (
                  <option
                    key={project.id}
                    value={project.id}
                  >
                    {project.name}
                  </option>
                ))}
              </select>

              {/* Result count + clear */}
              <div className="flex items-center gap-4">

                <span className="text-xs text-zinc-600">
                  Showing {filteredIssues.length} of{" "}
                  {issues.length} issues
                </span>

                {(search ||
                  statusFilter ||
                  priorityFilter ||
                  projectFilter) && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("");
                      setPriorityFilter("");
                      setProjectFilter("");
                    }}
                    className="text-xs font-medium text-violet-400 transition hover:text-violet-300"
                  >
                    Clear filters
                  </button>
                )}

              </div>

            </div>
          </div>
        )}

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
              Loading issues...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          issues.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                I
              </div>

              <h2 className="mt-4 text-base font-semibold">
                No issues yet
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Issues from your projects will appear here.
              </p>
            </div>
          )}
        
        {/* No Filter Results */}
        {!loading &&
          !error &&
          issues.length > 0 &&
          filteredIssues.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                🔎
              </div>

              <h2 className="mt-4 text-base font-semibold">
                No matching issues
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Try changing your search or filters.
              </p>

              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                  setPriorityFilter("");
                  setProjectFilter("");
                }}
                className="mt-5 text-sm font-medium text-violet-400 transition hover:text-violet-300"
              >
                Clear filters
              </button>

            </div>
        )}

        {/* Issue List */}
        {!loading &&
          !error &&
          issues.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">

              <div className="hidden grid-cols-12 gap-4 border-b border-white/10 px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-600 md:grid">

                <div className="col-span-4">
                  Issue
                </div>

                <div className="col-span-2">
                  Project
                </div>

                <div className="col-span-2">
                  Status
                </div>

                <div className="col-span-2">
                  Priority
                </div>

                <div className="col-span-2">
                  Assignee
                </div>

              </div>

              <div className="divide-y divide-white/5">
                {filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() =>
                        navigate(
                        `/projects/${issue.project}/issues/${issue.id}`
                        )
                    }
                    className="grid cursor-pointer gap-3 px-5 py-4 transition hover:bg-white/[0.04] md:grid-cols-12 md:items-center md:gap-4"
                  >

                    <div className="md:col-span-4">
                      <p className="text-sm font-medium text-zinc-200">
                        {issue.title}
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        #{issue.id}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-xs text-zinc-400">
                        {issue.project_name}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusStyle(
                          issue.status
                        )}`}
                      >
                        {formatStatus(issue.status)}
                      </span>
                    </div>

                    <div className="md:col-span-2">
                      <span
                        className={`text-xs font-medium ${getPriorityStyle(
                          issue.priority
                        )}`}
                      >
                        {formatPriority(
                          issue.priority
                        )}
                      </span>
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-xs text-zinc-400">
                        {issue.assignee_username ||
                          "Unassigned"}
                      </p>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

      </div>
    </div>
  );
}

export default Issues;