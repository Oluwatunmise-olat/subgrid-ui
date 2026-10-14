import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import {
  ArrowUpRight,
  Home,
  Package,
  PlugZap,
  Search,
  Sparkles,
} from "lucide-react";

import {
  useCatalog,
  useMcpServers,
  useProjects,
} from "../hooks/useQueryHooks";
import { brandFor } from "../lib/brand";

export default function CommandPalette({ open, onClose, lastProjectId }) {
  const navigate = useNavigate();

  const [q, setQ] = useState("");

  const { data: projects = [] } = useProjects();

  const { data: allServers = [] } = useMcpServers(undefined);

  const { data: catalog } = useCatalog();

  const integrations = catalog.integrations;

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  const doText = q.trim();

  const matchedProjects = useMemo(() => {
    if (!doText) return projects.slice(0, 4);

    const t = doText.toLowerCase();

    return projects
      .filter((p) => `${p.name} ${p.slug}`.toLowerCase().includes(t))
      .slice(0, 4);
  }, [projects, doText]);

  const matchedIntegrations = useMemo(() => {
    if (!doText) return integrations.slice(0, 4);

    const t = doText.toLowerCase();

    return integrations
      .filter((i) =>
        `${i.name} ${i.description} ${i.id}`.toLowerCase().includes(t),
      )
      .slice(0, 5);
  }, [integrations, doText]);

  const go = (to) => {
    onClose();

    navigate(to);
  };

  const direct = () => {
    if (!doText) return;

    onClose();

    if (lastProjectId) navigate(`/?intent=${encodeURIComponent(doText)}`);
    else if (projects[0]) navigate(`/?intent=${encodeURIComponent(doText)}`);
    else navigate("/");
  };

  if (!open) return null;

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-[60] bg-black/45 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-scale-in panel-solid mx-auto mt-[12vh] w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Command palette" className="flex flex-col">
          <div className="flex items-center gap-2 border-b border-[color:var(--border)] px-4 py-3">
            <Search
              size={14}
              className="shrink-0 text-[color:var(--text-faint)]"
            />
            <Command.Input
              autoFocus
              value={q}
              onValueChange={setQ}
              onKeyDown={(e) => {
                if (e.key === "Enter" && doText) direct();
                if (e.key === "Escape") onClose();
              }}
              placeholder='Type a command or "send email to…"'
              className="w-full bg-transparent text-[14px] text-[color:var(--text)] placeholder:text-[color:var(--text-faint)] focus:outline-none"
            />
            <kbd className="rounded border border-[color:var(--border)] bg-[color:var(--surface-sunken)] px-1.5 font-mono text-[10px] text-[color:var(--text-faint)]">
              esc
            </kbd>
          </div>

          <Command.List className="max-h-[50vh] overflow-y-auto p-2">
            {doText && (
              <button
                type="button"
                onClick={direct}
                className="flex w-full items-center gap-2.5 rounded-xl border border-[color:var(--brand)]/20 bg-[color:var(--brand-dim)] px-3 py-2.5 text-left transition-colors hover:bg-blue-100/70"
              >
                <Sparkles
                  size={14}
                  className="shrink-0 text-[color:var(--brand)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-[color:var(--text)]">
                    Direct the platform
                  </span>
                  <span className="block truncate text-[11.5px] text-[color:var(--text-dim)]">
                    "{doText}" → resolve tool, confirm, run
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[10px] text-[color:var(--text-faint)]">
                  ↵
                </span>
              </button>
            )}

            <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-faint)]">
              Go to
            </p>
            <PaletteRow icon={Home} label="Projects" onClick={() => go("/")} />
            <PaletteRow
              icon={Package}
              label="Components"
              onClick={() => go("/products")}
            />
            {matchedProjects.map((p) => (
              <PaletteRow
                key={p.id}
                icon={Home}
                label={`${p.name}`}
                hint={p.slug}
                onClick={() => go("/")}
              />
            ))}

            <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-faint)]">
              Connect
            </p>
            {matchedIntegrations.map((i) => {
              const { Icon } = brandFor(i.id);

              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => go(`/?connect=${i.id}`)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors hover:bg-[color:var(--surface-sunken)]"
                >
                  <span className="well flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                    <Icon
                      size={13}
                      strokeWidth={1.8}
                      className="text-[color:var(--text-dim)]"
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-[color:var(--text)]">
                    {i.name}
                  </span>
                  <PlugZap
                    size={12}
                    className="shrink-0 text-[color:var(--text-faint)]"
                  />
                </button>
              );
            })}

            {matchedIntegrations.length === 0 && (
              <p className="px-3 py-2 text-xs text-[color:var(--text-faint)]">
                No components match.
              </p>
            )}
          </Command.List>

          <div className="flex items-center justify-between border-t border-[color:var(--border)] px-4 py-2">
            <span className="text-[10.5px] text-[color:var(--text-faint)]">
              {allServers.length} components connected · {projects.length}{" "}
              projects
            </span>
            <span className="flex items-center gap-1 text-[10.5px] text-[color:var(--text-faint)]">
              Direct the platform <ArrowUpRight size={11} />
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}

function PaletteRow({ icon: Icon, label, hint, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors hover:bg-[color:var(--surface-sunken)]"
    >
      <Icon size={14} className="shrink-0 text-[color:var(--text-faint)]" />
      <span className="min-w-0 flex-1 truncate text-[13px] text-[color:var(--text)]">
        {label}
      </span>
      {hint && (
        <span className="shrink-0 font-mono text-[10px] text-[color:var(--text-faint)]">
          {hint}
        </span>
      )}
    </button>
  );
}
