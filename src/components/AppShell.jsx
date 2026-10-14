import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  ChevronsLeft,
  ChevronsRight,
  Clock3,
  Home,
  Layers3,
  Package,
  Plus,
  Search,
  KeyRound,
  LogOut,
} from "lucide-react";
import PasskeySettings from "./PasskeySettings";
import CommandPalette from "./CommandPalette";
import { useLogout } from "../hooks/useQueryHooks";
import { STORAGE_KEYS } from "../lib/constants";
import { safeStorage } from "../lib/storage";

const item = ({ isActive }) =>
  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
    isActive
      ? "bg-white/[0.08] text-[color:var(--text)]"
      : "text-[color:var(--text-dim)] hover:bg-white/[0.05] hover:text-[color:var(--text)]"
  }`;

export default function AppShell({
  children,
  onNewProject,
  projectContext,
  activeSection,
  onSectionChange,
  onProjectAction,
}) {
  const [collapsed, setCollapsed] = useState(false);

  const [showPasskeys, setShowPasskeys] = useState(false);

  const [paletteOpen, setPaletteOpen] = useState(false);

  const logout = useLogout();

  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();

        setPaletteOpen((o) => !o);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const lastProjectId = safeStorage.read(STORAGE_KEYS.lastProjectId);

  return (
    <div className="flex h-screen overflow-hidden bg-obsidian text-[color:var(--text)]">
      <aside
        className={`flex h-full shrink-0 flex-col border-r border-[color:var(--border)] bg-[color:var(--surface)] transition-all duration-200 ${
          collapsed ? "w-[60px]" : "w-[220px]"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-[color:var(--border)] px-4">
          <button
            type="button"
            aria-label="Go to projects"
            onClick={() => {
              onNewProject?.();
              navigate("/");
            }}
            className="shrink-0 rounded-lg transition-transform hover:scale-[1.04] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/30"
          >
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <rect
                width="32"
                height="32"
                rx="8"
                fill="#fafafa"
                className="logo-mark-rect"
              />
              <path
                d="M8 20 L16 10 L24 20"
                className="logo-mark-path"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {!collapsed && (
            <>
              <span className="font-display text-[13px] font-semibold text-[color:var(--text)]">
                Subgrid
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-white/[0.04] px-1.5 text-[9px] font-medium text-[color:var(--text-dim)]">
                beta
              </span>
            </>
          )}
        </div>

        {!collapsed && (
          <div className="px-4 pb-3 pt-5 font-mono text-[9px] uppercase tracking-[0.16em] text-[color:var(--text-dim)]">
            {projectContext ? "Project" : "Workspace"}
          </div>
        )}
        {projectContext ? (
          <nav className="flex-1 space-y-1 overflow-y-auto px-2">
            <button
              type="button"
              onClick={() => onNewProject?.()}
              className="mb-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-[color:var(--text-dim)] hover:bg-white/[0.05] hover:text-[color:var(--text)]"
            >
              <ChevronsLeft size={14} /> {!collapsed && "All projects"}
            </button>
            {!collapsed && (
              <div className="mb-3 border-b border-[color:var(--border)] px-3 pb-4">
                <p className="truncate text-[13px] font-medium text-[color:var(--text)]">
                  {projectContext.name}
                </p>
              </div>
            )}
            <ProjectNavItem
              icon={Activity}
              label="Overview"
              active={activeSection === "overview"}
              collapsed={collapsed}
              onClick={() => onSectionChange?.("overview")}
            />
            <ProjectNavItem
              icon={Layers3}
              label="Components"
              active={activeSection === "components"}
              collapsed={collapsed}
              count={projectContext.componentCount}
              onClick={() => onSectionChange?.("components")}
            />
            <ProjectNavItem
              icon={Clock3}
              label="Audit log"
              active={activeSection === "runs"}
              collapsed={collapsed}
              count={projectContext.runCount}
              onClick={() => onSectionChange?.("runs")}
            />
          </nav>
        ) : (
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
            <NavLink to="/" end className={item}>
              <Home size={15} className="shrink-0" /> {!collapsed && "Projects"}
            </NavLink>
            <NavLink to="/products" className={item}>
              <Package size={15} className="shrink-0" />{" "}
              {!collapsed && "Components"}
            </NavLink>
          </nav>
        )}

        <div className="border-t border-[color:var(--border)] p-2">
          {!collapsed && (
            <button
              type="button"
              onClick={onNewProject}
              className="btn-primary mb-2 w-full justify-center"
            >
              <Plus size={14} /> New project
            </button>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-[color:var(--text-dim)] hover:bg-[color:var(--surface-sunken)] hover:text-[color:var(--text)]"
          >
            {collapsed ? (
              <ChevronsRight size={15} />
            ) : (
              <ChevronsLeft size={15} />
            )}{" "}
            {!collapsed && "Collapse"}
          </button>
          {!collapsed && (
            <>
              <button
                type="button"
                onClick={() => setShowPasskeys(true)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-[color:var(--text-dim)] hover:bg-[color:var(--surface-sunken)] hover:text-[color:var(--text)]"
              >
                <KeyRound size={15} /> Passkeys
              </button>
              <button
                type="button"
                onClick={() => logout.mutate()}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-[color:var(--text-dim)] hover:bg-[color:var(--surface-sunken)] hover:text-[color:var(--text)]"
              >
                <LogOut size={15} /> Sign out
              </button>
            </>
          )}
        </div>
      </aside>

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[color:var(--border)] bg-[color:var(--surface)]/85 px-5 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="well hidden items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] text-[color:var(--text-dim)] transition-colors hover:text-[color:var(--text)] md:flex"
          >
            <Search size={13} />
            <span>Search or jump to…</span>
            <kbd className="rounded border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-1 font-mono text-[10px]">
              ⌘K
            </kbd>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={projectContext ? onProjectAction : onNewProject}
              className="btn-primary !py-1.5"
            >
              <Plus size={13} /> {projectContext ? "Connect" : "Create"}
            </button>
          </div>
        </header>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-[color:var(--bg)]">
          {children}
        </div>
      </div>

      {showPasskeys && (
        <PasskeySettings onClose={() => setShowPasskeys(false)} />
      )}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        lastProjectId={lastProjectId}
      />
    </div>
  );
}

function ProjectNavItem({
  icon: Icon,
  label,
  active,
  collapsed,
  count,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors ${active ? "bg-white/[0.08] text-[color:var(--text)]" : "text-[color:var(--text-dim)] hover:bg-white/[0.05] hover:text-[color:var(--text)]"}`}
    >
      <Icon size={15} className="shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1">{label}</span>
          {typeof count === "number" && (
            <span className="font-mono text-[10px] text-[color:var(--text-dim)]">
              {count}
            </span>
          )}
        </>
      )}
    </button>
  );
}
