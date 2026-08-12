import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";

function TeamDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);

  const [error, setError] = useState("");
  const [memberError, setMemberError] = useState("");

  const [showAddMember, setShowAddMember] = useState(false);
  const [userId, setUserId] = useState("");

  const [addingMember, setAddingMember] = useState(false);
  const [removingMember, setRemovingMember] = useState(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [editData, setEditData] = useState({
    name: "",
    description: "",
  });

  // Delete state
  const [deleting, setDeleting] = useState(false);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest(`/teams/${id}/`);

      setTeam(data);

      setEditData({
        name: data.name || "",
        description: data.description || "",
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      setMembersLoading(true);
      setMemberError("");

      const data = await apiRequest(
        `/teams/${id}/members/`
      );

      const results = Array.isArray(data)
        ? data
        : data.results || [];

      setMembers(results);
    } catch (error) {
      setMemberError(error.message);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
    fetchMembers();
  }, [id]);

  // =========================
  // ADD MEMBER
  // =========================

  const handleAddMember = async (event) => {
    event.preventDefault();

    setMemberError("");

    if (!userId.trim()) {
      setMemberError("Please enter a user ID.");
      return;
    }

    try {
      setAddingMember(true);

      const member = await apiRequest(
        `/teams/${id}/members/add/`,
        {
          method: "POST",
          body: JSON.stringify({
            user: Number(userId),
          }),
        }
      );

      setMembers((current) => [
        ...current,
        member,
      ]);

      setUserId("");
      setShowAddMember(false);
    } catch (error) {
      setMemberError(error.message);
    } finally {
      setAddingMember(false);
    }
  };

  // =========================
  // REMOVE MEMBER
  // =========================

  const handleRemoveMember = async (memberId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this member?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingMember(memberId);
      setMemberError("");

      await apiRequest(
        `/teams/${id}/members/${memberId}/`,
        {
          method: "DELETE",
        }
      );

      setMembers((current) =>
        current.filter(
          (member) => member.id !== memberId
        )
      );
    } catch (error) {
      setMemberError(error.message);
    } finally {
      setRemovingMember(null);
    }
  };

  // =========================
  // EDIT TEAM
  // =========================

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSaveTeam = async (event) => {
    event.preventDefault();

    setEditError("");

    const name = editData.name.trim();

    if (!name) {
      setEditError("Team name is required.");
      return;
    }

    try {
      setSaving(true);

      const updatedTeam = await apiRequest(
        `/teams/${id}/`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name,
            description: editData.description.trim(),
          }),
        }
      );

      setTeam(updatedTeam);

      setEditData({
        name: updatedTeam.name || "",
        description: updatedTeam.description || "",
      });

      setEditing(false);
    } catch (error) {
      setEditError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELETE TEAM
  // =========================

  const handleDeleteTeam = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${team.name}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await apiRequest(
        `/teams/${id}/`,
        {
          method: "DELETE",
        }
      );

      navigate("/teams", {
        replace: true,
      });
    } catch (error) {
      setError(error.message);
      setDeleting(false);
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="min-h-full bg-[#0a0a0f] px-6 py-8 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center">
            <p className="text-sm text-zinc-500">
              Loading team...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error || !team) {
    return (
      <div className="min-h-full bg-[#0a0a0f] px-6 py-8 text-white">
        <div className="mx-auto max-w-7xl">

          <button
            onClick={() => navigate("/teams")}
            className="mb-6 text-sm text-violet-400 transition hover:text-violet-300"
          >
            ← Back to Teams
          </button>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center">
            <p className="text-sm text-red-400">
              {error || "Team not found."}
            </p>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#0a0a0f] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">

        {/* Back */}
        <button
          onClick={() => navigate("/teams")}
          className="mb-6 text-sm text-zinc-500 transition hover:text-violet-400"
        >
          ← Back to Teams
        </button>

        {/* =========================
            TEAM HEADER
        ========================= */}

        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">

          {!editing ? (
            <>
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">

                <div>
                  <div className="flex items-center gap-3">

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-lg font-semibold text-violet-400">
                      {team.name
                        ?.charAt(0)
                        ?.toUpperCase() || "T"}
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-violet-400">
                        Team
                      </p>

                      <h1 className="mt-1 text-2xl font-semibold">
                        {team.name}
                      </h1>
                    </div>

                  </div>

                  <p className="mt-5 max-w-3xl text-sm leading-6 text-zinc-500">
                    {team.description ||
                      "No description provided."}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-2">

                  <button
                    onClick={() => {
                      setEditing(true);
                      setEditError("");
                    }}
                    className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    Edit
                  </button>

                  <button
                    onClick={handleDeleteTeam}
                    disabled={deleting}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleting
                      ? "Deleting..."
                      : "Delete"}
                  </button>

                </div>

              </div>

              {/* Metadata */}
              <div className="mt-6 grid gap-4 border-t border-white/5 pt-5 sm:grid-cols-3">

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Owner
                  </p>

                  <p className="mt-1 text-sm text-zinc-300">
                    {team.owner || "Unknown"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Team ID
                  </p>

                  <p className="mt-1 text-sm text-zinc-300">
                    #{team.id}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Members
                  </p>

                  <p className="mt-1 text-sm text-zinc-300">
                    {members.length}
                  </p>
                </div>

              </div>
            </>
          ) : (
            /* =========================
               EDIT FORM
            ========================= */

            <form onSubmit={handleSaveTeam}>

              <div className="mb-6">
                <p className="text-xs uppercase tracking-wider text-violet-400">
                  Edit Team
                </p>

                <h1 className="mt-1 text-2xl font-semibold">
                  Update team information
                </h1>
              </div>

              {editError && (
                <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                  <p className="text-sm text-red-400">
                    {editError}
                  </p>
                </div>
              )}

              <div className="space-y-5">

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Team Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={editData.name}
                    onChange={handleEditChange}
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-violet-500/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={editData.description}
                    onChange={handleEditChange}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-violet-500/50"
                  />
                </div>

              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-white/5 pt-5">

                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setEditError("");

                    setEditData({
                      name: team.name || "",
                      description:
                        team.description || "",
                    });
                  }}
                  className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-violet-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </form>
          )}

        </div>

        {/* =========================
            MEMBERS
        ========================= */}

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>
              <h2 className="text-base font-semibold">
                Team Members
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                People who belong to this team.
              </p>
            </div>

            <button
              onClick={() => {
                setShowAddMember(true);
                setMemberError("");
              }}
              className="rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-400"
            >
              + Add Member
            </button>

          </div>

          {/* Add Member */}
          {showAddMember && (
            <form
              onSubmit={handleAddMember}
              className="mt-6 rounded-xl border border-white/10 bg-black/20 p-5"
            >

              <div className="mb-4">
                <h3 className="text-sm font-semibold">
                  Add Team Member
                </h3>

                <p className="mt-1 text-xs text-zinc-600">
                  Enter the ID of an existing user.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">

                <input
                  type="number"
                  min="1"
                  value={userId}
                  onChange={(event) =>
                    setUserId(event.target.value)
                  }
                  placeholder="User ID"
                  className="flex-1 rounded-lg border border-white/10 bg-[#111118] px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-violet-500/50"
                />

                <button
                  type="submit"
                  disabled={addingMember}
                  className="rounded-lg bg-violet-500 px-5 py-2.5 text-sm font-medium transition hover:bg-violet-400 disabled:opacity-50"
                >
                  {addingMember
                    ? "Adding..."
                    : "Add Member"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAddMember(false);
                    setUserId("");
                  }}
                  className="rounded-lg border border-white/10 px-5 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
                >
                  Cancel
                </button>

              </div>
            </form>
          )}

          {/* Member Error */}
          {memberError && (
            <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
              <p className="text-sm text-red-400">
                {memberError}
              </p>
            </div>
          )}

          {/* Members */}
          <div className="mt-6">

            {membersLoading ? (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
                <p className="text-sm text-zinc-600">
                  Loading members...
                </p>
              </div>
            ) : members.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
                <p className="text-sm text-zinc-600">
                  No members found.
                </p>
              </div>
            ) : (
              <div className="space-y-2">

                {members.map((member) => (
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
                        <p className="text-sm font-medium text-zinc-200">
                          {member.username}
                        </p>

                        <p className="text-xs text-zinc-600">
                          User #{member.user}
                        </p>
                      </div>

                    </div>

                    <button
                      onClick={() =>
                        handleRemoveMember(member.id)
                      }
                      disabled={
                        removingMember === member.id
                      }
                      className="text-xs font-medium text-red-400 transition hover:text-red-300 disabled:opacity-50"
                    >
                      {removingMember === member.id
                        ? "Removing..."
                        : "Remove"}
                    </button>

                  </div>
                ))}

              </div>
            )}

          </div>
        </section>

      </div>
    </div>
  );
}

export default TeamDetails;