import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { apiRequest } from "./services/api";

function Home() {
  const [status, setStatus] = useState("Checking backend...");

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
        <h1 className="text-4xl font-bold">Workflow</h1>
        <p className="mt-3">
          Backend status: <span className="font-semibold">{status}</span>
        </p>
      </div>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;