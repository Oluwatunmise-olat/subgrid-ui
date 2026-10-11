import { useEffect, useState } from "react";

import CreateProjectScreen from "../components/CreateProjectScreen";
import Dashboard from "./Dashboard";
import { useProjects } from "../hooks/useQueryHooks";

const LAST_PROJECT_KEY = "subgrid.last-project-id";

export default function ProjectShell() {
  const { data: projects = [], isLoading } = useProjects();
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [forceCreate, setForceCreate] = useState(false);

  useEffect(() => {
    if (activeProjectId || !projects.length) return;

    let stored = null;
    try {
      stored = localStorage.getItem(LAST_PROJECT_KEY);
    } catch {
      // ignore - per-viewer convenience only
    }

    const match = projects.find((project) => project.id === stored);
    setActiveProjectId(match ? match.id : projects[0].id);
  }, [projects, activeProjectId]);

  const selectProject = (projectId) => {
    setActiveProjectId(projectId);
    setForceCreate(false);
    try {
      localStorage.setItem(LAST_PROJECT_KEY, projectId);
    } catch {
      // ignore
    }
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-obsidian text-xs text-zinc-600">Loading...</div>;
  }

  if (!projects.length || forceCreate) {
    return <CreateProjectScreen onCreated={(project) => project && selectProject(project.id)} />;
  }

  return (
    <Dashboard
      projects={projects}
      activeProjectId={activeProjectId || projects[0].id}
      onSelectProject={selectProject}
      onCreateNewProject={() => setForceCreate(true)}
    />
  );
}
