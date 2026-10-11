import { AlertTriangle, CheckCircle2, Clock, Terminal, XCircle } from "lucide-react";

const STATUS_META = {
  succeeded: { icon: CheckCircle2, color: "text-emerald-400" },
  pending_approval: { icon: Clock, color: "text-amber-400" },
  approved: { icon: Clock, color: "text-amber-400" },
  failed: { icon: XCircle, color: "text-rose-400" },
  rejected: { icon: AlertTriangle, color: "text-rose-400" },
};

export default function ExecutionLog({ logs }) {
  if (!logs.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
        <Terminal size={16} className="text-zinc-700" />
        <p className="text-xs text-zinc-600">Tool calls will show up here as you run them.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const meta = STATUS_META[log.status] || STATUS_META.succeeded;
        const Icon = meta.icon;

        return (
          <div key={log.id} className="animate-fade-up rounded-xl border border-zinc-900 bg-zinc-950/40 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Icon size={13} className={meta.color} />
              <span className="font-mono text-xs text-zinc-200">{log.tool_name}</span>
              <span className="ml-auto font-mono text-[10px] text-zinc-700">
                {new Date(log.created_at).toLocaleTimeString()}
              </span>
            </div>

            {log.error && <div className="mt-1.5 text-[11px] leading-relaxed text-rose-400">{log.error}</div>}

            {log.status === "pending_approval" && (
              <div className="mt-1.5 text-[11px] text-amber-400">Waiting on approval before this runs.</div>
            )}

            <details className="mt-1.5 group">
              <summary className="cursor-pointer text-[11px] text-zinc-600 transition-colors hover:text-zinc-400">
                input/output
              </summary>
              <pre className="mt-1.5 max-h-40 overflow-auto rounded-lg border border-zinc-900 bg-black/40 p-2.5 font-mono text-[10px] leading-relaxed text-zinc-400">
                {JSON.stringify({ input: log.input, output: log.output }, null, 2)}
              </pre>
            </details>
          </div>
        );
      })}
    </div>
  );
}
