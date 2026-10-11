import { Plus, RefreshCcw, Server, Trash2 } from "lucide-react";

import { CATEGORIES } from "../lib/integrations";

const healthDot = {
  healthy: "bg-emerald-400 shadow-[0_0_6px_1px_rgba(52,211,153,0.45)]",
  unreachable: "bg-rose-400",
  unknown: "bg-zinc-600",
};

export default function ResourceInspector({
  servers,
  selectedServerId,
  onSelectServer,
  onAddServer,
  onRemoveServer,
  onCheckHealth,
  isCheckingHealth,
}) {
  const grouped = Object.keys(CATEGORIES)
    .map((category) => ({ category, items: servers.filter((s) => (s.category || "other") === category) }))
    .filter((group) => group.items.length);

  return (
    <div className="panel flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-900/80 px-4 py-3">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Components</h2>
        <button
          type="button"
          onClick={onAddServer}
          title="Connect a component"
          className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {servers.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
            <Server size={18} className="text-zinc-700" />
            <p className="text-xs text-zinc-600">No components yet</p>
            <button
              type="button"
              onClick={onAddServer}
              className="mt-1 text-xs text-zinc-400 underline decoration-zinc-700 underline-offset-2 hover:text-zinc-200"
            >
              Connect one
            </button>
          </div>
        )}

        {grouped.map(({ category, items }) => (
          <div key={category} className="mb-3 last:mb-0">
            <h4 className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-zinc-700">
              {CATEGORIES[category]}
            </h4>

            {items.map((server) => (
              <button
                key={server.id}
                type="button"
                onClick={() => onSelectServer(server.id)}
                className={`group mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                  selectedServerId === server.id ? "bg-zinc-900/90 ring-1 ring-inset ring-zinc-800" : "hover:bg-zinc-900/50"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${healthDot[server.health] || healthDot.unknown}`} />
                  <div className="min-w-0">
                    <div className="truncate text-[13px] text-zinc-200">{server.name}</div>
                    <div className="font-mono text-[10px] text-zinc-600">{server.transport}</div>
                  </div>
                </div>

                <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCheckHealth(server.id);
                    }}
                    title="Check health"
                    className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                  >
                    <RefreshCcw size={12} className={isCheckingHealth === server.id ? "animate-spin" : ""} />
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveServer(server.id);
                    }}
                    title="Remove"
                    className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-rose-950 hover:text-rose-400"
                  >
                    <Trash2 size={12} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
