import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";

function Topbar({ onMenuClick }) {
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const fetchProfile = async () => {
    try {
      const data = await apiRequest("/auth/profile/");
      setProfile(data);
    } catch {
      setProfile(null);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await apiRequest("/notifications/");

      const notifications = Array.isArray(data)
        ? data
        : data.results || [];

      setUnreadCount(
        notifications.filter(
          (notification) => !notification.is_read
        ).length
      );
    } catch {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchUnreadCount();

    const interval = setInterval(
      fetchUnreadCount,
      30000
    );

    return () => clearInterval(interval);
  }, []);

  /* -----------------------------
     SEARCH
  ----------------------------- */

  useEffect(() => {
    const handleKeyboard = (event) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setSearchOpen(true);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setUserMenuOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyboard
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyboard
      );
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setSearchOpen(false);
      }

      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  useEffect(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);

        const [
          projectsData,
          teamsData,
          workflowsData,
        ] = await Promise.all([
          apiRequest(
            `/projects/?search=${encodeURIComponent(
              searchValue
            )}`
          ),
          apiRequest(
            `/teams/?search=${encodeURIComponent(
              searchValue
            )}`
          ),
          apiRequest(
            `/workflows/?search=${encodeURIComponent(
              searchValue
            )}`
          ),
        ]);

        const projects = Array.isArray(projectsData)
          ? projectsData
          : projectsData.results || [];

        const teams = Array.isArray(teamsData)
          ? teamsData
          : teamsData.results || [];

        const workflows = Array.isArray(workflowsData)
          ? workflowsData
          : workflowsData.results || [];

        const results = [
          ...projects.slice(0, 5).map((item) => ({
            id: `project-${item.id}`,
            type: "Project",
            name: item.name,
            description:
              item.description ||
              "Project",
            path: `/projects/${item.id}`,
          })),

          ...teams.slice(0, 5).map((item) => ({
            id: `team-${item.id}`,
            type: "Team",
            name: item.name,
            description:
              item.description ||
              "Team",
            path: `/teams/${item.id}`,
          })),

          ...workflows.slice(0, 5).map((item) => ({
            id: `workflow-${item.id}`,
            type: "Workflow",
            name: item.name,
            description:
              item.description ||
              "Workflow",
            path: `/workflows/${item.id}`,
          })),
        ];

        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleSearchClick = (result) => {
    setSearch("");
    setSearchOpen(false);
    navigate(result.path);
  };

  /* -----------------------------
     USER
  ----------------------------- */

  const username =
    profile?.username || "User";

  const role =
    profile?.role || "Developer";

  const initial =
    username.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <header className="relative z-40 flex h-20 items-center justify-between border-b border-white/10 bg-[#0a0a0f] px-6">
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:bg-white/[0.06] hover:text-white lg:hidden"
          aria-label="Open navigation"
        >
          ☰
        </button>

        <div>
          <p className="text-sm font-medium text-zinc-200">
            Workspace
          </p>

          <p className="text-xs text-zinc-600">
            Manage your projects and workflow
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">

        {/* SEARCH */}
        <div
          ref={searchRef}
          className="relative hidden sm:block"
        >
          <button
            onClick={() => setSearchOpen(true)}
            className="flex w-56 items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-zinc-500 transition hover:border-white/20 hover:text-zinc-300"
          >
            <span>Search...</span>

            <span className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] text-zinc-600">
              ⌘ K
            </span>
          </button>

          {searchOpen && (
            <div className="absolute right-0 top-12 w-96 overflow-hidden rounded-xl border border-white/10 bg-[#111118] shadow-2xl">

              {/* Search input */}
              <div className="border-b border-white/10 p-3">
                <input
                  autoFocus
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search projects, teams, workflows..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                />
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto">

                {!search.trim() && (
                  <div className="p-6 text-center">
                    <p className="text-sm text-zinc-500">
                      Start typing to search
                    </p>

                    <p className="mt-1 text-xs text-zinc-700">
                      Projects · Teams · Workflows
                    </p>
                  </div>
                )}

                {search.trim() &&
                  searchLoading && (
                    <div className="p-6 text-center">
                      <p className="text-sm text-zinc-500">
                        Searching...
                      </p>
                    </div>
                  )}

                {search.trim() &&
                  !searchLoading &&
                  searchResults.length === 0 && (
                    <div className="p-6 text-center">
                      <p className="text-sm text-zinc-500">
                        No results found
                      </p>
                    </div>
                  )}

                {!searchLoading &&
                  searchResults.length > 0 && (
                    <div className="p-2">
                      {searchResults.map(
                        (result) => (
                          <button
                            key={result.id}
                            onClick={() =>
                              handleSearchClick(
                                result
                              )
                            }
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-white/[0.05]"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-xs font-semibold text-violet-400">
                              {result.name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "W"}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-zinc-200">
                                {result.name}
                              </p>

                              <p className="mt-0.5 truncate text-xs text-zinc-600">
                                {result.type} ·{" "}
                                {result.description}
                              </p>
                            </div>

                            <span className="text-[10px] text-zinc-700">
                              →
                            </span>
                          </button>
                        )
                      )}
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* NOTIFICATIONS */}
        <button
          onClick={() =>
            navigate("/notifications")
          }
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-500 transition hover:text-zinc-200"
          aria-label="Notifications"
        >
          ◉

          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-violet-500 px-1 text-[9px] font-bold text-white">
              {unreadCount > 99
                ? "99+"
                : unreadCount}
            </span>
          )}
        </button>

        {/* USER MENU */}
        <div
          ref={userMenuRef}
          className="relative"
        >
          <button
            onClick={() =>
              setUserMenuOpen(
                (current) => !current
              )
            }
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-white/[0.04]"
          >
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium text-zinc-300">
                {username}
              </p>

              <p className="text-[10px] text-zinc-600">
                {role}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/15 text-sm font-semibold text-violet-400">
              {initial}
            </div>

            <span
              className={`hidden text-[10px] text-zinc-600 transition sm:block ${
                userMenuOpen
                  ? "rotate-180"
                  : ""
              }`}
            >
              ▼
            </span>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-12 w-60 overflow-hidden rounded-xl border border-white/10 bg-[#111118] shadow-2xl">

              {/* User header */}
              <div className="border-b border-white/10 p-4">
                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/15 text-sm font-semibold text-violet-400">
                    {initial}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {username}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-zinc-600">
                      {role}
                    </p>
                  </div>

                </div>
              </div>

              {/* Menu */}
              <div className="p-2">

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate("/settings");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-400 transition hover:bg-white/[0.05] hover:text-zinc-200"
                >
                  <span className="w-5 text-center">
                    ⚙
                  </span>

                  Settings
                </button>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate("/notifications");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-400 transition hover:bg-white/[0.05] hover:text-zinc-200"
                >
                  <span className="w-5 text-center">
                    ◉
                  </span>

                  Notifications

                  {unreadCount > 0 && (
                    <span className="ml-auto rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-400">
                      {unreadCount}
                    </span>
                  )}
                </button>

              </div>

              {/* Logout */}
              <div className="border-t border-white/10 p-2">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-400 transition hover:bg-red-500/5"
                >
                  <span className="w-5 text-center">
                    ↪
                  </span>

                  Logout
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </header>
  );
}

export default Topbar;