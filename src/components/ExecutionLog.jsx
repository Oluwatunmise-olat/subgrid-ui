import { useState } from "react";
import { AlertTriangle, ChevronDown, Clock, Terminal } from "lucide-react";

import { toolResultSummary, toolResultText } from "../lib/toolResult";
import { brandFor } from "../lib/brand";

const STATUS_BADGE = {
  succeeded: {
    label: "Succeeded",
    className: "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-400",
  },
  failed: {
    label: "Failed",
    className: "border-rose-400/25 bg-rose-400/[0.08] text-rose-400",
  },
  pending_approval: {
    label: "Awaiting approval",
    className: "border-amber-400/25 bg-amber-400/[0.08] text-amber-400",
  },
  approved: {
    label: "Approved",
    className: "border-amber-400/25 bg-amber-400/[0.08] text-amber-400",
  },
  rejected: {
    label: "Rejected",
    className: "border-rose-400/25 bg-rose-400/[0.08] text-rose-400",
  },
};

export default function ExecutionLog({ logs, servers = [] }) {
  if (!logs.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
        <Terminal size={16} className="text-[color:var(--text-faint)]" />
        <p className="text-xs text-[color:var(--text-faint)]">
          Tool calls will show up here as you run them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <ExecutionLogRow
          key={log.id}
          log={log}
          serverName={servers.find((s) => s.id === log.mcp_server_id)?.name}
        />
      ))}
    </div>
  );
}

function ExecutionLogRow({ log, serverName }) {
  const [open, setOpen] = useState(false);

  const badge = STATUS_BADGE[log.status] || STATUS_BADGE.succeeded;

  return (
    <div className="animate-fade-up panel px-3.5 py-3">
      <div className="flex items-center gap-2.5">
        {serverName && (
          <span className="well flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
            {(() => {
              const { Icon } = brandFor(serverName);

              return (
                <Icon
                  size={11}
                  strokeWidth={1.8}
                  className="text-[color:var(--text-dim)]"
                />
              );
            })()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <span className="block truncate font-mono text-[12px] text-[color:var(--text)]">
            {log.tool_name}
          </span>
          {serverName && (
            <span className="block truncate text-[10.5px] text-[color:var(--text-faint)]">
              {serverName}
            </span>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
        <span className="shrink-0 font-mono text-[10px] text-[color:var(--text-faint)]">
          {new Date(log.created_at).toLocaleTimeString()}
        </span>
      </div>

      {log.error && (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-rose-400/25 bg-rose-400/[0.05] px-2.5 py-2 text-[11px] leading-relaxed text-rose-400">
          <AlertTriangle size={11} className="mt-0.5 shrink-0" /> {log.error}
        </div>
      )}

      {log.status === "pending_approval" && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-400">
          <Clock size={11} /> Waiting on approval before this runs.
        </div>
      )}

      {log.status === "succeeded" && log.output && (
        <p className="mt-1.5 truncate text-[11px] text-[color:var(--text-dim)]">
          {toolResultSummary(log.output)}
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-1.5 flex items-center gap-1 text-[11px] text-[color:var(--text-faint)] transition-colors hover:text-[color:var(--text-dim)]"
      >
        <ChevronDown
          size={11}
          className={`transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
        />
        {open ? "Hide details" : "View details"}
      </button>

      {open && (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div>
            <p className="mb-1 font-mono text-[9px] uppercase tracking-wide text-[color:var(--text-dim)]">
              Input
            </p>
            <pre className="well max-h-36 overflow-auto p-2.5 font-mono text-[10px] leading-relaxed text-[color:var(--text-dim)]">
              {JSON.stringify(log.input || {}, null, 2)}
            </pre>
          </div>
          <div>
            <p className="mb-1 font-mono text-[9px] uppercase tracking-wide text-[color:var(--text-dim)]">
              Result
            </p>
            <pre className="well max-h-36 overflow-auto p-2.5 font-mono text-[10px] leading-relaxed text-[color:var(--text-dim)]">
              {toolResultText(log.output)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
