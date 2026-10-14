import { useMemo, useState } from "react";
import { ChevronRight, Lock, Plus, Search, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell";
import CollapsibleSection from "../components/CollapsibleSection";
import { useCatalog, useMcpServers, useProjects } from "../hooks/useQueryHooks";
import { brandFor } from "../lib/brand";

const ORDER = ["storage", "email", "dns", "paas", "database", "other"];

export default function Products() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");

  const [projectId, setProjectId] = useState("");

  const { data: projects = [] } = useProjects();

  const { data: servers = [] } = useMcpServers(projectId || undefined);

  const { data: catalog } = useCatalog();

  const integrations = catalog.integrations;

  const connected = new Set(
    servers.map((server) => server.provider).filter(Boolean),
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    return integrations.filter(
      (item) =>
        !term ||
        `${item.name} ${item.description} ${item.id}`
          .toLowerCase()
          .includes(term),
    );
  }, [integrations, query]);

  const groups = ORDER.map((category) => ({
    category,
    items: filtered.filter((item) => item.category === category),
  })).filter((group) => group.items.length);

  return (
    <AppShell onNewProject={() => navigate("/")}>
      <main className="mx-auto w-full max-w-[1200px] px-5 pb-16 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-[color:var(--border)] py-10">
          <div>
            <p className="eyebrow mb-2">Workspace / Components</p>
            <h1 className="font-display text-[34px] font-semibold leading-none text-[color:var(--text)]">
              Component catalog
            </h1>
            <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-[color:var(--text-dim)]">
              Connect verified MCP servers to give projects access to real
              infrastructure actions. Credentials are encrypted at rest and
              never returned.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="well flex items-center gap-2 rounded-lg px-3 py-2">
              <Search size={13} className="text-[color:var(--text-dim)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search catalog"
                className="w-44 bg-transparent text-[12px] text-[color:var(--text)] placeholder:text-[color:var(--text-dim)] focus:outline-none"
              />
            </div>
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-[12px] text-[color:var(--text)] outline-none"
            >
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 border-b border-[color:var(--border)] py-4 text-[11px] text-[color:var(--text-dim)]">
          <ShieldCheck size={14} className="text-emerald-400" />{" "}
          {connected.size} connected in this view{" "}
          <span className="mx-1 text-[color:var(--text-dim)]">·</span>{" "}
          {integrations.length} available integrations
        </div>
        <div className="mt-6 space-y-3">
          {groups.map(({ category, items }) => (
            <CollapsibleSection
              key={category}
              id={`catalog-${category}`}
              title={catalog.categories[category]}
              count={items.length}
              defaultOpen
            >
              <div className="panel overflow-hidden p-0">
                {items.map((item, index) => (
                  <CatalogRow
                    key={item.id}
                    item={item}
                    connected={connected.has(item.id)}
                    onConnect={() => navigate(`/?connect=${item.id}`)}
                    first={!index}
                  />
                ))}
              </div>
            </CollapsibleSection>
          ))}

          {!groups.length && (
            <p className="py-16 text-center text-xs text-[color:var(--text-dim)]">
              No components match “{query}”.
            </p>
          )}
        </div>
      </main>
    </AppShell>
  );
}

function CatalogRow({ item, connected, onConnect, first }) {
  const { Icon } = brandFor(item.id);

  return (
    <button
      type="button"
      onClick={onConnect}
      className={`group flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-white/[0.03] ${first ? "" : "border-t border-[color:var(--border)]"}`}
    >
      <span className="well flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
        <Icon size={15} className="text-[color:var(--text-faint)]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-[color:var(--text)]">
            {item.name}
          </span>
          {connected && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{" "}
              connected
            </span>
          )}
        </span>
        <span className="mt-1 block max-w-2xl truncate text-[11.5px] text-[color:var(--text-dim)]">
          {item.description}
        </span>
      </span>
      <span className="hidden items-center gap-1.5 font-mono text-[10px] text-[color:var(--text-dim)] sm:flex">
        {item.oauth ? (
          "OAuth"
        ) : (
          <>
            <Lock size={10} /> {item.fields?.length || 0} secrets
          </>
        )}
      </span>
      <span className="flex items-center gap-1 text-[11px] font-medium text-[color:var(--text-faint)] group-hover:text-[color:var(--text)]">
        <Plus size={13} /> Connect
      </span>
      <ChevronRight
        size={14}
        className="text-[color:var(--text-dim)] transition-transform group-hover:translate-x-0.5"
      />
    </button>
  );
}
