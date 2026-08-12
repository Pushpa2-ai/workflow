import { useNavigate } from "react-router-dom";

function Settings() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-full bg-[#0a0a0f] px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-violet-400">
            WORKSPACE
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            Settings
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Manage your Workflow account and application preferences.
          </p>
        </div>

        <div className="space-y-5">

          {/* Account */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-6">
              <h2 className="text-base font-semibold">
                Account
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Information about your current session.
              </p>
            </div>

            <div className="space-y-4">

              <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4">
                <div>
                  <p className="text-sm font-medium text-zinc-300">
                    Authentication
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    Your account is currently authenticated.
                  </p>
                </div>

                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4">
                <div>
                  <p className="text-sm font-medium text-zinc-300">
                    Theme
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    Current application appearance.
                  </p>
                </div>

                <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-400">
                  Dark
                </span>
              </div>

            </div>
          </section>

          {/* Application */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-6">
              <h2 className="text-base font-semibold">
                Application
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Workflow application information.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-600">
                  Application
                </p>

                <p className="mt-2 text-sm font-medium text-zinc-200">
                  Workflow
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-600">
                  Frontend
                </p>

                <p className="mt-2 text-sm font-medium text-zinc-200">
                  React + Vite
                </p>
              </div>

            </div>
          </section>

          {/* Security */}
          <section className="rounded-2xl border border-red-500/10 bg-red-500/[0.02] p-6">
            <div className="mb-6">
              <h2 className="text-base font-semibold">
                Session
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Sign out from your current Workflow session.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/15 hover:text-red-300"
            >
              Log out
            </button>
          </section>

        </div>
      </div>
    </div>
  );
}

export default Settings;