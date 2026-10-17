import { useEffect, useState } from "react";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { queryClient } from "./lib/queryClient";
import { setAuthErrorHandler } from "./services/api";
import { useSessionStatus } from "./hooks/useQueryHooks";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import ProjectShell from "./pages/ProjectShell";
import Products from "./pages/Products";
import { QUERY_KEYS } from "./lib/constants";

function Gate() {
  const queryClient = useQueryClient();

  const { data: authenticated, isLoading } = useSessionStatus();

  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    setAuthErrorHandler(() =>
      queryClient.setQueryData([QUERY_KEYS.session], false),
    );
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian text-xs text-[color:var(--text-faint)]">
        Loading...
      </div>
    );
  }

  if (!authenticated) {
    if (!showLogin) {
      return <Landing onGetStarted={() => setShowLogin(true)} />;
    }

    return (
      <Login
        onSignedIn={() => queryClient.setQueryData([QUERY_KEYS.session], true)}
        onBack={() => setShowLogin(false)}
      />
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProjectShell />} />
        <Route path="/products" element={<Products />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1e1e25",
            color: "#ececef",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 12px 32px -12px rgba(0,0,0,0.7)",
          },
        }}
      />
      <Gate />
    </QueryClientProvider>
  );
}
