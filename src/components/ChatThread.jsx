import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  ArrowUp,
  ArrowUpRight,
  Ban,
  Check,
  Edit3,
  HelpCircle,
  KeyRound,
  Loader2,
  Play,
  RotateCw,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import {
  useAllServerTools,
  useLlmSettings,
  useWorkflow,
  useUpdateWorkflow,
  useApproveWorkflow,
  useCancelWorkflow,
  useExecuteWorkflow,
  useRetryWorkflowStep,
} from "../hooks/useQueryHooks";
import { brandFor } from "../lib/brand";
import LlmKeyDialog from "./LlmKeyDialog";
import planningService from "../services/planning.service";

const HISTORY_TURNS = 8;

let seq = 0;

const nid = (p) => `${p}_${Date.now()}_${seq++}`;

const READ_ONLY = [
  "list",
  "get",
  "read",
  "describe",
  "search",
  "fetch",
  "check",
  "verify",
  "find",
  "status",
  "inspect",
];

const isReadOnly = (name) =>
  READ_ONLY.some((k) =>
    (name || "")
      .toLowerCase()
      .split(/[_\-.\s]+/)
      .includes(k),
  );

function resolveSchema(step, serversWithTools) {
  const entry = serversWithTools.find((s) => s.server.id === step.server_id);

  const tool = entry?.tools?.find((t) => t.name === step.tool_name);

  return tool?.inputSchema?.properties || {};
}

function summarizeForHistory(turn) {
  if (turn.role === "user") return turn.text;

  if (turn.kind === "workflow")
    return "Proposed an infrastructure workflow and is awaiting approval.";

  return turn.text;
}

function unwrapPlannerData(res) {
  return res?.data?.type ? res.data : (res?.data?.data ?? res?.data ?? res);
}

function formatToolResult(result) {
  if (result == null) return "";

  if (typeof result === "string") return result;

  if (Array.isArray(result?.content)) {
    const text = result.content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .filter(Boolean)
      .join("\n");

    if (text) return text;
  }

  if (result?.structuredContent)
    return JSON.stringify(result.structuredContent, null, 2);

  return JSON.stringify(result, null, 2);
}

export default function ChatThread({
  projectId,
  projectName,
  servers,
  seedText,
  onOpenComponents,
  onConnectExecution,
}) {
  const [thread, setThread] = useState([]);

  const [input, setInput] = useState("");

  const [selectedResult, setSelectedResult] = useState(null);

  const [isPlanning, setIsPlanning] = useState(false);

  const [showLlmKeyDialog, setShowLlmKeyDialog] = useState(false);

  const { data: llmSettings } = useLlmSettings();

  const scrollRef = useRef(null);

  const seededTextRef = useRef(null);

  const pendingSubmitRef = useRef(null);

  const serversWithTools = useAllServerTools(servers);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [thread]);

  useEffect(() => {
    if (seedText && seededTextRef.current !== seedText) {
      seededTextRef.current = seedText;

      submit(seedText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedText]);

  const submit = async (text) => {
    const value = (text ?? input).trim();

    if (!value || isPlanning || pendingSubmitRef.current === value) return;

    pendingSubmitRef.current = value;

    setInput("");

    const userTurn = { id: nid("u"), role: "user", text: value };

    setThread((prev) => [...prev, userTurn]);

    setIsPlanning(true);

    const history = [...thread, userTurn].slice(-HISTORY_TURNS).map((t) => ({
      role: t.role === "user" ? "user" : "assistant",
      content: summarizeForHistory(t),
    }));

    try {
      const res = await planningService.plan(projectId, value, history);

      const data = unwrapPlannerData(res);

      if (!data) throw new Error("Empty response from planner");

      if (data.type === "workflow") {
        setThread((prev) => [
          ...prev,
          {
            id: nid("a"),
            role: "assistant",
            kind: "workflow",
            workflowId: data.workflow.id,
          },
        ]);
      } else {
        setThread((prev) => [
          ...prev,
          {
            id: nid("a"),
            role: "assistant",
            kind: data.type,
            code: data.code,
            capability: data.capability,
            text: data.text,
          },
        ]);
      }
    } catch (err) {
      setThread((prev) => [
        ...prev,
        {
          id: nid("a"),
          role: "assistant",
          kind: "error",
          code: err.data?.data?.code,
          text: err.message,
        },
      ]);
    } finally {
      pendingSubmitRef.current = null;

      setIsPlanning(false);
    }
  };

  const toolsReady = serversWithTools.some((s) => (s.tools || []).length > 0);

  return (
    <div
      className={`chat-thread flex h-full flex-col overflow-hidden ${thread.length === 0 ? "chat-thread-empty" : ""}`}
    >
      <div ref={scrollRef} className="canvas-grid flex-1 overflow-y-auto">
        <div
          className={`flex min-h-full flex-col gap-6 px-6 py-8 ${thread.length === 0 ? "justify-center" : "justify-end"}`}
        >
          {thread.length === 0 && (
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]">
                <Sparkles size={17} className="text-[color:var(--brand)]" />
              </div>
              <h2 className="font-display text-[21px] font-semibold tracking-tight text-[color:var(--text)]">
                Direct {projectName || "this project"}.
              </h2>
              <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-[color:var(--text-dim)]">
                Describe what should happen in plain language. Subgrid finds the
                right component, plans it, and waits for your approval before
                anything runs.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {["list my buckets", "add a DNS record", "send an email"].map(
                  (example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => submit(example)}
                      className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1.5 font-mono text-[11.5px] text-[color:var(--text-dim)] transition-colors hover:border-[color:var(--border-strong)] hover:text-[color:var(--text)]"
                    >
                      {example}
                    </button>
                  ),
                )}
              </div>
              {!toolsReady && (
                <p className="mt-5 text-[11.5px] text-[color:var(--text-faint)]">
                  Connect a component to enable execution.
                </p>
              )}
            </div>
          )}

          {thread.map((turn) =>
            turn.role === "user" ? (
              <div key={turn.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-raised)] px-3.5 py-2.5 font-mono text-[12.5px] leading-relaxed text-[color:var(--text)]">
                  <span className="mr-2 select-none text-[color:var(--brand)]">
                    ›
                  </span>
                  {turn.text}
                </div>
              </div>
            ) : turn.kind === "workflow" ? (
              <WorkflowCard
                key={turn.id}
                workflowId={turn.workflowId}
                servers={servers}
                serversWithTools={serversWithTools}
                onInspectResult={setSelectedResult}
              />
            ) : (
              <AssistantMessage
                key={turn.id}
                turn={turn}
                onConnectExecution={onConnectExecution}
                onOpenComponents={onOpenComponents}
                onOpenLlmKeyDialog={() => setShowLlmKeyDialog(true)}
              />
            ),
          )}

          {isPlanning && (
            <div className="flex items-center gap-2 text-[12.5px] text-[color:var(--text-dim)]">
              <Loader2 size={13} className="animate-spin" /> Planning…
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[color:var(--border)] bg-[color:var(--bg)]/85 px-4 py-3 backdrop-blur-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-3 py-1.5 transition-colors focus-within:border-[color:var(--brand-line)]"
        >
          <span className="mb-2 select-none font-mono text-[14px] leading-none text-[color:var(--brand)]">
            ›
          </span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder="Direct this project — describe what you want done"
            className="min-h-[36px] max-h-32 flex-1 resize-none overflow-y-auto bg-transparent py-2 font-mono text-[13px] leading-6 text-[color:var(--text)] placeholder:text-[color:var(--text-faint)] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowLlmKeyDialog(true)}
            title={
              llmSettings.configured
                ? "Planner API key is configured"
                : "Add an API key to enable the plain-language planner"
            }
            className={`mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
              llmSettings.configured
                ? "border-[color:var(--brand-line)] text-[color:var(--brand)]"
                : "border-[color:var(--border)] text-[color:var(--text-faint)] hover:text-[color:var(--text-dim)]"
            }`}
          >
            <KeyRound size={13} />
          </button>
          <button
            type="submit"
            disabled={!input.trim() || isPlanning}
            className="btn-brand mb-1 !h-8 !w-8 shrink-0 !p-0 justify-center"
          >
            {isPlanning ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <ArrowUp size={14} />
            )}
          </button>
        </form>
      </div>
      {showLlmKeyDialog && (
        <LlmKeyDialog onClose={() => setShowLlmKeyDialog(false)} />
      )}
      {selectedResult && (
        <ResultDrawer
          step={selectedResult}
          onClose={() => setSelectedResult(null)}
          onChoose={(suggestion) => {
            setSelectedResult(null);
            submit(suggestion);
          }}
        />
      )}
    </div>
  );
}

function AssistantMessage({
  turn,
  onConnectExecution,
  onOpenComponents,
  onOpenLlmKeyDialog,
}) {
  const isError = turn.kind === "error";

  const isQuestion = turn.kind === "question";

  const tone = isError
    ? "border-rose-400/25 bg-rose-400/[0.06] text-rose-400"
    : isQuestion
      ? "border-amber-400/20 bg-amber-400/[0.05] text-[color:var(--text)]"
      : "border-transparent bg-[color:var(--surface-hover)] text-[color:var(--text)]";

  return (
    <div className="flex justify-start">
      <div
        className={`flex max-w-[85%] flex-col items-start gap-1.5 rounded-xl border px-3.5 py-2.5 text-[13.5px] leading-relaxed ${tone}`}
      >
        <div className="flex items-start gap-2">
          {isError && (
            <AlertTriangle
              size={14}
              className="mt-0.5 shrink-0 text-rose-400"
            />
          )}

          {isQuestion && (
            <HelpCircle size={14} className="mt-0.5 shrink-0 text-amber-400" />
          )}
          <span>{turn.text}</span>
        </div>
        {turn.code === "missing-executable-capability" &&
          (onConnectExecution || onOpenComponents) && (
            <button
              type="button"
              onClick={onConnectExecution || onOpenComponents}
              className="mt-1 inline-flex w-fit items-center gap-1 rounded-lg border border-white/[0.12] px-2.5 py-1.5 text-[11px] text-[color:var(--text)] transition-colors hover:bg-white/[0.06]"
            >
              Connect a component <ArrowUp size={11} className="rotate-45" />
            </button>
          )}
        {turn.code === "missing-llm-key" && onOpenLlmKeyDialog && (
          <button
            type="button"
            onClick={onOpenLlmKeyDialog}
            className="mt-1 inline-flex w-fit items-center gap-1 rounded-lg border border-white/[0.12] px-2.5 py-1.5 text-[11px] text-[color:var(--text)] transition-colors hover:bg-white/[0.06]"
          >
            <KeyRound size={11} /> Add your API key
          </button>
        )}
      </div>
    </div>
  );
}

const WORKFLOW_STATUS_LABEL = {
  draft: "Draft",
  awaiting_approval: "Awaiting approval",
  approved: "Approved",
  running: "Running",
  succeeded: "Complete",
  partially_succeeded: "Partially complete",
  failed: "Failed",
  cancelled: "Cancelled",
};

const EDITABLE_WORKFLOW_STATUSES = ["draft", "awaiting_approval"];

const TERMINAL_WORKFLOW_STATUSES = ["succeeded", "failed", "cancelled"];

function workflowStatusTone(status) {
  if (status === "succeeded")
    return "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-400";

  if (status === "failed" || status === "cancelled")
    return "border-rose-400/25 bg-rose-400/[0.08] text-rose-400";

  return "border-amber-400/25 bg-amber-400/[0.08] text-amber-400";
}

function WorkflowCard({
  workflowId,
  servers,
  serversWithTools,
  onInspectResult,
}) {
  const { data: workflow, isLoading } = useWorkflow(workflowId);

  const updateWorkflow = useUpdateWorkflow();

  const approveWorkflow = useApproveWorkflow();

  const cancelWorkflow = useCancelWorkflow();

  const executeWorkflow = useExecuteWorkflow();

  const retryStep = useRetryWorkflowStep();

  const [adding, setAdding] = useState(false);

  const [editing, setEditing] = useState(false);

  if (isLoading || !workflow) {
    return (
      <div className="flex justify-center py-6">
        <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-raised)] px-5 py-4 text-[12px] text-[color:var(--text-dim)]">
          <Loader2 size={13} className="animate-spin" /> Loading workflow…
        </div>
      </div>
    );
  }

  const steps = workflow.steps || [];

  const pending = steps.filter((s) => s.status === "pending").length;

  const succeeded = steps.filter((s) => s.status === "succeeded").length;

  const isTerminal = TERMINAL_WORKFLOW_STATUSES.includes(workflow.status);

  const canEdit = EDITABLE_WORKFLOW_STATUSES.includes(workflow.status);

  const requiredMissing = steps.filter(
    (s) =>
      s.status === "pending" &&
      (s.capability?.requiredInputs || []).some(
        (f) =>
          s.input?.[f] === undefined ||
          s.input?.[f] === null ||
          s.input?.[f] === "",
      ),
  ).length;

  const busy =
    updateWorkflow.isPending ||
    approveWorkflow.isPending ||
    cancelWorkflow.isPending ||
    executeWorkflow.isPending ||
    retryStep.isPending;

  const availableTools = serversWithTools.flatMap((entry) =>
    (entry.tools || []).map((tool) => ({ ...tool, server: entry.server })),
  );

  const runWorkflow = async () => {
    try {
      if (EDITABLE_WORKFLOW_STATUSES.includes(workflow.status))
        await approveWorkflow.mutateAsync(workflowId);

      await executeWorkflow.mutateAsync(workflowId);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="animate-fade-up flex flex-col items-center">
      <div className="mb-5 flex max-w-[460px] items-center gap-3">
        <span className="truncate font-mono text-[12px] text-[color:var(--text)]">
          <span className="mr-1.5 text-[color:var(--brand)]">›</span>
          {workflow.request}
        </span>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-[10px] ${workflowStatusTone(workflow.status)}`}
        >
          {WORKFLOW_STATUS_LABEL[workflow.status] || workflow.status}
        </span>
      </div>

      <RunGraph
        steps={steps}
        servers={servers}
        serversWithTools={serversWithTools}
        editing={editing}
        workflowStatus={workflow.status}
        workflowId={workflowId}
        updateWorkflow={updateWorkflow}
        retryStep={retryStep}
        cancelWorkflow={cancelWorkflow}
        onInspectResult={onInspectResult}
      />

      {!isTerminal && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runWorkflow}
              disabled={busy || editing || pending === 0 || requiredMissing > 0}
              className="btn-brand !py-2"
            >
              {busy ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Play size={12} />
              )}

              {succeeded > 0
                ? "Resume"
                : `Approve & run ${pending} step${pending === 1 ? "" : "s"}`}
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className={`btn-ghost !py-2 ${editing ? "border-[color:var(--brand)] text-[color:var(--text)]" : ""}`}
              >
                <Edit3 size={12} /> {editing ? "Done" : "Edit"}
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                cancelWorkflow.mutate(workflowId, {
                  onError: (err) => toast.error(err.message),
                })
              }
              className="btn-ghost !py-2 text-rose-400"
            >
              <Ban size={12} /> Cancel
            </button>
          </div>
          {requiredMissing > 0 && (
            <p className="font-mono text-[11px] text-amber-400">
              Fill in the {requiredMissing} required field
              {requiredMissing === 1 ? "" : "s"} above to run.
            </p>
          )}
          {canEdit && (
            <div className="flex items-center gap-2 font-mono text-[11px] text-[color:var(--text-faint)]">
              <button
                type="button"
                onClick={() => setAdding((v) => !v)}
                className="transition-colors hover:text-[color:var(--text-dim)]"
              >
                + add step
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() =>
                  updateWorkflow.mutate({
                    workflowId,
                    patch: {
                      executionMode:
                        workflow.execution_mode === "sequential"
                          ? "parallel"
                          : "sequential",
                    },
                  })
                }
                className="transition-colors hover:text-[color:var(--text-dim)]"
              >
                {workflow.execution_mode === "sequential"
                  ? "sequential"
                  : "parallel reads"}
              </button>
            </div>
          )}
          {adding && canEdit && (
            <select
              defaultValue=""
              onChange={(event) => {
                const tool = availableTools.find(
                  (item) =>
                    `${item.server.id}:${item.name}` === event.target.value,
                );
                if (!tool) return;
                updateWorkflow.mutate({
                  workflowId,
                  patch: {
                    addStep: {
                      serverId: tool.server.id,
                      toolName: tool.name,
                      input: {},
                      title: tool.name,
                      capability: {
                        resource: "other",
                        operation: "execute",
                        target: null,
                        readOnly: isReadOnly(tool.name),
                        requiredInputs: tool.inputSchema?.required || [],
                      },
                    },
                  },
                });
                setEditing(true);
                setAdding(false);
              }}
              className="w-[340px] rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-[12px] text-[color:var(--text)]"
            >
              <option value="">Choose a component action…</option>
              {availableTools.map((tool) => (
                <option
                  key={`${tool.server.id}:${tool.name}`}
                  value={`${tool.server.id}:${tool.name}`}
                >
                  {tool.server.name} · {tool.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}

function RunGraph({
  steps,
  servers,
  serversWithTools,
  editing,
  workflowStatus,
  workflowId,
  updateWorkflow,
  retryStep,
  cancelWorkflow,
  onInspectResult,
}) {
  const NODE_W = 420;

  const GAP = 64;

  const FALLBACK_HEIGHT = 200;

  const nodes = useMemo(() => {
    const list = [];

    steps.forEach((step) => {
      list.push({ key: `s:${step.id}`, kind: "step", step });

      if (step.output != null)
        list.push({ key: `r:${step.id}`, kind: "result", step });
    });

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(steps.map((s) => [s.id, s.status, s.output != null]))]);

  const containerRef = useRef(null);

  const nodeRefs = useRef({});

  const [geom, setGeom] = useState({});

  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    setOverrides((prev) => {
      const next = {};

      let changed = false;

      for (const key of Object.keys(prev)) {
        if (nodes.some((n) => n.key === key)) next[key] = prev[key];
        else changed = true;
      }

      return changed ? next : prev;
    });
  }, [nodes]);

  const autoY = useMemo(() => {
    const next = {};

    let cursor = 0;

    for (const n of nodes) {
      next[n.key] = cursor;

      const g = geom[n.key];

      cursor += (g ? g.bottom - g.top : FALLBACK_HEIGHT) + GAP;
    }

    return next;
  }, [nodes, geom]);

  const resolvedPos = (key) => overrides[key] || { x: 0, y: autoY[key] ?? 0 };

  const [layoutTick, setLayoutTick] = useState(0);

  useEffect(() => {
    const onResize = () => setLayoutTick((t) => t + 1);

    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => setLayoutTick((t) => t + 1));

    for (const n of nodes) {
      const el = nodeRefs.current[n.key];

      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [nodes]);

  useLayoutEffect(() => {
    const next = {};

    for (const n of nodes) {
      const el = nodeRefs.current[n.key];

      if (!el) continue;

      next[n.key] = {
        cx: el.offsetLeft + el.offsetWidth / 2,
        top: el.offsetTop,
        bottom: el.offsetTop + el.offsetHeight,
      };
    }

    setGeom((prev) => {
      const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);

      for (const key of keys) {
        const a = prev[key];

        const b = next[key];

        if (
          !a ||
          !b ||
          a.cx !== b.cx ||
          a.top !== b.top ||
          a.bottom !== b.bottom
        )
          return next;
      }

      return prev;
    });
  }, [nodes, overrides, autoY, layoutTick]);

  const dragFrom = useRef(null);

  const startDrag = (e, key) => {
    e.preventDefault();

    e.stopPropagation();

    const start = resolvedPos(key);

    const originX = e.clientX;

    const originY = e.clientY;

    document.body.style.userSelect = "none";

    const onMove = (ev) => {
      setOverrides((prev) => ({
        ...prev,
        [key]: {
          x: start.x + (ev.clientX - originX),
          y: Math.max(0, start.y + (ev.clientY - originY)),
        },
      }));
    };

    const onUp = () => {
      dragFrom.current = null;

      document.body.style.userSelect = "";

      window.removeEventListener("pointermove", onMove);

      window.removeEventListener("pointerup", onUp);
    };

    dragFrom.current = key;

    window.addEventListener("pointermove", onMove);

    window.addEventListener("pointerup", onUp);
  };

  const measured = Object.values(geom);

  const height = measured.length
    ? Math.max(...measured.map((g) => g.bottom)) + 64
    : Math.max(...Object.values(autoY), 0) + FALLBACK_HEIGHT + 64;

  return (
    <div ref={containerRef} className="relative w-full" style={{ height }}>
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        {nodes.slice(1).map((n, i) => {
          const a = geom[nodes[i].key];

          const b = geom[n.key];

          if (!a || !b) return null;

          const done =
            nodes[i].kind === "step" && nodes[i].step.status === "succeeded";

          const failed =
            nodes[i].kind === "step" && nodes[i].step.status === "failed";

          const d = `M ${a.cx} ${a.bottom} C ${a.cx} ${a.bottom + 28}, ${b.cx} ${b.top - 28}, ${b.cx} ${b.top}`;

          return (
            <path
              key={`edge:${n.key}`}
              d={d}
              fill="none"
              stroke={
                done
                  ? "var(--brand)"
                  : failed
                    ? "var(--danger)"
                    : "var(--border-strong)"
              }
              strokeWidth="2"
              strokeDasharray={done || failed ? "none" : "4 5"}
            />
          );
        })}
      </svg>

      {Object.keys(overrides).length > 0 && (
        <button
          type="button"
          onClick={() => setOverrides({})}
          className="absolute right-0 top-0 z-30 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-raised)] px-2 py-1 font-mono text-[10px] text-[color:var(--text-faint)] transition-colors hover:text-[color:var(--text-dim)]"
        >
          reset layout
        </button>
      )}

      {nodes.map((n) => {
        const p = resolvedPos(n.key);

        const dragging = dragFrom.current === n.key;

        return (
          <div
            key={n.key}
            ref={(el) => {
              nodeRefs.current[n.key] = el;
            }}
            className="absolute"
            style={{
              left: `calc(50% - ${NODE_W / 2}px + ${p.x}px)`,
              top: p.y,
              width: NODE_W,
              zIndex: dragging ? 20 : 10,
              transition: dragging
                ? "none"
                : "top 240ms var(--ease), left 240ms var(--ease)",
            }}
          >
            <div
              onPointerDown={(e) => {
                if (
                  e.target.closest?.(
                    "input, textarea, select, button, a, [role='button']",
                  )
                )
                  return;
                startDrag(e, n.key);
              }}
              className={`group/node ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
            >
              <span className="pointer-events-none absolute -top-2.5 left-1/2 z-20 -translate-x-1/2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-raised)] px-2 py-px font-mono text-[9px] uppercase tracking-wide text-[color:var(--text-faint)] opacity-0 transition-opacity duration-150 group-hover/node:opacity-100">
                drag
              </span>
              {n.kind === "step" ? (
                <StepNode
                  step={n.step}
                  servers={servers}
                  schema={resolveSchema(n.step, serversWithTools)}
                  editable={editing}
                  active={
                    workflowStatus === "running" && n.step.status === "running"
                  }
                  onInput={(input) =>
                    updateWorkflow.mutate({
                      workflowId,
                      patch: { updateSteps: [{ id: n.step.id, input }] },
                    })
                  }
                  onRemove={() =>
                    updateWorkflow.mutate({
                      workflowId,
                      patch: { removeStepIds: [n.step.id] },
                    })
                  }
                  onRetry={() =>
                    retryStep.mutate(
                      { workflowId, stepId: n.step.id },
                      { onError: (err) => toast.error(err.message) },
                    )
                  }
                  onDecline={() =>
                    cancelWorkflow.mutate(workflowId, {
                      onError: (err) => toast.error(err.message),
                    })
                  }
                  onAllowAlways={() =>
                    retryStep.mutate(
                      { workflowId, stepId: n.step.id, allowAlways: true },
                      { onError: (err) => toast.error(err.message) },
                    )
                  }
                />
              ) : (
                <ResultNode
                  step={n.step}
                  onOpen={() =>
                    onInspectResult({
                      ...n.step,
                      result: n.step.output,
                      server_name: servers.find(
                        (s) => s.id === n.step.server_id,
                      )?.name,
                    })
                  }
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ResultNode({ step, onOpen }) {
  const failed = step.output?.kind === "error" || step.status === "failed";

  const summary = step.output?.summary || step.output?.title || "Completed";

  return (
    <div
      className={`w-[420px] overflow-hidden rounded-2xl border bg-[color:var(--surface-raised)] ${failed ? "border-rose-400/40" : "border-[color:var(--border)]"}`}
    >
      <div className="flex items-center gap-3 px-5 pb-4 pt-5">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${failed ? "bg-rose-400/10" : "bg-emerald-400/10"}`}
        >
          {failed ? (
            <AlertTriangle size={15} className="text-rose-400" />
          ) : (
            <Check size={15} className="text-emerald-400" />
          )}
        </span>
        <span className="text-[15px] font-medium text-[color:var(--text)]">
          Result
        </span>
        <span
          className={`ml-auto shrink-0 text-[9px] uppercase tracking-wider ${failed ? "text-rose-400" : "text-emerald-400"}`}
        >
          {failed ? "error" : "data"}
        </span>
      </div>
      <p className="px-5 pb-4 text-[13px] leading-relaxed text-[color:var(--text-dim)]">
        {summary}
      </p>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center justify-between border-t border-[color:var(--border)] px-5 py-3 text-[12px] font-medium text-[color:var(--text-dim)] transition-colors hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--text)]"
      >
        Open result <ArrowUpRight size={12} />
      </button>
    </div>
  );
}

function StepNode({
  step,
  servers,
  schema,
  editable,
  active,
  onInput,
  onRemove,
  onRetry,
  onDecline,
  onAllowAlways,
}) {
  const [showOptional, setShowOptional] = useState(false);

  const server = servers.find((s) => s.id === step.server_id);

  const { Icon } = brandFor(server?.provider || "");

  const fields = Object.entries(schema || {});

  const requiredInputs = step.capability?.requiredInputs || [];

  const requiredFields = fields.filter(([key]) => requiredInputs.includes(key));

  const optionalFields = fields.filter(
    ([key]) => !requiredInputs.includes(key),
  );

  const awaitingConfirm = step.status === "pending" && step.requires_approval;

  const state = awaitingConfirm
    ? {
        label: "Needs approval",
        cls: "text-amber-400",
        node: <AlertTriangle size={13} />,
      }
    : step.status === "succeeded"
      ? {
          label: "Completed",
          cls: "text-emerald-400",
          node: <Check size={13} />,
        }
      : step.status === "failed"
        ? { label: "Failed", cls: "text-rose-400", node: <X size={13} /> }
        : step.status === "running"
          ? {
              label: "Running…",
              cls: "text-[color:var(--brand)]",
              node: <Loader2 size={13} className="animate-spin" />,
            }
          : {
              label: "Ready to run",
              cls: "text-[color:var(--text-dim)]",
              node: (
                <span className="h-2 w-2 rounded-full border border-[color:var(--text-faint)]" />
              ),
            };

  return (
    <div
      className={`w-[420px] overflow-hidden rounded-2xl border bg-[color:var(--surface-raised)] transition-colors ${active ? "border-[color:var(--brand-line)]" : awaitingConfirm ? "border-amber-400/40" : "border-[color:var(--border)]"}`}
    >
      <div className="px-5 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
            <Icon size={15} className="text-[color:var(--text)]" />
          </span>
          <span className="truncate text-[15px] font-medium text-[color:var(--text)]">
            {server?.name || "Component"}
          </span>
          <span
            className={`ml-auto shrink-0 text-[9px] uppercase tracking-wider ${step.capability?.readOnly ? "text-[color:var(--text-faint)]" : "text-amber-400"}`}
          >
            {step.capability?.readOnly ? "read" : "write"}
          </span>
        </div>
        {step.title && step.title !== step.tool_name && (
          <p className="mt-3 text-[13px] leading-relaxed text-[color:var(--text)]">
            {step.title}
          </p>
        )}
        <div
          className={`mt-3 flex items-center gap-2 text-[13px] ${state.cls}`}
        >
          {state.node}
          <span>{state.label}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-[color:var(--border)] px-5 py-3">
        <Wrench size={12} className="shrink-0 text-[color:var(--text-faint)]" />
        <span className="truncate font-mono text-[11.5px] text-[color:var(--text-dim)]">
          {step.tool_name}
        </span>
        {editable && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-auto rounded p-1 text-[color:var(--text-faint)] transition-colors hover:text-rose-400"
          >
            <X size={11} />
          </button>
        )}
      </div>

      {step.status === "pending" && fields.length > 0 && (
        <div className="border-t border-[color:var(--border)] px-5 py-3">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
            {requiredFields.map(([key, propSchema]) => (
              <StepField
                key={key}
                name={key}
                schema={propSchema}
                value={step.input[key] ?? ""}
                required
                onChange={(v) => onInput({ ...step.input, [key]: v })}
              />
            ))}
          </div>

          {optionalFields.length > 0 && (
            <button
              type="button"
              onClick={() => setShowOptional((v) => !v)}
              className="mt-2.5 block font-mono text-[10px] text-[color:var(--text-faint)] transition-colors hover:text-[color:var(--text-dim)]"
            >
              {showOptional
                ? "− hide optional"
                : `+ ${optionalFields.length} optional`}
            </button>
          )}
          {showOptional && (
            <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2.5">
              {optionalFields.map(([key, propSchema]) => (
                <StepField
                  key={key}
                  name={key}
                  schema={propSchema}
                  value={step.input[key] ?? ""}
                  onChange={(v) => onInput({ ...step.input, [key]: v })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {awaitingConfirm && (
        <div className="border-t border-[color:var(--border)] px-5 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg bg-amber-400 px-3 py-1.5 text-[12px] font-semibold text-black"
            >
              Allow
            </button>
            <button
              type="button"
              onClick={onDecline}
              className="btn-ghost !py-1.5 text-[12px]"
            >
              Don't allow
            </button>
          </div>
          {step.capability?.operation === "execute" ? (
            <p className="mt-2 max-w-[340px] text-[10.5px] leading-relaxed text-[color:var(--text-faint)]">
              {step.tool_name} is a general-purpose code tool — it can call
              anything on this component, not just this one action, so each call
              needs its own review.
            </p>
          ) : (
            <button
              type="button"
              onClick={onAllowAlways}
              className="mt-2 block text-left font-mono text-[10.5px] text-[color:var(--text-faint)] transition-colors hover:text-[color:var(--text-dim)]"
            >
              Always allow — run it now and stop asking for {step.tool_name}
            </button>
          )}
        </div>
      )}

      {!awaitingConfirm && step.status === "failed" && (
        <div className="border-t border-[color:var(--border)] px-5 py-3">
          {step.error && (
            <p className="mb-2 font-mono text-[11px] leading-relaxed text-rose-400">
              {step.error}
            </p>
          )}
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-400/15 px-3 py-1.5 text-[12px] font-medium text-rose-300"
          >
            <RotateCw size={11} /> Retry
          </button>
        </div>
      )}
    </div>
  );
}

const OUTPUT_ERROR_PATTERN =
  /^\s*(error|failed|failure|unauthorized|forbidden|access denied|not found)\b/i;

function formatCell(value) {
  if (value === null || value === undefined) return "—";

  if (typeof value === "object") return JSON.stringify(value);

  if (typeof value === "boolean") return value ? "true" : "false";

  return String(value);
}

// Some tools return tabular results as "col1|col2\nval1|val2\n..."
function parsePipeTable(value) {
  if (typeof value !== "string" || !value.includes("|")) return null;

  const lines = value.split("\n").filter((line) => line.length);

  if (lines.length < 2) return null;

  const cols = lines[0].split("|").map((c) => c.trim());

  if (cols.length < 2) return null;

  const rows = lines
    .slice(1)
    .map((line) => line.split("|").map((c) => c.trim()));

  const sameWidth =
    rows.find((row) => row.length !== cols.length) === undefined;

  if (!sameWidth) return null;

  return { cols, rows };
}

function PipeTable({ cols, rows }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[color:var(--border)]">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[color:var(--border)] bg-[color:var(--surface-sunken)]">
            {cols.map((c, i) => (
              <th
                key={i}
                className="px-3.5 py-2 font-mono text-[10px] font-medium uppercase tracking-wider text-[color:var(--text-faint)]"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={i ? "border-t border-[color:var(--border)]" : ""}
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="px-3.5 py-2.5 font-mono text-[11.5px] text-[color:var(--text)]"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ToolOutput({ raw, failed }) {
  let parsed = null;

  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }

  const rows = Array.isArray(parsed) ? parsed : null;

  const obj =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : null;

  if (
    rows &&
    rows.length &&
    rows.every((r) => r && typeof r === "object" && !Array.isArray(r))
  ) {
    const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))].slice(0, 6);

    return (
      <div className="overflow-hidden rounded-xl border border-[color:var(--border)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[color:var(--border)] bg-[color:var(--surface-sunken)]">
              {cols.map((c) => (
                <th
                  key={c}
                  className="px-3.5 py-2 font-mono text-[10px] font-medium uppercase tracking-wider text-[color:var(--text-faint)]"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className={i ? "border-t border-[color:var(--border)]" : ""}
              >
                {cols.map((c) => (
                  <td
                    key={c}
                    className="px-3.5 py-2.5 font-mono text-[11.5px] text-[color:var(--text)]"
                  >
                    {formatCell(r[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (obj && Object.keys(obj).length) {
    const seenValues = new Set();

    const entries = Object.entries(obj).filter(([, v]) => {
      const fingerprint = typeof v === "string" ? v : JSON.stringify(v);

      if (seenValues.has(fingerprint)) return false;

      seenValues.add(fingerprint);

      return true;
    });

    return (
      <div className="overflow-hidden rounded-xl border border-[color:var(--border)]">
        {entries.map(([k, v], i) => {
          const table = parsePipeTable(v);

          return (
            <div
              key={k}
              className={`flex items-start gap-4 px-3.5 py-2.5 ${i ? "border-t border-[color:var(--border)]" : ""}`}
            >
              <span className="w-36 shrink-0 font-mono text-[11px] text-[color:var(--text-faint)]">
                {k}
              </span>
              <span className="min-w-0 flex-1 break-words font-mono text-[11.5px] whitespace-pre-wrap text-[color:var(--text)]">
                {table ? (
                  <PipeTable cols={table.cols} rows={table.rows} />
                ) : (
                  formatCell(v)
                )}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <pre
      className={`max-h-[48vh] overflow-auto rounded-xl border p-4 font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap ${failed ? "border-rose-400/25 bg-rose-400/[0.04] text-rose-400" : "border-[color:var(--border)] bg-[color:var(--surface-sunken)] text-[color:var(--text-dim)]"}`}
    >
      {raw || "No output."}
    </pre>
  );
}

function ResultDrawer({ step, onClose, onChoose }) {
  const structured =
    step.result &&
    typeof step.result === "object" &&
    typeof step.result.kind === "string"
      ? step.result
      : null;

  const raw = structured ? structured.raw : formatToolResult(step.result);

  const sources = structured
    ? structured.sources || []
    : extractResearchSources(raw);

  const suggestions = structured
    ? (structured.suggestions || []).map((s) => s.label)
    : nextStepSuggestions(step);

  const failed = structured
    ? structured.kind === "error"
    : OUTPUT_ERROR_PATTERN.test(raw.trim());

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex justify-end bg-black/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Tool result"
      onClick={onClose}
    >
      <aside
        className="animate-scale-in flex w-[min(560px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-[color:var(--border)] px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="eyebrow">
                {failed ? "Action ran" : "Completed action"}
              </p>
              <span
                className={`rounded-full border px-2 py-0.5 text-[9px] font-medium ${failed ? "border-rose-400/25 bg-rose-400/[0.08] text-rose-400" : "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-400"}`}
              >
                {failed ? "Failed" : "Succeeded"}
              </span>
            </div>
            <h3 className="mt-1.5 font-mono text-[14px] text-[color:var(--text)]">
              {step.tool_name}
            </h3>
            <p className="mt-1 text-[12px] text-[color:var(--text-dim)]">
              {step.server_name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost !h-8 !w-8 !p-0 justify-center"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div
            className={`mb-5 flex items-center gap-2 text-[11px] ${failed ? "text-rose-400" : "text-emerald-400"}`}
          >
            {failed ? <AlertTriangle size={13} /> : <Check size={13} />}

            {failed
              ? "Executed, but the response reports a failure"
              : "Completed successfully"}
          </div>
          {sources.length > 0 ? (
            <ResearchResult sources={sources} raw={raw} />
          ) : (
            <>
              <p className="eyebrow mb-2.5">Result</p>
              <ToolOutput raw={raw} failed={failed} />
            </>
          )}
          {suggestions.length > 0 && (
            <section className="mt-6">
              <p className="eyebrow mb-2">Continue with Subgrid</p>
              <p className="mb-3 text-[11.5px] leading-relaxed text-[color:var(--text-dim)]">
                Choose a next step to create a new plan from the connected
                components. Nothing runs without approval.
              </p>
              <div className="space-y-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => onChoose(suggestion)}
                    className="flex w-full items-center justify-between rounded-xl border border-[color:var(--border)] px-3.5 py-3 text-left text-[12px] text-[color:var(--text-dim)] transition-colors hover:border-[color:var(--border-strong)] hover:bg-white/[0.04] hover:text-[color:var(--text)]"
                  >
                    <span>{suggestion}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                      Plan this <ArrowUp size={12} className="rotate-45" />
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
        <footer className="shrink-0 border-t border-[color:var(--border)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-primary w-full justify-center"
          >
            Done
          </button>
        </footer>
      </aside>
    </div>
  );
}

function extractResearchSources(raw) {
  const matches = [
    ...raw.matchAll(
      /<result>\s*<url>([\s\S]*?)<\/url>\s*<title>([\s\S]*?)<\/title>\s*<text>([\s\S]*?)<\/text>\s*<\/result>/gi,
    ),
  ];

  return matches
    .map((match) => {
      const text = match[3].replace(/\s+/g, " ").trim();

      const title = match[2].trim();

      const fallbackTitle =
        text.match(/#{1,4}\s*([^#]+?)(?=\s+#|$)/)?.[1]?.trim() ||
        "Cloudflare documentation";

      return {
        url: match[1].trim(),
        title: /^\d+$/.test(title) ? fallbackTitle : title,
        text,
      };
    })
    .filter((source) => source.url && source.title)
    .slice(0, 5);
}

function ResearchResult({ sources, raw }) {
  const isR2 = /r2|bucket|binding/i.test(raw);

  return (
    <div>
      <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4">
        <p className="eyebrow mb-2 text-emerald-400">Research synthesis</p>
        <p className="text-[13px] leading-relaxed text-[color:var(--text)]">
          {isR2
            ? "R2 buckets are attached to Workers or Pages through a binding. The binding needs a runtime variable name and the target bucket name, then the project must be redeployed before the binding is available."
            : "The connected tool returned supporting documentation. Review the source summaries below before choosing the next action."}
        </p>
      </div>
      <div className="space-y-3">
        <p className="eyebrow">Sources</p>
        {sources.map((source) => (
          <article
            key={source.url}
            className="rounded-xl border border-[color:var(--border)] bg-white/[0.02] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-[12.5px] font-medium text-[color:var(--text)]">
                  {source.title}
                </h4>
                <p className="mt-1 line-clamp-3 text-[11.5px] leading-relaxed text-[color:var(--text-dim)]">
                  {source.text}
                </p>
              </div>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-[11px] text-blue-400 hover:text-[color:var(--brand)]"
              >
                Open source ↗
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function nextStepSuggestions(step) {
  const output = formatToolResult(step.result).toLowerCase();

  if (output.includes("r2") || output.includes("bucket"))
    return [
      "Show objects in a bucket",
      "Create an R2 bucket",
      "Configure an R2 binding for a Pages project",
      "Show the required binding values",
    ];

  if (
    output.includes("dns") ||
    output.includes("record") ||
    output.includes("domain")
  )
    return [
      "Verify DNS propagation",
      "Show the current DNS records",
      "Add another DNS record",
    ];

  if (output.includes("project") || output.includes("deployment"))
    return [
      "Inspect the production deployment",
      "Show recent deployment activity",
    ];

  if (output.includes("email") || output.includes("recipient"))
    return ["Show recent delivery activity", "Send another message"];

  return ["Explain this result", "Show the related resource details"];
}

function StepField({ name, schema, value, onChange, disabled, required }) {
  const empty = value === "" || value === undefined || value === null;

  const highlight = required && empty;

  const fieldCls = `w-full rounded-lg border bg-[color:var(--surface)] px-2.5 py-1.5 font-mono text-[11.5px] text-[color:var(--text)] placeholder:text-[color:var(--text-faint)] focus:border-[color:var(--brand)] focus:outline-none ${highlight ? "border-amber-400/50" : "border-[color:var(--border)]"}`;

  const label = (
    <span
      className={`mb-1 block font-mono text-[10px] ${highlight ? "text-amber-400" : "text-[color:var(--text-dim)]"}`}
    >
      {name}

      {required ? " *" : ""}
    </span>
  );

  if (schema?.enum) {
    return (
      <label className="block">
        {label}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={fieldCls}
        >
          <option value="">Select…</option>
          {schema.enum.map((o) => (
            <option key={String(o)} value={o}>
              {String(o)}
            </option>
          ))}
        </select>
      </label>
    );
  }

  const fieldText = `${name} ${schema?.description || ""}`;

  const isCode = /code|script|query|expression/i.test(fieldText);

  const long =
    isCode || /body|message|content|text|html|description/i.test(fieldText);

  const Tag = long ? "textarea" : "input";

  return (
    <label className={long ? "block col-span-2" : "block"}>
      {label}
      <Tag
        value={value}
        rows={isCode ? 12 : long ? 2 : undefined}
        type={
          !long && (schema?.type === "number" || schema?.type === "integer")
            ? "number"
            : "text"
        }
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={schema?.description || name}
        className={`${fieldCls} ${isCode ? "resize-y bg-[color:var(--surface-sunken)] leading-relaxed" : ""}`}
        spellCheck={isCode ? false : undefined}
      />
    </label>
  );
}
