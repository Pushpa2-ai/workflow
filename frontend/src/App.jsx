import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import { apiRequest } from "./services/api";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import Projects from "./pages/Projects";
import Issues from "./pages/Issues";
import Teams from "./pages/Teams";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import ProjectDetails from "./pages/ProjectDetails";
import IssueDetails from "./pages/IssueDetails";
import TeamDetails from "./pages/TeamDetails";
import Workflows from "./pages/Workflows";
import WorkflowDetails from "./pages/WorkflowDetails";

function DemoEntry() {
  const navigate = useNavigate();

  useEffect(() => {
    const loginAsDemo = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"}/auth/demo-login/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Demo login failed");
        }

        const data = await response.json();

        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);

        navigate("/dashboard", { replace: true });
      } catch (error) {
        console.error("Demo login failed:", error);
        navigate("/login", { replace: true });
      }
    };

    loginAsDemo();
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">
        Loading Workflow...
      </p>
    </main>
  );
}

function Home() {
  const [status, setStatus] = useState(
    "Checking backend..."
  );

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const data = await apiRequest("/health/");
        setStatus(data.status);
      } catch {
        setStatus("Backend unavailable");
      }
    };

    checkBackend();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">
          Workflow
        </h1>

        <p className="mt-3">
          Backend status:{" "}
          <span className="font-semibold">
            {status}
          </span>
        </p>
      </div>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DemoEntry />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Projects />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ProjectDetails />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/issues"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Issues />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/issues/:issueId"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <IssueDetails />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Teams />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams/:id"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <TeamDetails />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workflows"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Workflows />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/workflows/:id"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <WorkflowDetails />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Notifications />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;