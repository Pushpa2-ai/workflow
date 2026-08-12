import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";

function WorkflowDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [workflow, setWorkflow] = useState(null);
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [comment, setComment] = useState("");
  const [commenting, setCommenting] = useState(false);

  const [memberUserId, setMemberUserId] =
    useState("");
  const [addingMember, setAddingMember] =
    useState(false);

  const [removingMember, setRemovingMember] =
    useState(null);

  const [deleting, setDeleting] = useState(false);

  const [attachmentForm, setAttachmentForm] =
    useState({
      file_name: "",
      file_url: "",
      file_size: "",
      content_type: "",
    });

  const [addingAttachment, setAddingAttachment] =
    useState(false);

  const [editData, setEditData] = useState({
    name: "",
    description: "",
    status: "DRAFT",
    priority: "MEDIUM",
    assigned_to: "",
    due_date: "",
  });

  const fetchWorkflow = async () => {
    const data = await apiRequest(
      `/workflows/${id}/`
    );

    setWorkflow(data);

    setEditData({
      name: data.name || "",
      description: data.description || "",
      status: data.status || "DRAFT",
      priority: data.priority || "MEDIUM",
      assigned_to: data.assigned_to || "",
      due_date: data.due_date
        ? data.due_date.slice(0, 16)
        : "",
    });
  };

  const fetchMembers = async () => {
    const data = await apiRequest(
      `/workflows/${id}/members/`
    );

    setMembers(
      Array.isArray(data)
        ? data
        : data.results || []
    );
  };

  const fetchActivities = async () => {
    const data = await apiRequest(
      `/workflows/${id}/activities/`
    );

    setActivities(
      Array.isArray(data)
        ? data
        : data.results || []
    );
  };

  const fetchComments = async () => {
    const data = await apiRequest(
      `/workflows/${id}/comments/`
    );

    setComments(
      Array.isArray(data)
        ? data
        : data.results || []
    );
  };

  const fetchAttachments = async () => {
    const data = await apiRequest(
      `/workflows/${id}/attachments/`
    );

    setAttachments(
      Array.isArray(data)
        ? data
        : data.results || []
    );
  };

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      setPageError("");

      await Promise.all([
        fetchWorkflow(),
        fetchMembers(),
        fetchActivities(),
        fetchComments(),
        fetchAttachments(),
      ]);
    } catch (error) {
      setPageError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflow();
  }, [id]);

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    setEditError("");

    if (!editData.name.trim()) {
      setEditError(
        "Workflow name is required."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: editData.name.trim(),
        description:
          editData.description.trim(),
        status: editData.status,
        priority: editData.priority,
        assigned_to:
          editData.assigned_to
            ? Number(editData.assigned_to)
            : null,
        due_date: editData.due_date
          ? new Date(
              editData.due_date
            ).toISOString()
          : null,
      };

      const updated = await apiRequest(
        `/workflows/${id}/`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      );

      setWorkflow(updated);
      setEditing(false);

      await fetchActivities();
    } catch (error) {
      setEditError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete "${workflow.name}"? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      await apiRequest(
        `/workflows/${id}/`,
        {
          method: "DELETE",
        }
      );

      navigate("/workflows", {
        replace: true,
      });
    } catch (error) {
      setPageError(error.message);
      setDeleting(false);
    }
  };

  const handleAddMember = async (event) => {
    event.preventDefault();

    if (!memberUserId.trim()) {
      return;
    }

    try {
      setAddingMember(true);

      const member = await apiRequest(
        `/workflows/${id}/members/add/`,
        {
          method: "POST",
          body: JSON.stringify({
            user: Number(memberUserId),
          }),
        }
      );

      setMembers((current) => [
        ...current,
        member,
      ]);

      setMemberUserId("");
      await fetchActivities();
    } catch (error) {
      setPageError(error.message);
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (
    memberId
  ) => {
    const confirmed = window.confirm(
      "Remove this member from the workflow?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingMember(memberId);

      await apiRequest(
        `/workflows/${id}/members/${memberId}/`,
        {
          method: "DELETE",
        }
      );

      setMembers((current) =>
        current.filter(
          (member) => member.id !== memberId
        )
      );

      await fetchActivities();
    } catch (error) {
      setPageError(error.message);
    } finally {
      setRemovingMember(null);
    }
  };

  const handleAddComment = async (event) => {
    event.preventDefault();

    if (!comment.trim()) {
      return;
    }

    try {
      setCommenting(true);

      const created = await apiRequest(
        `/workflows/${id}/comments/`,
        {
          method: "POST",
          body: JSON.stringify({
            content: comment.trim(),
          }),
        }
      );

      setComments((current) => [
        ...current,
        created,
      ]);

      setComment("");

      await fetchActivities();
    } catch (error) {
      setPageError(error.message);
    } finally {
      setCommenting(false);
    }
  };

  const handleDeleteComment = async (
    commentId
  ) => {
    const confirmed = window.confirm(
      "Delete this comment?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await apiRequest(
        `/workflows/${id}/comments/${commentId}/`,
        {
          method: "DELETE",
        }
      );

      setComments((current) =>
        current.filter(
          (item) => item.id !== commentId
        )
      );

      await fetchActivities();
    } catch (error) {
      setPageError(error.message);
    }
  };

  const handleAddAttachment = async (
    event
  ) => {
    event.preventDefault();

    if (!attachmentForm.file_name.trim()) {
      return;
    }

    try {
      setAddingAttachment(true);

      const created = await apiRequest(
        `/workflows/${id}/attachments/`,
        {
          method: "POST",
          body: JSON.stringify({
            file_name:
              attachmentForm.file_name.trim(),
            file_url:
              attachmentForm.file_url.trim(),
            file_size:
              attachmentForm.file_size
                ? Number(
                    attachmentForm.file_size
                  )
                : 0,
            content_type:
              attachmentForm.content_type.trim(),
          }),
        }
      );

      setAttachments((current) => [
        ...current,
        created,
      ]);

      setAttachmentForm({
        file_name: "",
        file_url: "",
        file_size: "",
        content_type: "",
      });

      await fetchActivities();
    } catch (error) {
      setPageError(error.message);
    } finally {
      setAddingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (
    attachmentId
  ) => {
    const confirmed = window.confirm(
      "Delete this attachment?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await apiRequest(
        `/workflows/${id}/attachments/${attachmentId}/`,
        {
          method: "DELETE",
        }
      );

      setAttachments((current) =>
        current.filter(
          (item) => item.id !== attachmentId
        )
      );

      await fetchActivities();
    } catch (error) {
      setPageError(error.message);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
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

  const formatValue = (value) => {
    return value
      ?.replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  if (loading) {
    return (
      <div className="min-h-full bg-[#0a0a0f] px-6 py-8 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center">
            <p className="text-sm text-zinc-500">
              Loading workflow...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (pageError || !workflow) {
    return (
      <div className="min-h-full bg-[#0a0a0f] px-6 py-8 text-white">
        <div className="mx-auto max-w-7xl">
          <button
            onClick={() =>
              navigate("/workflows")
            }
            className="mb-6 text-sm text-violet-400"
          >
            ← Back to Workflows
          </button>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center">
            <p className="text-sm text-red-400">
              {pageError ||
                "Workflow not found."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#0a0a0f] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">

        <button
          onClick={() =>
            navigate("/workflows")
          }
          className="mb-6 text-sm text-zinc-500 transition hover:text-violet-400"
        >
          ← Back to Workflows
        </button>

        {pageError && (
          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
            <p className="text-sm text-red-400">
              {pageError}
            </p>
          </div>
        )}

        {/* Workflow Header */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">

          {!editing ? (
            <>
              <div className="flex flex-col justify-between gap-5 md:flex-row">

                <div>
                  <p className="text-xs uppercase tracking-wider text-violet-400">
                    Workflow
                  </p>

                  <h1 className="mt-2 text-2xl font-semibold">
                    {workflow.name}
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">
                    {workflow.description ||
                      "No description provided."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${getStatusStyle(
                      workflow.status
                    )}`}
                  >
                    {formatValue(
                      workflow.status
                    )}
                  </span>

                  <button
                    onClick={() =>
                      setEditing(true)
                    }
                    className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.04] hover:text-white"
                  >
                    Edit
                  </button>

                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/15 disabled:opacity-50"
                  >
                    {deleting
                      ? "Deleting..."
                      : "Delete"}
                  </button>

                </div>
              </div>

              <div className="mt-6 grid gap-4 border-t border-white/5 pt-5 sm:grid-cols-4">

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Priority
                  </p>
                  <p className="mt-1 text-sm text-zinc-300">
                    {formatValue(
                      workflow.priority
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Assigned To
                  </p>
                  <p className="mt-1 text-sm text-zinc-300">
                    {workflow.assigned_to ||
                      "Unassigned"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Owner
                  </p>
                  <p className="mt-1 text-sm text-zinc-300">
                    {workflow.owner}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Due Date
                  </p>
                  <p
                    className={`mt-1 text-sm ${
                      workflow.is_overdue
                        ? "text-red-400"
                        : "text-zinc-300"
                    }`}
                  >
                    {workflow.due_date
                      ? new Date(
                          workflow.due_date
                        ).toLocaleString()
                      : "No due date"}
                  </p>
                </div>

              </div>
            </>
          ) : (
            <form onSubmit={handleSave}>

              <h2 className="text-xl font-semibold">
                Edit Workflow
              </h2>

              {editError && (
                <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                  <p className="text-sm text-red-400">
                    {editError}
                  </p>
                </div>
              )}

              <div className="mt-5 space-y-4">

                <input
                  name="name"
                  value={editData.name}
                  onChange={handleEditChange}
                  placeholder="Workflow name"
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50"
                />

                <textarea
                  name="description"
                  value={editData.description}
                  onChange={handleEditChange}
                  rows={3}
                  placeholder="Description"
                  className="w-full resize-none rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50"
                />

                <div className="grid gap-4 sm:grid-cols-2">

                  <select
                    name="status"
                    value={editData.status}
                    onChange={handleEditChange}
                    className="rounded-lg border border-white/10 bg-[#111118] px-4 py-3 text-sm text-zinc-300"
                  >
                    <option value="DRAFT">
                      Draft
                    </option>
                    <option value="ACTIVE">
                      Active
                    </option>
                    <option value="COMPLETED">
                      Completed
                    </option>
                    <option value="ARCHIVED">
                      Archived
                    </option>
                  </select>

                  <select
                    name="priority"
                    value={editData.priority}
                    onChange={handleEditChange}
                    className="rounded-lg border border-white/10 bg-[#111118] px-4 py-3 text-sm text-zinc-300"
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
                  value={editData.assigned_to}
                  onChange={handleEditChange}
                  placeholder="Assigned user ID"
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                />

                <input
                  type="datetime-local"
                  name="due_date"
                  value={editData.due_date}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300"
                />

              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-white/5 pt-5">

                <button
                  type="button"
                  onClick={() =>
                    setEditing(false)
                  }
                  className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-zinc-400"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-violet-500 px-5 py-2.5 text-sm font-medium disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </form>
          )}

        </section>

        {/* Members + Comments */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          {/* Members */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">
                  Members
                </h2>

                <p className="mt-1 text-xs text-zinc-600">
                  People working on this workflow.
                </p>
              </div>

              <span className="text-xs text-zinc-600">
                {members.length} members
              </span>
            </div>

            <form
              onSubmit={handleAddMember}
              className="mt-5 flex gap-2"
            >
              <input
                type="number"
                min="1"
                value={memberUserId}
                onChange={(event) =>
                  setMemberUserId(
                    event.target.value
                  )
                }
                placeholder="User ID"
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white"
              />

              <button
                type="submit"
                disabled={addingMember}
                className="rounded-lg bg-violet-500 px-4 py-2.5 text-sm disabled:opacity-50"
              >
                {addingMember
                  ? "Adding..."
                  : "Add"}
              </button>
            </form>

            <div className="mt-5 space-y-2">

              {members.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-zinc-600">
                  No members yet.
                </p>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">

                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/10 text-sm font-semibold text-violet-400">
                        {member.username
                          ?.charAt(0)
                          ?.toUpperCase() || "U"}
                      </div>

                      <div>
                        <p className="text-sm text-zinc-200">
                          {member.username}
                        </p>

                        <p className="text-[11px] text-zinc-600">
                          User #{member.user}
                        </p>
                      </div>

                    </div>

                    <button
                      onClick={() =>
                        handleRemoveMember(
                          member.id
                        )
                      }
                      disabled={
                        removingMember ===
                        member.id
                      }
                      className="text-xs text-red-400 disabled:opacity-50"
                    >
                      {removingMember ===
                      member.id
                        ? "Removing..."
                        : "Remove"}
                    </button>

                  </div>
                ))
              )}

            </div>
          </section>

          {/* Comments */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">

            <h2 className="font-semibold">
              Comments
            </h2>

            <form
              onSubmit={handleAddComment}
              className="mt-5"
            >
              <textarea
                value={comment}
                onChange={(event) =>
                  setComment(event.target.value)
                }
                rows={3}
                placeholder="Write a comment..."
                className="w-full resize-none rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-zinc-600"
              />

              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={
                    commenting ||
                    !comment.trim()
                  }
                  className="rounded-lg bg-violet-500 px-4 py-2 text-xs font-medium disabled:opacity-50"
                >
                  {commenting
                    ? "Posting..."
                    : "Add Comment"}
                </button>
              </div>
            </form>

            <div className="mt-5 space-y-3">

              {comments.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-zinc-600">
                  No comments yet.
                </p>
              ) : (
                comments.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/5 bg-black/20 p-4"
                  >

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-zinc-300">
                          {item.author}
                        </p>

                        <p className="mt-1 text-[10px] text-zinc-600">
                          {new Date(
                            item.created_at
                          ).toLocaleString()}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          handleDeleteComment(
                            item.id
                          )
                        }
                        className="text-[11px] text-red-400"
                      >
                        Delete
                      </button>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-400">
                      {item.content}
                    </p>

                  </div>
                ))
              )}

            </div>
          </section>

        </div>

        {/* Attachments */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">

          <h2 className="font-semibold">
            Attachments
          </h2>

          <p className="mt-1 text-xs text-zinc-600">
            Add files or external file references to this workflow.
          </p>

          <form
            onSubmit={handleAddAttachment}
            className="mt-5 grid gap-3 md:grid-cols-4"
          >

            <input
              value={attachmentForm.file_name}
              onChange={(event) =>
                setAttachmentForm((current) => ({
                  ...current,
                  file_name: event.target.value,
                }))
              }
              placeholder="File name"
              className="rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white"
            />

            <input
              value={attachmentForm.file_url}
              onChange={(event) =>
                setAttachmentForm((current) => ({
                  ...current,
                  file_url: event.target.value,
                }))
              }
              placeholder="File URL"
              className="rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white"
            />

            <input
              type="number"
              min="0"
              value={attachmentForm.file_size}
              onChange={(event) =>
                setAttachmentForm((current) => ({
                  ...current,
                  file_size: event.target.value,
                }))
              }
              placeholder="Size in bytes"
              className="rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white"
            />

            <button
              type="submit"
              disabled={addingAttachment}
              className="rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            >
              {addingAttachment
                ? "Adding..."
                : "Add Attachment"}
            </button>

          </form>

          <div className="mt-5 space-y-2">

            {attachments.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-zinc-600">
                No attachments yet.
              </p>
            ) : (
              attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3"
                >

                  <div>
                    <p className="text-sm text-zinc-200">
                      {attachment.file_name}
                    </p>

                    <p className="mt-1 text-[11px] text-zinc-600">
                      {attachment.uploaded_by} •{" "}
                      {attachment.file_size || 0} bytes
                    </p>
                  </div>

                  <div className="flex items-center gap-4">

                    {attachment.file_url && (
                      <a
                        href={attachment.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-violet-400 hover:text-violet-300"
                      >
                        Open
                      </a>
                    )}

                    <button
                      onClick={() =>
                        handleDeleteAttachment(
                          attachment.id
                        )
                      }
                      className="text-xs text-red-400"
                    >
                      Delete
                    </button>

                  </div>

                </div>
              ))
            )}

          </div>
        </section>

        {/* Activity */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                Activity
              </h2>

              <p className="mt-1 text-xs text-zinc-600">
                Workflow history and recent actions.
              </p>
            </div>

            <span className="text-xs text-zinc-600">
              {activities.length} events
            </span>
          </div>

          <div className="mt-5 space-y-3">

            {activities.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-zinc-600">
                No activity yet.
              </p>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-3 rounded-xl border border-white/5 bg-black/20 p-4"
                >

                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-400" />

                  <div className="min-w-0">
                    <p className="text-sm text-zinc-300">
                      {activity.details}
                    </p>

                    <p className="mt-1 text-[11px] text-zinc-600">
                      {activity.actor} •{" "}
                      {new Date(
                        activity.created_at
                      ).toLocaleString()}
                    </p>
                  </div>

                </div>
              ))
            )}

          </div>
        </section>

      </div>
    </div>
  );
}

export default WorkflowDetails;