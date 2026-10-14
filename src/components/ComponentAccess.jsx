import { useEffect, useState } from "react";
import { Info, ShieldAlert, ShieldCheck, Zap, X } from "lucide-react";

const POLICIES = [
  {
    id: "auto",
    Icon: Zap,
    title: "Run automatically",
    body: "Every call runs without asking. Fastest, least control.",
  },
  {
    id: "prompt",
    Icon: ShieldCheck,
    title: "Ask before destructive actions",
    body: "Calls whose names read as delete, remove, drop, destroy, revoke or purge wait for your approval. Everything else runs.",
  },
  {
    id: "always",
    Icon: ShieldAlert,
    title: "Ask before every action",
    body: "Nothing runs until you approve it. Slowest, most control.",
  },
];

const parseList = (value) =>
  value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const serializeList = (list) => (list || []).join(", ");

export default function ComponentAccess({ server, access, onSave, saving }) {
  const [policy, setPolicy] = useState(access.approvalPolicy || "prompt");

  const [include, setInclude] = useState(
    serializeList(access.toolFilter?.include),
  );

  const [exclude, setExclude] = useState(
    serializeList(access.toolFilter?.exclude),
  );

  const [approved, setApproved] = useState(access.approvedTools || []);

  const [dirty, setDirty] = useState(false);

  const seedKey = JSON.stringify([
    server.id,
    access.approvalPolicy || "prompt",
    access.toolFilter || null,
    access.approvedTools || [],
  ]);

  useEffect(() => {
    setPolicy(access.approvalPolicy || "prompt");

    setInclude(serializeList(access.toolFilter?.include));

    setExclude(serializeList(access.toolFilter?.exclude));

    setApproved(access.approvedTools || []);

    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey]);

  const mark = (fn) => (value) => {
    fn(value);

    setDirty(true);
  };

  const save = () => {
    const includeList = parseList(include);

    const excludeList = parseList(exclude);

    onSave({
      tool_filter:
        includeList.length || excludeList.length
          ? { include: includeList, exclude: excludeList }
          : null,
      approval_policy: policy,
      approved_tools: approved,
    });
  };

  return (
    <div className="max-h-[460px] space-y-5 overflow-y-auto p-4">
      {access.stale && (
        <div className="flex gap-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-3 text-[11px] leading-relaxed text-amber-300">
          <Info size={13} className="mt-0.5 shrink-0" />
          <span>
            This component is unreachable, so you're seeing its{" "}
            <strong className="font-medium">last known tools</strong>. Retrying
            automatically.
            {access.staleError ? (
              <span className="mt-1 block font-mono text-[10px] text-amber-300/70">
                {access.staleError}
              </span>
            ) : null}
          </span>
        </div>
      )}

      <section className="space-y-2">
        <h4 className="text-[12px] font-semibold text-[color:var(--text)]">
          Approval policy
        </h4>
        <p className="text-[10.5px] leading-relaxed text-[color:var(--text-dim)]">
          When Subgrid should stop and ask you before running one of this
          component's tools.
        </p>
        <div className="space-y-1.5">
          {POLICIES.map(({ id, Icon, title, body }) => {
            const active = policy === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => mark(setPolicy)(id)}
                className={`flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition-colors ${active ? "border-[color:var(--brand-line)] bg-[color:var(--brand-soft)]" : "border-[color:var(--border)] hover:border-[color:var(--border-strong)]"}`}
              >
                <Icon
                  size={14}
                  className={`mt-0.5 shrink-0 ${active ? "text-[color:var(--brand)]" : "text-[color:var(--text-faint)]"}`}
                />
                <span className="min-w-0">
                  <span className="block text-[12px] font-medium text-[color:var(--text)]">
                    {title}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] leading-relaxed text-[color:var(--text-dim)]">
                    {body}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-2 border-t border-[color:var(--border)] pt-4">
        <h4 className="text-[12px] font-semibold text-[color:var(--text)]">
          Tool access
        </h4>
        <p className="text-[10.5px] leading-relaxed text-[color:var(--text-dim)]">
          Which of this component's tools may be used at all. Comma-separate
          names; a trailing{" "}
          <code className="font-mono text-[color:var(--text)]">*</code> matches
          a prefix (
          <code className="font-mono text-[color:var(--text)]">read_*</code>).
          Blocked tools are hidden from the planner and refused on direct calls.
        </p>

        <label className="block space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wide text-[color:var(--text-faint)]">
            Only allow these
          </span>
          <textarea
            value={include}
            onChange={(e) => mark(setInclude)(e.target.value)}
            rows={2}
            placeholder="leave empty to allow everything"
            className="w-full resize-y rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-sunken)] px-3 py-2 font-mono text-[11px] text-[color:var(--text)] placeholder:text-[color:var(--text-faint)] focus:border-[color:var(--border-strong)] focus:outline-none"
          />
        </label>

        <label className="block space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wide text-[color:var(--text-faint)]">
            Block these
          </span>
          <textarea
            value={exclude}
            onChange={(e) => mark(setExclude)(e.target.value)}
            rows={2}
            placeholder="e.g. delete_*, purge_all"
            className="w-full resize-y rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-sunken)] px-3 py-2 font-mono text-[11px] text-[color:var(--text)] placeholder:text-[color:var(--text-faint)] focus:border-[color:var(--border-strong)] focus:outline-none"
          />
        </label>
      </section>

      {approved.length > 0 && (
        <section className="space-y-2 border-t border-[color:var(--border)] pt-4">
          <h4 className="text-[12px] font-semibold text-[color:var(--text)]">
            Always allowed
          </h4>
          <p className="text-[10.5px] leading-relaxed text-[color:var(--text-dim)]">
            Granted with "Always allow". These never prompt again, whatever the
            policy above says.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {approved.map((tool) => (
              <span
                key={tool}
                className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-sunken)] py-0.5 pl-2 pr-1 font-mono text-[10.5px] text-[color:var(--text-dim)]"
              >
                {tool}
                <button
                  type="button"
                  title={`Stop auto-approving ${tool}`}
                  onClick={() =>
                    mark(setApproved)(approved.filter((t) => t !== tool))
                  }
                  className="rounded-full p-0.5 text-[color:var(--text-faint)] transition-colors hover:text-rose-400"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center gap-2 border-t border-[color:var(--border)] pt-4">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="btn-brand !py-2"
        >
          {saving ? "Saving…" : "Save access"}
        </button>
        <span className="text-[10.5px] text-[color:var(--text-faint)]">
          {dirty ? "Unsaved changes" : "Up to date — changes apply immediately"}
        </span>
      </div>
    </div>
  );
}
