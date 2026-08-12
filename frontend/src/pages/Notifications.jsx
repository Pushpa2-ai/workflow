import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingRead, setMarkingRead] = useState(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/notifications/");

      const results = Array.isArray(data)
        ? data
        : data.results || [];

      setNotifications(results);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) => !notification.is_read
      ).length,
    [notifications]
  );

  const formatType = (type) => {
    return type
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const markAsRead = async (notificationId) => {
    try {
      setMarkingRead(notificationId);

      await apiRequest(
        `/notifications/${notificationId}/read/`,
        {
          method: "PATCH",
          body: JSON.stringify({}),
        }
      );

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                is_read: true,
              }
            : notification
        )
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setMarkingRead(null);
    }
  };

  return (
    <div className="min-h-full bg-[#0a0a0f] px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-violet-400">
            WORKSPACE
          </p>

          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Notifications
              </h1>

              <p className="mt-2 text-sm text-zinc-500">
                Stay updated with activity across your workspace.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2">
              <span className="text-xs text-zinc-500">
                Unread
              </span>

              <span className="ml-2 text-sm font-semibold text-violet-400">
                {loading ? "..." : unreadCount}
              </span>
            </div>
          </div>
        </div>

        {/* Error */}
        {!loading && error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center">
            <p className="text-sm text-zinc-500">
              Loading notifications...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          notifications.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                ◉
              </div>

              <h2 className="mt-4 text-base font-semibold">
                You're all caught up
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                New notifications will appear here.
              </p>
            </div>
          )}

        {/* Notifications */}
        {!loading &&
          !error &&
          notifications.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <div className="divide-y divide-white/5">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-5 transition ${
                      notification.is_read
                        ? "bg-transparent"
                        : "bg-violet-500/[0.03]"
                    }`}
                  >
                    <div className="flex gap-4">

                      {/* Status indicator */}
                      <div className="flex shrink-0 pt-1">
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            notification.is_read
                              ? "bg-zinc-700"
                              : "bg-violet-400"
                          }`}
                        />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col justify-between gap-2 sm:flex-row">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-sm font-semibold text-zinc-200">
                                {notification.title}
                              </h2>

                              <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-400">
                                {formatType(
                                  notification.notification_type
                                )}
                              </span>
                            </div>

                            <p className="mt-2 text-sm leading-6 text-zinc-500">
                              {notification.message}
                            </p>
                          </div>

                          {!notification.is_read && (
                            <button
                              onClick={() =>
                                markAsRead(
                                  notification.id
                                )
                              }
                              disabled={
                                markingRead ===
                                notification.id
                              }
                              className="shrink-0 self-start text-xs font-medium text-violet-400 transition hover:text-violet-300 disabled:opacity-50"
                            >
                              {markingRead ===
                              notification.id
                                ? "Marking..."
                                : "Mark as read"}
                            </button>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-zinc-600">
                          <span>
                            {formatDate(
                              notification.created_at
                            )}
                          </span>

                          {notification.related_issue && (
                            <span>
                              Issue #
                              {notification.related_issue}
                            </span>
                          )}

                          <span>
                            {notification.recipient}
                          </span>
                        </div>
                      </div>
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

export default Notifications;