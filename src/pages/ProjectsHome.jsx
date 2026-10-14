import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Boxes,
  FolderKanban,
  Plus,
  Search,
  Server,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import AppShell from "../components/AppShell";
import { useCreateProject, useMcpServers } from "../hooks/useQueryHooks";
import { slugify } from "../lib/integrations";

export default function ProjectsHome({ projects, onOpen, onCreated }) {
  const [query, setQuery] = useState("");

  const [showNew, setShowNew] = useState(projects.length === 0);

  const { data: servers = [] } = useMcpServers(undefined);

  const visible = useMemo(
    () =>
      projects.filter(
        (project) =>
          !query.trim() ||
          `${project.name} ${project.slug}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [projects, query],
  );

  const healthy = servers.filter(
    (server) => server.health === "healthy",
  ).length;

  const byProject = servers.reduce((map, server) => {
    if (!map[server.project_id]) map[server.project_id] = [];

    map[server.project_id].push(server);

    return map;
  }, {});

  return (
    <AppShell onNewProject={() => setShowNew(true)}>
      <main className="animate-fade-up mx-auto w-full max-w-[1200px] px-5 pb-16 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-[color:var(--border)] py-10">
          <div>
            <p className="eyebrow mb-2">Workspace / Projects</p>
            <h1 className="font-display text-[34px] font-semibold leading-none text-[color:var(--text)]">
              Projects
            </h1>
            <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-[color:var(--text-dim)]">
              Each project is an isolated operating environment with its own
              components, encrypted credentials, and audit trail.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="well flex items-center gap-2 rounded-lg px-3 py-2">
              <Search size={13} className="text-[color:var(--text-dim)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects"
                className="w-40 bg-transparent text-[12px] text-[color:var(--text)] placeholder:text-[color:var(--text-dim)] focus:outline-none"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")}>
                  <X size={12} className="text-[color:var(--text-dim)]" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="btn-primary"
            >
              <Plus size={14} /> New project
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 border-b border-[color:var(--border)]">
          <Metric
            label="Projects"
            value={projects.length}
            icon={FolderKanban}
          />
          <Metric
            label="Connected components"
            value={servers.length}
            icon={Boxes}
          />
          <Metric
            label="Healthy connections"
            value={`${healthy}/${servers.length || 0}`}
            icon={Server}
          />
        </div>
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <p className="eyebrow">All projects</p>
            <span className="font-mono text-[10px] text-[color:var(--text-dim)]">
              {visible.length} shown
            </span>
          </div>
          <div className="panel overflow-hidden p-0">
            {visible.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                servers={byProject[project.id] || []}
                onOpen={() => onOpen(project.id)}
              />
            ))}

            {!projects.length ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <span className="well flex h-11 w-11 items-center justify-center rounded-xl">
                  <FolderKanban
                    size={18}
                    className="text-[color:var(--text-faint)]"
                  />
                </span>
                <p className="text-[13px] font-medium text-[color:var(--text)]">
                  No projects yet
                </p>
                <p className="max-w-[400px] text-[11.5px] leading-relaxed text-[color:var(--text-dim)]">
                  A project is one isolated environment — its own components,
                  its own encrypted credentials, its own audit trail. Create
                  one, then connect the services it should run.
                </p>
                <button
                  type="button"
                  onClick={() => setShowNew(true)}
                  className="btn-primary mt-1"
                >
                  <Plus size={14} /> Create your first project
                </button>
              </div>
            ) : (
              <>
                {!visible.length && (
                  <p className="px-5 py-12 text-center text-[12px] text-[color:var(--text-dim)]">
                    No projects match “{query}”.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setShowNew(true)}
                  className="flex w-full items-center gap-3 border-t border-dashed border-[color:var(--border)] px-5 py-4 text-left text-[12px] text-[color:var(--text-dim)] transition-colors hover:bg-white/[0.03] hover:text-[color:var(--text)]"
                >
                  <span className="well flex h-7 w-7 items-center justify-center rounded-md">
                    <Plus size={13} />
                  </span>
                  <span className="flex-1">Create a new project</span>
                  <ArrowUpRight size={13} />
                </button>
              </>
            )}
          </div>
        </div>
      </main>
      {showNew && (
        <NewProjectDialog
          onClose={() => setShowNew(false)}
          onCreated={(project) => {
            setShowNew(false);
            onCreated?.(project);
          }}
        />
      )}
    </AppShell>
  );
}

function ProjectRow({ project, servers, onOpen }) {
  const healthy = servers.filter(
    (server) => server.health === "healthy",
  ).length;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
    >
      <span className="well flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
        <Boxes size={16} className="text-[color:var(--text-faint)]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-medium text-[color:var(--text)]">
          {project.name}
        </span>
        <span className="mt-0.5 block font-mono text-[10px] text-[color:var(--text-dim)]">
          {project.slug}
        </span>
      </span>
      <span className="hidden items-center gap-2 font-mono text-[10px] text-[color:var(--text-dim)] sm:flex">
        <Server size={12} /> {servers.length} component
        {servers.length === 1 ? "" : "s"}
      </span>
      <span className="flex items-center gap-1.5 text-[10px] text-[color:var(--text-dim)]">
        <span
          className={`h-1.5 w-1.5 rounded-full ${servers.length && healthy === servers.length ? "bg-emerald-400" : servers.length ? "bg-amber-400" : "bg-[color:var(--text-faint)]"}`}
        />
        {servers.length
          ? `${healthy}/${servers.length} healthy`
          : "Needs setup"}
      </span>
      <ArrowUpRight
        size={14}
        className="text-[color:var(--text-dim)] transition-transform group-hover:translate-x-0.5 group-hover:text-[color:var(--text-faint)]"
      />
    </button>
  );
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 border-r border-[color:var(--border)] px-4 py-4 first:pl-0 last:border-0">
      <Icon size={14} className="text-[color:var(--text-dim)]" />
      <div>
        <div className="font-mono text-[16px] text-[color:var(--text)]">
          {value}
        </div>
        <div className="mt-0.5 text-[10px] text-[color:var(--text-dim)]">
          {label}
        </div>
      </div>
    </div>
  );
}

function NewProjectDialog({ onClose, onCreated }) {
  const [name, setName] = useState("");

  const create = useCreateProject();

  const slug = slugify(name);

  const submit = (event) => {
    event.preventDefault();

    if (!slug) return;

    create.mutate(
      { name: name.trim(), slug },
      {
        onSuccess: (response) => {
          toast.success(`${name.trim()} created`);

          onCreated(response?.data?.project);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <div className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="animate-scale-in panel-solid w-full max-w-md p-5">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[color:var(--text)]">
            Create project
          </h3>
          <button type="button" onClick={onClose}>
            <X size={16} className="text-[color:var(--text-dim)]" />
          </button>
        </div>
        <p className="mb-5 text-[12px] leading-relaxed text-[color:var(--text-dim)]">
          Projects isolate components, secrets, and action history. Start with a
          name and connect the stack next.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-[color:var(--text-dim)]">
              Project name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-sunken)] px-3 py-2.5 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--brand)]"
            />
            {slug && (
              <p className="mt-1.5 font-mono text-[10px] text-[color:var(--text-dim)]">
                slug: {slug}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!slug || create.isPending}
              className="btn-primary flex-1 justify-center"
            >
              {create.isPending ? "Creating…" : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
