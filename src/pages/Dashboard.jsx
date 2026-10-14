import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ChevronRight,
  CircleAlert,
  Layers3,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Wrench,
  X,
} from "lucide-react";

import AppShell from "../components/AppShell";
import AddServerDialog from "../components/AddServerDialog";
import EditServerDialog from "../components/EditServerDialog";
import ComponentAccess from "../components/ComponentAccess";
import ToolRunDialog from "../components/ToolRunDialog";
import ExecutionLog from "../components/ExecutionLog";
import ChatThread from "../components/ChatThread";
import CollapsibleSection from "../components/CollapsibleSection";
import { CATEGORIES } from "../lib/integrations";
import { DESTRUCTIVE_TOOL_KEYWORDS } from "../lib/constants";
import { brandFor } from "../lib/brand";
import {
  useActionHistory,
  useCallTool,
  useCheckServerHealth,
  useMcpServers,
  useRegisterServer,
  useRemoveServer,
  useUpdateServer,
  useServerToolAccess,
} from "../hooks/useQueryHooks";

const FIRST_COMPONENT = { name: "your first component" };

export default function Dashboard({
  projects,
  activeProjectId,
  onBackToProjects,
}) {
  const [tab, setTab] = useState("overview");

  const [selectedServerId, setSelectedServerId] = useState(null);

  const [showAddServer, setShowAddServer] = useState(false);

  const [presetIntegrationId, setPresetIntegrationId] = useState(null);

  const [checkingIds, setCheckingIds] = useState([]);

  const [activeTool, setActiveTool] = useState(null);

  const [editingServer, setEditingServer] = useState(null);

  const [intentSeed, setIntentSeed] = useState("");

  const [query, setQuery] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();

  const { data: servers = [], refetch: refetchServers } =
    useMcpServers(activeProjectId);

  const {
    tools,
    stale: toolsStale,
    staleSince: toolsStaleSince,
    staleError: toolsStaleError,
    toolFilter,
    approvalPolicy,
    approvedTools,
    isLoading: isLoadingTools,
    error: toolsError,
    refetch: refetchTools,
  } = useServerToolAccess(selectedServerId);

  const toolAccess = {
    stale: toolsStale,
    staleSince: toolsStaleSince,
    staleError: toolsStaleError,
    toolFilter,
    approvalPolicy,
    approvedTools,
  };

  const { data: serverLogs = [] } = useActionHistory(
    selectedServerId,
    activeProjectId,
  );

  const { data: projectLogs = [] } = useActionHistory(
    undefined,
    activeProjectId,
  );

  const registerServer = useRegisterServer();

  const removeServer = useRemoveServer();

  const updateServer = useUpdateServer();

  const checkHealth = useCheckServerHealth();

  const callTool = useCallTool();

  const project = projects.find((item) => item.id === activeProjectId);

  const selectedServer = servers.find((item) => item.id === selectedServerId);

  const nextIntegration = servers.length ? null : FIRST_COMPONENT;

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase();

    const visible = term
      ? servers.filter((item) =>
          `${item.name} ${item.provider || ""}`.toLowerCase().includes(term),
        )
      : servers;

    return Object.entries(CATEGORIES)
      .map(([id, label]) => ({
        id,
        label,
        items: visible.filter((item) => (item.category || "other") === id),
      }))
      .filter((group) => group.items.length);
  }, [servers, query]);

  useEffect(() => {
    const connect = searchParams.get("connect");

    const intent = searchParams.get("intent");

    const oauth = searchParams.get("oauth");

    const oauthError = searchParams.get("oauth_error");

    if (connect) {
      setPresetIntegrationId(connect);

      setShowAddServer(true);
    }

    if (intent) setIntentSeed(intent);

    if (oauth === "connected") {
      toast.success("Component connected");

      if (searchParams.get("server_id"))
        setSelectedServerId(searchParams.get("server_id"));
    }

    if (oauthError) toast.error(oauthError);

    if (connect || intent || oauth || oauthError)
      setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const openConnect = (integrationId = null) => {
    setPresetIntegrationId(integrationId);

    setShowAddServer(true);
  };

  const saveToolAccess = async (payload) => {
    if (!selectedServerId) return;

    try {
      await updateServer.mutateAsync({ serverId: selectedServerId, payload });

      toast.success("Access updated");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRegisterServer = async (payload) => {
    try {
      const response = await registerServer.mutateAsync(payload);

      const created = response?.data?.server;

      toast.success(`${payload.name} is connected`);

      setShowAddServer(false);

      setPresetIntegrationId(null);

      if (created) {
        setSelectedServerId(created.id);

        setTab("components");
      }

      return created;
    } catch (error) {
      toast.error(error.message);

      return null;
    }
  };

  const runHealth = (ids) => {
    setCheckingIds(ids);

    let pending = ids.length;

    ids.forEach((id) =>
      checkHealth.mutate(id, {
        onSettled: () => {
          pending -= 1;

          if (!pending) {
            setCheckingIds([]);

            refetchServers();

            refetchTools();
          }
        },
        onSuccess: (response) => {
          if (response?.data?.health !== "healthy")
            toast.error(
              `${servers.find((item) => item.id === id)?.name || "Component"} is unreachable`,
            );
        },
      }),
    );
  };

  const handleUpdateServer = async ({ name, env, approval_token }) => {
    try {
      await updateServer.mutateAsync({
        serverId: editingServer.id,
        payload: { name, env, approval_token },
      });

      toast.success("Component updated");

      setEditingServer(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const removeServerById = (id) =>
    removeServer.mutate(id, {
      onSuccess: () => {
        toast.success("Component removed");

        if (selectedServerId === id) setSelectedServerId(null);
      },
      onError: (error) => toast.error(error.message),
    });

  const openTool = (tool) =>
    setActiveTool({
      ...tool,
      requiresApproval: DESTRUCTIVE_TOOL_KEYWORDS.some((key) =>
        tool.name.toLowerCase().includes(key),
      ),
    });

  return (
    <AppShell
      onNewProject={onBackToProjects}
      onProjectAction={() => openConnect()}
      projectContext={{
        ...project,
        componentCount: servers.length,
        runCount: projectLogs.length,
      }}
      activeSection={tab}
      onSectionChange={setTab}
    >
      <div className="flex h-full w-full flex-col">
        {tab === "overview" && (
          <Overview
            project={project}
            servers={servers}
            logs={projectLogs}
            intentSeed={intentSeed}
            onConnectExecution={() => openConnect()}
            onComponents={() => setTab("components")}
            onBackToProjects={onBackToProjects}
          />
        )}

        {tab === "components" && (
          <ComponentsView
            servers={servers}
            selectedServerId={selectedServerId}
            selectedServer={selectedServer}
            tools={tools}
            access={toolAccess}
            onUpdateAccess={saveToolAccess}
            savingAccess={updateServer.isPending}
            serverLogs={serverLogs}
            isLoadingTools={isLoadingTools}
            toolsError={toolsError}
            checkingIds={checkingIds}
            query={query}
            setQuery={setQuery}
            groups={groups}
            nextIntegration={nextIntegration}
            onSelect={(id) =>
              setSelectedServerId(id === selectedServerId ? null : id)
            }
            onCheck={runHealth}
            onRemove={removeServerById}
            onOpenTool={openTool}
            onConnect={() => openConnect()}
            onEdit={(server) => setEditingServer(server)}
          />
        )}

        {tab === "runs" && (
          <RunsView
            logs={projectLogs}
            servers={servers}
            scope={project?.slug}
          />
        )}
      </div>

      {showAddServer && (
        <AddServerDialog
          projectId={activeProjectId}
          initialIntegrationId={presetIntegrationId}
          existingServers={servers}
          onClose={() => {
            setShowAddServer(false);
            setPresetIntegrationId(null);
          }}
          onSubmit={handleRegisterServer}
          isSubmitting={registerServer.isPending}
        />
      )}
      {editingServer && (
        <EditServerDialog
          server={editingServer}
          onClose={() => setEditingServer(null)}
          onSubmit={handleUpdateServer}
          isSubmitting={updateServer.isPending}
        />
      )}

      {activeTool && (
        <ToolRunDialog
          tool={{ ...activeTool, serverName: selectedServer?.name }}
          onClose={() => setActiveTool(null)}
          onRun={({ toolName, input, approved }) =>
            callTool.mutate(
              { serverId: selectedServerId, toolName, input, approved },
              {
                onSuccess: (response) => {
                  if (response?.data?.requires_approval)
                    toast("This action needs explicit approval", {
                      icon: "⚠️",
                    });
                  else {
                    toast.success("Tool executed");

                    setActiveTool(null);
                  }
                },
                onError: (error) => toast.error(error.message),
              },
            )
          }
          isRunning={callTool.isPending}
        />
      )}
    </AppShell>
  );
}

function Overview({
  project,
  servers,
  logs,
  intentSeed,
  onConnectExecution,
  onComponents,
  onBackToProjects,
}) {
  const healthy = servers.filter((s) => s.health === "healthy").length;

  const runs7d = logs.filter(
    (l) => Date.now() - new Date(l.created_at).getTime() < 7 * 864e5,
  ).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--border)] px-5 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={onBackToProjects}
            title="Back to projects"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[color:var(--text-dim)] transition-colors hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--text)]"
          >
            <ArrowLeft size={15} />
          </button>
          <h1 className="truncate font-display text-[14px] font-semibold tracking-tight text-[color:var(--text)]">
            {project?.name || "Project"}
          </h1>
          <span className="hidden font-mono text-[11px] text-[color:var(--text-faint)] sm:block">
            {servers.length} components · {healthy}/{servers.length} healthy ·{" "}
            {runs7d} runs/7d
          </span>
        </div>
        <button
          type="button"
          onClick={onBackToProjects}
          className="text-[12px] font-medium text-[color:var(--text-dim)] transition-colors hover:text-[color:var(--text)]"
        >
          View all projects
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <ChatThread
          key={intentSeed}
          projectId={project?.id}
          projectName={project?.name}
          servers={servers}
          seedText={intentSeed}
          onOpenComponents={onComponents}
          onConnectExecution={onConnectExecution}
        />
      </div>
    </div>
  );
}

function ComponentsView({
  servers,
  selectedServerId,
  selectedServer,
  tools,
  access,
  onUpdateAccess,
  savingAccess,
  serverLogs,
  isLoadingTools,
  toolsError,
  checkingIds,
  query,
  setQuery,
  groups,
  nextIntegration,
  onSelect,
  onCheck,
  onRemove,
  onOpenTool,
  onConnect,
  onEdit,
}) {
  return (
    <section className="animate-fade-up mx-auto w-full max-w-[1200px] px-5 py-8 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">Project components</p>
          <h1 className="font-display text-2xl font-semibold text-[color:var(--text)]">
            Components
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="well flex min-w-[220px] items-center gap-2 rounded-lg px-3 py-2">
            <Search size={14} className="text-[color:var(--text-dim)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter components"
              className="w-full bg-transparent text-[12.5px] text-[color:var(--text)] placeholder:text-[color:var(--text-faint)] focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => onCheck(servers.map((item) => item.id))}
            disabled={checkingIds.length > 0 || !servers.length}
            className="btn-ghost !py-2"
          >
            <RefreshCcw
              size={13}
              className={checkingIds.length ? "animate-spin" : ""}
            />{" "}
            Check all
          </button>
        </div>
      </div>

      {!servers.length ? (
        <EmptyState
          onConnect={() => onConnect(nextIntegration?.id)}
          name={nextIntegration?.name}
        />
      ) : (
        <div
          className={`grid gap-5 ${selectedServer ? "xl:grid-cols-[minmax(0,1fr)_410px]" : ""}`}
        >
          <div className="space-y-3">
            {groups.map((group) => (
              <ComponentGroup
                key={group.id}
                {...group}
                selectedServerId={selectedServerId}
                onSelect={onSelect}
              />
            ))}

            {!groups.length && (
              <p className="py-16 text-center text-xs text-[color:var(--text-dim)]">
                No components match “{query}”.
              </p>
            )}
          </div>
          {selectedServer && (
            <ComponentDetail
              server={selectedServer}
              tools={tools}
              access={access}
              onUpdateAccess={onUpdateAccess}
              savingAccess={savingAccess}
              logs={serverLogs}
              isLoadingTools={isLoadingTools}
              toolsError={toolsError}
              checking={checkingIds.includes(selectedServer.id)}
              onCheck={() => onCheck([selectedServer.id])}
              onRemove={() => onRemove(selectedServer.id)}
              onClose={() => onSelect(selectedServer.id)}
              onRunTool={onOpenTool}
              onEdit={() => onEdit(selectedServer)}
            />
          )}
        </div>
      )}
    </section>
  );
}

function RunsView({ logs, servers, scope }) {
  return (
    <section className="animate-fade-up mx-auto w-full max-w-[1200px] px-5 py-8 lg:px-8">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="eyebrow mb-1">Immutable activity</p>
          <h1 className="font-display text-2xl font-semibold text-[color:var(--text)]">
            Audit log
          </h1>
          {scope && (
            <p className="mt-1 font-mono text-[11px] text-[color:var(--text-faint)]">
              scoped to {scope}
            </p>
          )}
        </div>
        <span className="font-mono text-[11px] text-[color:var(--text-dim)]">
          {logs.length} events
        </span>
      </div>
      {logs.length ? (
        <ExecutionLog logs={logs} servers={servers} />
      ) : (
        <EmptyState
          title="No runs yet"
          copy="Plans and direct tool calls will appear here with their inputs, outputs, and approval state."
        />
      )}
    </section>
  );
}

function ComponentGroup({ id, label, items, selectedServerId, onSelect }) {
  return (
    <CollapsibleSection
      id={`components-${id}`}
      title={label}
      count={items.length}
      defaultOpen
    >
      <div className="panel overflow-hidden p-0">
        {items.map((server, index) => {
          const { Icon } = brandFor(server.provider);

          const selected = selectedServerId === server.id;

          return (
            <button
              key={server.id}
              type="button"
              onClick={() => onSelect(server.id)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${index ? "border-t border-[color:var(--border)]" : ""} ${selected ? "bg-[color:var(--surface-sunken)]" : "hover:bg-[color:var(--surface-sunken)]"}`}
            >
              <span className="well flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                <Icon size={14} className="text-[color:var(--text-dim)]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-[color:var(--text)]">
                  {server.name}
                </span>
                <span className="block font-mono text-[10px] text-[color:var(--text-dim)]">
                  {server.transport} · {server.provider || "custom"}
                </span>
              </span>
              <Status health={server.health} />
              <ChevronRight
                size={14}
                className={`text-[color:var(--text-faint)] transition-transform ${selected ? "rotate-90" : ""}`}
              />
            </button>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}

function ComponentDetail({
  server,
  tools,
  access,
  onUpdateAccess,
  savingAccess,
  logs,
  isLoadingTools,
  toolsError,
  checking,
  onCheck,
  onRemove,
  onClose,
  onRunTool,
  onEdit,
}) {
  const [tab, setTab] = useState("tools");

  const [query, setQuery] = useState("");

  const { Icon } = brandFor(server.provider);

  const filtered = tools.filter(
    (tool) =>
      !query.trim() ||
      `${tool.name} ${tool.description || ""}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );

  return (
    <aside className="animate-fade-up panel h-fit overflow-hidden p-0 xl:sticky xl:top-24">
      <div className="flex items-start gap-3 border-b border-[color:var(--border)] p-4">
        <span className="well flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <Icon size={16} className="text-[color:var(--text-dim)]" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[14px] font-semibold text-[color:var(--text)]">
            {server.name}
          </h3>
          <p className="mt-0.5 font-mono text-[10px] text-[color:var(--text-dim)]">
            {server.transport} · {server.health}
            {server.last_health_check_at
              ? ` · ${timeAgo(server.last_health_check_at)}`
              : ""}
          </p>
        </div>
        <button
          type="button"
          title="Edit component"
          onClick={onEdit}
          className="rounded-lg p-1.5 text-[color:var(--text-dim)] hover:bg-[color:var(--surface-sunken)] hover:text-[color:var(--text)]"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          title="Retry health check"
          onClick={onCheck}
          disabled={checking}
          className="rounded-lg p-1.5 text-[color:var(--text-dim)] hover:bg-[color:var(--surface-sunken)] hover:text-[color:var(--text)]"
        >
          <RefreshCcw size={14} className={checking ? "animate-spin" : ""} />
        </button>
        <button
          type="button"
          title="Remove component"
          onClick={onRemove}
          className="rounded-lg p-1.5 text-[color:var(--text-dim)] hover:bg-rose-500/10 hover:text-rose-400"
        >
          <Trash2 size={14} />
        </button>
        <button
          type="button"
          title="Close"
          onClick={onClose}
          className="rounded-lg p-1.5 text-[color:var(--text-dim)] hover:bg-[color:var(--surface-sunken)] hover:text-[color:var(--text)]"
        >
          <X size={14} />
        </button>
      </div>

      {server.health === "unreachable" && (
        <div className="flex gap-2 border-b border-rose-500/20 bg-rose-500/10 p-4 text-[11px] leading-relaxed text-rose-400">
          <CircleAlert size={14} className="mt-0.5 shrink-0" />
          <span>
            {server.last_error ||
              toolsError?.message ||
              "Component could not be reached."}
            <br />
            <strong className="font-medium">
              Check the credentials or endpoint, then retry.
            </strong>
          </span>
        </div>
      )}

      {access?.stale && server.health !== "unreachable" && (
        <div className="flex gap-2 border-b border-amber-400/20 bg-amber-400/[0.07] p-3 text-[11px] leading-relaxed text-amber-300">
          <CircleAlert size={13} className="mt-0.5 shrink-0" />
          <span>
            Unreachable right now — showing its{" "}
            <strong className="font-medium">last known tools</strong>. Retrying
            automatically.
          </span>
        </div>
      )}

      <div className="flex gap-1 border-b border-[color:var(--border)] p-2">
        <button
          type="button"
          onClick={() => setTab("tools")}
          className={`rounded-md px-2.5 py-1.5 text-[11.5px] font-medium ${tab === "tools" ? "bg-[color:var(--surface-sunken)] text-[color:var(--text)]" : "text-[color:var(--text-dim)]"}`}
        >
          Tools{" "}
          <span className="font-mono text-[10px] text-[color:var(--text-faint)]">
            {tools.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTab("access")}
          className={`rounded-md px-2.5 py-1.5 text-[11.5px] font-medium ${tab === "access" ? "bg-[color:var(--surface-sunken)] text-[color:var(--text)]" : "text-[color:var(--text-dim)]"}`}
        >
          Access
          {access?.approvedTools?.length ? (
            <span className="ml-1 font-mono text-[10px] text-[color:var(--text-faint)]">
              {access.approvedTools.length}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setTab("history")}
          className={`rounded-md px-2.5 py-1.5 text-[11.5px] font-medium ${tab === "history" ? "bg-[color:var(--surface-sunken)] text-[color:var(--text)]" : "text-[color:var(--text-dim)]"}`}
        >
          History{" "}
          <span className="font-mono text-[10px] text-[color:var(--text-faint)]">
            {logs.length}
          </span>
        </button>
      </div>

      {tab === "access" ? (
        <ComponentAccess
          server={server}
          access={access}
          onSave={onUpdateAccess}
          saving={savingAccess}
        />
      ) : tab === "tools" ? (
        <>
          <div className="flex items-center gap-2 border-b border-[color:var(--border)] px-4 py-3">
            <Search size={13} className="text-[color:var(--text-dim)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search live tools"
              className="w-full bg-transparent text-[12px] text-[color:var(--text)] placeholder:text-[color:var(--text-faint)] focus:outline-none"
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto p-2">
            {isLoadingTools && (
              <p className="px-3 py-8 text-center text-[11px] text-[color:var(--text-dim)]">
                Discovering tools from this component…
              </p>
            )}
            {!isLoadingTools && !filtered.length && (
              <p className="px-3 py-8 text-center text-[11px] text-[color:var(--text-dim)]">
                {tools.length
                  ? "No tools match this search."
                  : "No tools reported by this component."}
              </p>
            )}
            {filtered.map((tool) => (
              <button
                key={tool.name}
                type="button"
                onClick={() => onRunTool(tool)}
                className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left hover:bg-[color:var(--surface-sunken)]"
              >
                <Wrench
                  size={13}
                  className="mt-0.5 shrink-0 text-[color:var(--text-dim)]"
                />
                <span className="min-w-0">
                  <span className="block truncate font-mono text-[11.5px] text-[color:var(--text)]">
                    {tool.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[10.5px] text-[color:var(--text-dim)]">
                    {tool.description || "No description provided"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="max-h-[420px] overflow-y-auto p-3">
          {logs.length ? (
            <ExecutionLog logs={logs} servers={[server]} />
          ) : (
            <p className="py-8 text-center text-[11px] text-[color:var(--text-dim)]">
              No calls on this component yet.
            </p>
          )}
        </div>
      )}
    </aside>
  );
}

function Status({ health }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-[10px] text-[color:var(--text-dim)]">
      <span
        className={`h-1.5 w-1.5 rounded-full ${health === "healthy" ? "bg-emerald-500" : health === "unreachable" ? "bg-rose-500" : "bg-[color:var(--text-faint)]"}`}
      />
      {health}
    </span>
  );
}

function EmptyState({
  title = "No components connected",
  copy = "Connect an MCP component to make this project executable.",
  name,
  onConnect,
}) {
  return (
    <div className="panel flex min-h-[240px] flex-col items-center justify-center p-8 text-center">
      <div className="well mb-4 flex h-10 w-10 items-center justify-center rounded-lg">
        <Layers3 size={17} className="text-[color:var(--text-faint)]" />
      </div>
      <h3 className="text-[14px] font-semibold text-[color:var(--text)]">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-[12px] leading-relaxed text-[color:var(--text-dim)]">
        {copy}
      </p>
      {onConnect && (
        <button type="button" onClick={onConnect} className="btn-primary mt-4">
          <Plus size={13} /> Connect {name || "component"}
        </button>
      )}
    </div>
  );
}

function timeAgo(iso) {
  const seconds = Math.max(
    1,
    Math.floor((Date.now() - new Date(iso).getTime()) / 1000),
  );

  if (seconds < 60) return `${seconds}s`;

  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;

  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;

  return `${Math.floor(seconds / 86400)}d`;
}

export { timeAgo as timeAgoString };
