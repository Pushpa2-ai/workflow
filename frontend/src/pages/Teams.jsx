import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { useNavigate } from "react-router-dom";

function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const navigate = useNavigate();

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/teams/");

      const results = Array.isArray(data)
        ? data
        : data.results || [];

      setTeams(results);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCreateTeam = async (event) => {
    event.preventDefault();

    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Team name is required.");
      return;
    }

    try {
      setCreating(true);

      const createdTeam = await apiRequest(
        "/teams/create/",
        {
          method: "POST",
          body: JSON.stringify({
            name: formData.name.trim(),
            description: formData.description.trim(),
          }),
        }
      );

      setTeams((current) => [
        createdTeam,
        ...current,
      ]);

      setFormData({
        name: "",
        description: "",
      });

      setShowCreateForm(false);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setCreating(false);
    }
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
              Teams
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Collaborate with your team members.
            </p>
          </div>

          <button
            onClick={() => {
              setShowCreateForm(true);
              setFormError("");
            }}
            className="rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-400"
          >
            + New Team
          </button>
        </div>

        {/* Create Team Form */}
        {showCreateForm && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">

            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold">
                  Create Team
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Create a team for your workspace.
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
              onSubmit={handleCreateTeam}
              className="space-y-5"
            >
              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Team Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Engineering Team"
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
                  placeholder="Describe what this team does..."
                  className="w-full resize-none rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-violet-500/50"
                />
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
                  disabled={creating}
                  className="rounded-lg bg-violet-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating
                    ? "Creating..."
                    : "Create Team"}
                </button>

              </div>
            </form>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-10 text-center">
            <p className="text-sm text-zinc-500">
              Loading teams...
            </p>
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

        {/* Empty */}
        {!loading &&
          !error &&
          teams.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 font-semibold text-violet-400">
                T
              </div>

              <h2 className="mt-4 text-base font-semibold">
                No teams yet
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Create your first team to start collaborating.
              </p>
            </div>
          )}

        {/* Teams */}
        {!loading &&
          !error &&
          teams.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/30 hover:bg-white/[0.06]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 font-semibold text-violet-400">
                      {team.name
                        ?.charAt(0)
                        ?.toUpperCase() || "T"}
                    </div>

                    <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-400">
                      Team
                    </span>
                  </div>

                  <h2 className="mt-5 truncate text-base font-semibold text-zinc-100">
                    {team.name}
                  </h2>

                  <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-zinc-500">
                    {team.description ||
                      "No description provided."}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                        Owner
                      </p>

                      <p className="mt-1 text-xs text-zinc-400">
                        {team.owner || "Unknown"}
                      </p>
                    </div>

                    <button
                        onClick={() => navigate(`/teams/${team.id}`)}
                        className="text-xs font-medium text-violet-400 transition hover:text-violet-300"
                        >
                        View team →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

export default Teams;