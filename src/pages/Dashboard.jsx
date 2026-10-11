import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import StarfieldBackground from "../components/StarfieldBackground";
import TopNav from "../components/TopNav";
import ProjectSwitcher from "../components/ProjectSwitcher";
import ResourceInspector from "../components/ResourceInspector";
import AddServerDialog from "../components/AddServerDialog";
import ServerSession from "../components/ServerSession";
import ToolRunDialog from "../components/ToolRunDialog";
import {
  useMcpServers,
  useRegisterServer,
  useRemoveServer,
  useCheckServerHealth,
  useServerTools,
  useCallTool,
  useActionHistory,
} from "../hooks/useQueryHooks";

const DESTRUCTIVE_KEYWORDS = ["delete", "remove", "drop", "destroy", "revoke", "purge"];

export default function Dashboard({ projects, activeProjectId, onSelectProject, onCreateNewProject }) {
  const [selectedServerId, setSelectedServerId] = useState(null);
  const [showAddServer, setShowAddServer] = useState(false);
  const [checkingHealthId, setCheckingHealthId] = useState(null);
  const [activeTool, setActiveTool] = useState(null);

  const { data: servers = [] } = useMcpServers(activeProjectId);
  const { data: tools = [], isLoading: isLoadingTools } = useServerTools(selectedServerId);
  const { data: logs = [] } = useActionHistory(selectedServerId);

  const registerServer = useRegisterServer();
  const removeServer = useRemoveServer();
  const checkHealth = useCheckServerHealth();
  const callTool = useCallTool();

  const selectedServer = useMemo(
    () => servers.find((server) => server.id === selectedServerId),
    [servers, selectedServerId],
  );

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const oauth = searchParams.get("oauth");
    const oauthError = searchParams.get("oauth_error");

    if (oauth === "connected") {
      toast.success("Connected");
      const serverId = searchParams.get("server_id");
      if (serverId) setSelectedServerId(serverId);
    } else if (oauthError) {
      toast.error(oauthError);
    } else {
      return;
    }

    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegisterServer = async (payload) => {
    try {
      const res = await registerServer.mutateAsync(payload);
      const created = res?.data?.data?.server;

      toast.success(`"${payload.name}" registered`);
      setShowAddServer(false);
      if (created) setSelectedServerId(created.id);

      return created;
    } catch (err) {
      toast.error(err.message);
      return null;
    }
  };

  const handleRemoveServer = (serverId) => {
    removeServer.mutate(serverId, {
      onSuccess: () => {
        toast.success("Server removed");
        if (selectedServerId === serverId) setSelectedServerId(null);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleCheckHealth = (serverId) => {
    setCheckingHealthId(serverId);
    checkHealth.mutate(serverId, {
      onSettled: () => setCheckingHealthId(null),
      onSuccess: (res) => {
        const health = res?.data?.data?.health;
        if (health === "healthy") toast.success("Server is reachable");
        else toast.error(res?.data?.data?.error || "Server is unreachable");
      },
    });
  };

  const openTool = (tool) =>
    setActiveTool({
      ...tool,
      requiresApproval: DESTRUCTIVE_KEYWORDS.some((keyword) => tool.name.toLowerCase().includes(keyword)),
    });

  const handleRunTool = ({ toolName, input, approved }) => {
    callTool.mutate(
      { serverId: selectedServerId, toolName, input, approved },
      {
        onSuccess: (res) => {
          if (res?.data?.data?.requires_approval) {
            toast("Approval requested — run again to confirm", { icon: "⏳" });
          } else {
            toast.success("Tool call executed");
            setActiveTool(null);
          }
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-obsidian">
      <StarfieldBackground />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-72 bg-gradient-to-b from-blue-500/[0.07] to-transparent" />

      <TopNav
        extra={
          <ProjectSwitcher
            projects={projects}
            activeProjectId={activeProjectId}
            onSelect={onSelectProject}
            onCreateNew={onCreateNewProject}
          />
        }
      />

      <main className="relative z-10 grid flex-1 grid-cols-1 gap-5 p-5 lg:grid-cols-[280px_1fr]">
        <ResourceInspector
          servers={servers}
          selectedServerId={selectedServerId}
          onSelectServer={setSelectedServerId}
          onAddServer={() => setShowAddServer(true)}
          onRemoveServer={handleRemoveServer}
          onCheckHealth={handleCheckHealth}
          isCheckingHealth={checkingHealthId}
        />

        <ServerSession
          server={selectedServer}
          tools={tools}
          isLoadingTools={isLoadingTools}
          logs={logs}
          onRunTool={openTool}
        />
      </main>

      {showAddServer && (
        <AddServerDialog
          projectId={activeProjectId}
          onClose={() => setShowAddServer(false)}
          onSubmit={handleRegisterServer}
          isSubmitting={registerServer.isPending}
        />
      )}

      {activeTool && (
        <ToolRunDialog
          tool={activeTool}
          onClose={() => setActiveTool(null)}
          onRun={handleRunTool}
          isRunning={callTool.isPending}
        />
      )}
    </div>
  );
}
