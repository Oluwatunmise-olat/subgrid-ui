import { useState } from "react";

import Dashboard from "./Dashboard";
import ProjectsHome from "./ProjectsHome";
import { useProjects } from "../hooks/useQueryHooks";
import { STORAGE_KEYS } from "../lib/constants";
import { safeStorage } from "../lib/storage";

export default function ProjectShell() {
  const { data: projects = [], isLoading } = useProjects();

  const [activeProjectId, setActiveProjectId] = useState(() =>
    safeStorage.read(STORAGE_KEYS.lastProjectId),
  );

  const selectProject = (projectId) => {
    setActiveProjectId(projectId);

    if (projectId) safeStorage.write(STORAGE_KEYS.lastProjectId, projectId);
    else safeStorage.clear(STORAGE_KEYS.lastProjectId);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian text-xs text-[color:var(--text-faint)]">
        Loading...
      </div>
    );
  }

  const active = projects.find((p) => p.id === activeProjectId);

  if (!active) {
    return (
      <ProjectsHome
        projects={projects}
        onOpen={selectProject}
        onCreated={(project) => project && selectProject(project.id)}
      />
    );
  }

  return (
    <Dashboard
      projects={projects}
      activeProjectId={active.id}
      onBackToProjects={() => selectProject(null)}
    />
  );
}
