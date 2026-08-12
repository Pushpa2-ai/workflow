import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

function Dashboard() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const [projectsData, notificationsData] =
          await Promise.all([
            apiRequest("/projects/"),
            apiRequest("/notifications/"),
          ]);

        const projectResults = Array.isArray(projectsData)
          ? projectsData
          : projectsData.results || [];

        const notificationResults = Array.isArray(
          notificationsData
        )
          ? notificationsData
          : notificationsData.results || [];

        setProjects(projectResults);
        setNotifications(notificationResults);

        // Fetch issues for every project
        const issueResponses = await Promise.all(
          projectResults.map(async (project) => {
            try {
              const data = await apiRequest(
                `/projects/${project.id}/issues/`
              );

              const results = Array.isArray(data)
                ? data
                : data.results || [];

              return results;
            } catch {
              return [];
            }
          })
        );

        setIssues(issueResponses.flat());
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = useMemo(() => {
    const completed = issues.filter(
      (issue) => issue.status === "DONE"
    ).length;

    const open = issues.filter(
      (issue) =>
        issue.status !== "DONE" &&
        issue.status !== "CANCELLED"
    ).length;

    const unread = notifications.filter(
      (notification) => !notification.is_read
    ).length;

    return {
      projects: projects.length,
      issues: open,
      completed,
      unread,
    };
  }, [projects, issues, notifications]);

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      )
      .slice(0, 5);
  }, [projects]);

  const recentIssues = useMemo(() => {
    return [...issues]
      .sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      )
      .slice(0, 5);
  }, [issues]);

  const getStatusStyle = (status) => {
    switch (status) {
      case "DONE":
        return "bg-emerald-500/10 text-emerald-400";

      case "IN_PROGRESS":
        return "bg-violet-500/10 text-violet-400";

      case "BLOCKED":
        return "bg-red-500/10 text-red-400";

      case "CANCELLED":
        return "bg-zinc-500/10 text-zinc-500";

      default:
        return "bg-blue-500/10 text-blue-400";
    }
  };

  const formatStatus = (status) => {
    return status
      ?.replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-violet-400">
              WORKSPACE
            </p>

            <h1 className="text-3xl font-semibold tracking-tight">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Welcome back to Workflow. Here's what's happening today.
            </p>
          </div>

          <div className="hidden rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-400 sm:block">
            Overview
          </div>
        </div>

        {/* Global Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <p className="text-sm text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* Statistics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Projects */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-all duration-200 hover:border-violet-500/30 hover:bg-white/[0.06]">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">
                Projects
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                P
              </div>
            </div>

            <p className="mt-5 text-3xl font-semibold tracking-tight">
              {loading ? "..." : stats.projects}
            </p>

            <p className="mt-2 text-xs text-zinc-600">
              Active projects
            </p>
          </div>

          {/* Issues */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-all duration-200 hover:border-blue-500/30 hover:bg-white/[0.06]">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">
                Issues
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                I
              </div>
            </div>

            <p className="mt-5 text-3xl font-semibold tracking-tight">
              {loading ? "..." : stats.issues}
            </p>

            <p className="mt-2 text-xs text-zinc-600">
              Open issues
            </p>
          </div>

          {/* Completed */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-all duration-200 hover:border-emerald-500/30 hover:bg-white/[0.06]">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">
                Completed
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                ✓
              </div>
            </div>

            <p className="mt-5 text-3xl font-semibold tracking-tight">
              {loading ? "..." : stats.completed}
            </p>

            <p className="mt-2 text-xs text-zinc-600">
              Completed issues
            </p>
          </div>

          {/* Notifications */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-all duration-200 hover:border-amber-500/30 hover:bg-white/[0.06]">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">
                Notifications
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                !
              </div>
            </div>

            <p className="mt-5 text-3xl font-semibold tracking-tight">
              {loading ? "..." : stats.unread}
            </p>

            <p className="mt-2 text-xs text-zinc-600">
              Unread notifications
            </p>
          </div>
        </div>

        {/* Main Sections */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">

          {/* Recent Projects */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">
                  Recent Projects
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                  Your latest projects
                </p>
              </div>

              <button
                onClick={() => navigate("/projects")}
                className="text-xs font-medium text-violet-400 transition hover:text-violet-300"
              >
                View all
              </button>
            </div>

            <div className="mt-6">

              {loading ? (
                <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/10">
                  <p className="text-sm text-zinc-500">
                    Loading projects...
                  </p>
                </div>
              ) : recentProjects.length === 0 ? (
                <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/10">
                  <p className="text-sm text-zinc-600">
                    No projects found.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() =>
                        navigate(
                          `/projects/${project.id}`
                        )
                      }
                      className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-left transition hover:border-violet-500/20 hover:bg-white/[0.03]"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          {project.name}
                        </p>

                        <p className="mt-1 text-xs text-zinc-600">
                          Project #{project.id}
                        </p>
                      </div>

                      <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs text-violet-400">
                        Project
                      </span>
                    </button>
                  ))}
                </div>
              )}

            </div>
          </section>

          {/* Recent Issues */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">
                  Recent Issues
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                  Latest issue activity
                </p>
              </div>

              <button
                onClick={() => navigate("/issues")}
                className="text-xs font-medium text-violet-400 transition hover:text-violet-300"
              >
                View all
              </button>
            </div>

            <div className="mt-6">

              {loading ? (
                <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/10">
                  <p className="text-sm text-zinc-500">
                    Loading issues...
                  </p>
                </div>
              ) : recentIssues.length === 0 ? (
                <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/10">
                  <p className="text-sm text-zinc-600">
                    No issues found.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentIssues.map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() =>
                        navigate(
                          `/projects/${issue.project}/issues/${issue.id}`
                        )
                      }
                      className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-left transition hover:border-blue-500/20 hover:bg-white/[0.03]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-200">
                          {issue.title}
                        </p>

                        <p className="mt-1 truncate text-xs text-zinc-600">
                          {issue.project_name ||
                            `Project #${issue.project}`}
                        </p>
                      </div>

                      <span
                        className={`ml-4 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${getStatusStyle(
                          issue.status
                        )}`}
                      >
                        {formatStatus(
                          issue.status
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              )}

            </div>
          </section>
        </div>

        {/* Quick Overview */}
        <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6">

          <div>
            <h2 className="text-base font-semibold">
              Workspace Overview
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              A quick summary of your current workload.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">

            <button
              onClick={() => navigate("/workflows")}
              className="rounded-xl border border-white/5 bg-black/20 p-4 text-left transition hover:border-violet-500/20 hover:bg-white/[0.03]"
            >
              <p className="text-xs text-zinc-500">
                Workflows
              </p>

              <p className="mt-2 text-lg font-semibold text-zinc-200">
                Manage workflows
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                View and track workflow progress →
              </p>
            </button>

            <button
              onClick={() =>
                navigate("/notifications")
              }
              className="rounded-xl border border-white/5 bg-black/20 p-4 text-left transition hover:border-amber-500/20 hover:bg-white/[0.03]"
            >
              <p className="text-xs text-zinc-500">
                Notifications
              </p>

              <p className="mt-2 text-lg font-semibold text-zinc-200">
                {loading
                  ? "..."
                  : stats.unread}{" "}
                unread
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                Review recent activity →
              </p>
            </button>

            <button
              onClick={() => navigate("/teams")}
              className="rounded-xl border border-white/5 bg-black/20 p-4 text-left transition hover:border-emerald-500/20 hover:bg-white/[0.03]"
            >
              <p className="text-xs text-zinc-500">
                Teams
              </p>

              <p className="mt-2 text-lg font-semibold text-zinc-200">
                Collaborate
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                Manage your teams →
              </p>
            </button>

          </div>
        </section>

      </div>
    </main>
  );
}

export default Dashboard;