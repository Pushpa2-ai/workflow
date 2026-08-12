import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";

function IssueDetails() {
  const { projectId, issueId } = useParams();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    due_date: "",
  });

  const fetchIssue = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest(
        `/projects/${projectId}/issues/${issueId}/`
      );

      setIssue(data);

      setFormData({
        title: data.title || "",
        description: data.description || "",
        status: data.status || "TODO",
        priority: data.priority || "MEDIUM",
        due_date: data.due_date
          ? data.due_date.slice(0, 16)
          : "",
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [projectId, issueId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const body = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date
          ? new Date(
              formData.due_date
            ).toISOString()
          : null,
      };

      const updatedIssue = await apiRequest(
        `/projects/${projectId}/issues/${issueId}/`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        }
      );

      setIssue(updatedIssue);
      setEditing(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this issue?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await apiRequest(
        `/projects/${projectId}/issues/${issueId}/`,
        {
          method: "DELETE",
        }
      );

      navigate("/issues", { replace: true });
    } catch (error) {
      setError(error.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-[#0a0a0f] px-6 py-8 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center">
            <p className="text-sm text-zinc-500">
              Loading issue...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="min-h-full bg-[#0a0a0f] px-6 py-8 text-white">
        <div className="mx-auto max-w-5xl">
          <button
            onClick={() => navigate("/issues")}
            className="mb-6 text-sm text-violet-400 transition hover:text-violet-300"
          >
            ← Back to Issues
          </button>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center">
            <p className="text-sm text-red-400">
              {error || "Issue not found."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#0a0a0f] px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">

        {/* Back */}
        <button
          onClick={() => navigate("/issues")}
          className="mb-6 text-sm text-zinc-500 transition hover:text-violet-400"
        >
          ← Back to Issues
        </button>

        {/* Header */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-violet-400">
                Issue #{issue.id}
              </p>

              {!editing && (
                <h1 className="mt-2 text-2xl font-semibold text-zinc-100">
                  {issue.title}
                </h1>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditing(!editing)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
              >
                {editing ? "Cancel" : "Edit"}
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/15 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>

          {/* Edit Form */}
          {editing ? (
            <form
              onSubmit={handleSave}
              className="mt-6 space-y-5 border-t border-white/5 pt-6"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Title
                </label>

                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  className="w-full resize-none rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50"
                />
              </div>

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
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">
                      In Progress
                    </option>
                    <option value="DONE">Done</option>
                    <option value="BLOCKED">Blocked</option>
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
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">
                      Critical
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Due Date
                </label>

                <input
                  type="datetime-local"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300 outline-none focus:border-violet-500/50"
                />
              </div>

              <div className="flex justify-end border-t border-white/5 pt-5">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-violet-500 px-5 py-2.5 text-sm font-medium transition hover:bg-violet-400 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Description */}
              <div className="mt-6 border-t border-white/5 pt-6">
                <p className="text-xs uppercase tracking-wider text-zinc-600">
                  Description
                </p>

                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {issue.description ||
                    "No description provided."}
                </p>
              </div>

              {/* Metadata */}
              <div className="mt-6 grid gap-5 border-t border-white/5 pt-6 sm:grid-cols-2 lg:grid-cols-4">

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Project
                  </p>

                  <p className="mt-2 text-sm text-zinc-300">
                    {issue.project_name}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Status
                  </p>

                  <p className="mt-2 text-sm text-zinc-300">
                    {issue.status
                      ?.replaceAll("_", " ")}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Priority
                  </p>

                  <p className="mt-2 text-sm text-zinc-300">
                    {issue.priority}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Assignee
                  </p>

                  <p className="mt-2 text-sm text-zinc-300">
                    {issue.assignee_username ||
                      "Unassigned"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Created By
                  </p>

                  <p className="mt-2 text-sm text-zinc-300">
                    {issue.created_by}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Due Date
                  </p>

                  <p className="mt-2 text-sm text-zinc-300">
                    {issue.due_date
                      ? new Date(
                          issue.due_date
                        ).toLocaleString()
                      : "No due date"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Created
                  </p>

                  <p className="mt-2 text-sm text-zinc-300">
                    {new Date(
                      issue.created_at
                    ).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Updated
                  </p>

                  <p className="mt-2 text-sm text-zinc-300">
                    {new Date(
                      issue.updated_at
                    ).toLocaleString()}
                  </p>
                </div>

              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default IssueDetails;