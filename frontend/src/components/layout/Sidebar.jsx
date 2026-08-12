import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { apiRequest } from "../../services/api";

const navigation = [
  { name: "Dashboard", path: "/dashboard", icon: "▦" },
  { name: "Projects", path: "/projects", icon: "▣" },
  { name: "Workflows", path: "/workflows", icon: "◆" },
  { name: "Issues", path: "/issues", icon: "◈" },
  { name: "Teams", path: "/teams", icon: "♟" },
  {
    name: "Notifications",
    path: "/notifications",
    icon: "◉",
  },
  { name: "Settings", path: "/settings", icon: "⚙" },
];

function Sidebar({ mobileOpen, onClose }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const data = await apiRequest("/notifications/");

      const notifications = Array.isArray(data)
        ? data
        : data.results || [];

      const unread = notifications.filter(
        (notification) => !notification.is_read
      ).length;

      setUnreadCount(unread);
    } catch {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(
      fetchUnreadCount,
      30000
    );

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    window.location.href = "/login";
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 shrink-0
          flex-col border-r border-white/10 bg-[#0a0a0f]
          transition-transform duration-200
          lg:static lg:min-h-screen lg:translate-x-0
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Workflow
            </h1>

            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-violet-400">
              Workspace
            </p>
          </div>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-200 lg:hidden"
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
            Workspace
          </p>

          <div className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                    isActive
                      ? "bg-violet-500/10 text-violet-400"
                      : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
                  }`
                }
              >
                <span className="flex w-5 justify-center text-sm">
                  {item.icon}
                </span>

                <span className="flex-1">
                  {item.name}
                </span>

                {item.name === "Notifications" &&
                  unreadCount > 0 && (
                    <span className="min-w-5 rounded-full bg-violet-500/15 px-1.5 py-0.5 text-center text-[10px] font-semibold text-violet-400">
                      {unreadCount > 99
                        ? "99+"
                        : unreadCount}
                    </span>
                  )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User / Logout */}
        <div className="border-t border-white/10 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-500 transition hover:bg-red-500/5 hover:text-red-400"
          >
            <span className="flex w-5 justify-center">
              ↪
            </span>

            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;