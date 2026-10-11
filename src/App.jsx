import { useEffect } from "react";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { queryClient } from "./lib/queryClient";
import { setAuthErrorHandler } from "./services/api";
import { useSessionStatus } from "./hooks/useQueryHooks";
import Login from "./pages/Login";
import ProjectShell from "./pages/ProjectShell";
import Products from "./pages/Products";

function Gate() {
  const queryClient = useQueryClient();
  const { data: authenticated, isLoading } = useSessionStatus();

  useEffect(() => {
    setAuthErrorHandler(() => queryClient.setQueryData(["session"], false));
  }, [queryClient]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-obsidian text-xs text-zinc-600">Loading...</div>;
  }

  if (!authenticated) {
    return <Login onSignedIn={() => queryClient.setQueryData(["session"], true)} />;
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
          style: { background: "#18181b", color: "#e4e4e7", border: "1px solid #27272a" },
        }}
      />
      <Gate />
    </QueryClientProvider>
  );
}
