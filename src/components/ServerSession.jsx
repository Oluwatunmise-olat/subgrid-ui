import { useState } from "react";
import { Command } from "cmdk";
import { History, Loader2, Search, Server, Wrench } from "lucide-react";

import ExecutionLog from "./ExecutionLog";

export default function ServerSession({ server, tools, isLoadingTools, logs, onRunTool }) {
  const [tab, setTab] = useState("tools");

  if (!server) {
    return (
      <div className="panel flex h-full flex-col items-center justify-center gap-2.5 p-12 text-center">
        <Server size={20} className="text-zinc-700" />
        <p className="text-sm text-zinc-500">Select a server on the left to see what it can do.</p>
      </div>
    );
  }

  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-900/80 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              server.health === "healthy"
                ? "bg-emerald-400 shadow-[0_0_6px_1px_rgba(52,211,153,0.45)]"
                : server.health === "unreachable"
                  ? "bg-rose-400"
                  : "bg-zinc-600"
            }`}
          />
          <span className="text-[13px] font-medium text-zinc-200">{server.name}</span>
        </div>

        <div className="flex items-center gap-1">
          <TabButton active={tab === "tools"} onClick={() => setTab("tools")} icon={Wrench} label="Tools" count={tools.length} />
          <TabButton active={tab === "history"} onClick={() => setTab("history")} icon={History} label="History" count={logs.length} />
        </div>
      </div>

      {tab === "tools" ? (
        <ToolBrowser tools={tools} isLoading={isLoadingTools} onRunTool={onRunTool} />
      ) : (
        <div className="flex-1 overflow-y-auto p-3">
          <ExecutionLog logs={logs} />
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? "bg-zinc-900 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      <Icon size={13} />
      {label}
      {count > 0 && <span className="text-zinc-600">{count}</span>}
    </button>
  );
}

function ToolBrowser({ tools, isLoading, onRunTool }) {
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 py-16 text-xs text-zinc-500">
        <Loader2 size={14} className="animate-spin" /> Listing tools...
      </div>
    );
  }

  if (!tools.length) {
    return <div className="flex-1 py-16 text-center text-xs text-zinc-600">No tools reported by this server.</div>;
  }

  return (
    <Command className="flex flex-1 flex-col overflow-hidden" filter={(value, search) => (value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}>
      <div className="flex items-center gap-2 border-b border-zinc-900/80 px-3.5 py-2.5">
        <Search size={14} className="shrink-0 text-zinc-600" />
        <Command.Input
          placeholder="Search tools..."
          className="w-full bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
        />
      </div>

      <Command.List className="flex-1 overflow-y-auto p-2">
        <Command.Empty className="py-10 text-center text-xs text-zinc-600">No tools match that search.</Command.Empty>

        {tools.map((tool) => (
          <Command.Item
            key={tool.name}
            value={`${tool.name} ${tool.description || ""}`}
            onSelect={() => onRunTool(tool)}
            className="flex cursor-pointer items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors data-[selected=true]:bg-zinc-900/70"
          >
            <Wrench size={13} className="mt-0.5 shrink-0 text-zinc-600" />
            <div className="min-w-0 flex-1">
              <div className="font-mono text-xs text-zinc-200">{tool.name}</div>
              {tool.description && <div className="mt-0.5 truncate text-[11px] text-zinc-500">{tool.description}</div>}
            </div>
          </Command.Item>
        ))}
      </Command.List>
    </Command>
  );
}
