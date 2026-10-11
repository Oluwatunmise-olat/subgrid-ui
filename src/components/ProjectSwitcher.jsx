import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";

export default function ProjectSwitcher({ projects, activeProjectId, onSelect, onCreateNew }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const active = projects.find((project) => project.id === activeProjectId);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-zinc-200 transition-colors hover:bg-zinc-900"
      >
        {active?.name || "Select project"}
        <ChevronDown size={12} className={`text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="animate-scale-in absolute left-0 top-full z-20 mt-1.5 w-52 rounded-xl border border-zinc-800 bg-zinc-950 p-1 shadow-2xl shadow-black/50">
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => {
                onSelect(project.id);
                setOpen(false);
              }}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                project.id === activeProjectId ? "bg-zinc-900 text-zinc-100" : "text-zinc-400 hover:bg-zinc-900"
              }`}
            >
              {project.name}
            </button>
          ))}

          <div className="my-1 border-t border-zinc-900" />

          <button
            type="button"
            onClick={() => {
              onCreateNew();
              setOpen(false);
            }}
            className="flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-left text-xs text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
          >
            <Plus size={12} /> New project
          </button>
        </div>
      )}
    </div>
  );
}
