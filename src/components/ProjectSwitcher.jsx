import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";

export default function ProjectSwitcher({
  projects,
  activeProjectId,
  onSelect,
  onCreateNew,
}) {
  const [open, setOpen] = useState(false);

  const rootRef = useRef(null);

  const active = projects.find((project) => project.id === activeProjectId);

  useEffect(() => {
    if (!open) return;

    const handleClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target))
        setOpen(false);
    };

    document.addEventListener("mousedown", handleClick);

    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-hover)]"
      >
        {active?.name || "Select project"}
        <ChevronDown
          size={12}
          className={`text-[color:var(--text-faint)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="animate-scale-in panel-solid absolute left-0 top-full z-20 mt-1.5 w-52 p-1">
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => {
                onSelect(project.id);
                setOpen(false);
              }}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                project.id === activeProjectId
                  ? "bg-[color:var(--surface-hover)] text-[color:var(--text)]"
                  : "text-[color:var(--text-dim)] hover:bg-[color:var(--surface-sunken)]"
              }`}
            >
              {project.name}
            </button>
          ))}

          <div className="my-1 border-t border-[color:var(--border)]" />

          <button
            type="button"
            onClick={() => {
              onCreateNew();
              setOpen(false);
            }}
            className="flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-left text-xs text-[color:var(--text-dim)] transition-colors hover:bg-[color:var(--surface-sunken)] hover:text-[color:var(--text)]"
          >
            <Plus size={12} /> New project
          </button>
        </div>
      )}
    </div>
  );
}
