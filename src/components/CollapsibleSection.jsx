import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { STORAGE_KEYS } from "../lib/constants";

import { safeStorage } from "../lib/storage";

export default function CollapsibleSection({
  id,
  title,
  hint,
  count,
  right,
  defaultOpen = true,
  children,
}) {
  const [open, setOpen] = useState(() => {
    const raw = safeStorage.read(STORAGE_KEYS.collapsedSection(id));

    if (raw === null) return defaultOpen;

    return raw !== "1";
  });

  const toggle = () => {
    setOpen((o) => {
      safeStorage.write(STORAGE_KEYS.collapsedSection(id), o ? "1" : "0");

      return !o;
    });
  };

  return (
    <section>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="group flex w-full items-center gap-2.5 py-2 text-left"
      >
        <ChevronDown
          size={14}
          className={`shrink-0 text-[color:var(--text-faint)] transition-transform duration-300 ${open ? "" : "-rotate-90"}`}
        />
        <span className="text-[13px] font-semibold text-[color:var(--text)] transition-colors group-hover:text-[color:var(--text)]">
          {title}
        </span>
        {typeof count === "number" && (
          <span className="rounded-full bg-[color:var(--surface-hover)] px-1.5 py-px font-mono text-[10px] tabular-nums text-[color:var(--text-dim)]">
            {count}
          </span>
        )}
        {hint && (
          <span className="hidden truncate text-[11px] text-[color:var(--text-faint)] md:block">
            — {hint}
          </span>
        )}
        <span className="ml-auto">{right}</span>
      </button>
      <div className={`collapse-grid ${open ? "" : "closed"}`}>
        <div>{children}</div>
      </div>
    </section>
  );
}
