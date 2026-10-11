import { useState } from "react";
import { ArrowLeft, ArrowUpRight, ChevronRight, Fingerprint, Lock, X } from "lucide-react";
import toast from "react-hot-toast";

import { CATEGORIES, INTEGRATIONS, slugify } from "../lib/integrations";
import { requestApproval } from "../lib/webauthn";
import { usePasskeys } from "../hooks/useQueryHooks";
import oauthService from "../services/oauth.service";

const FIELD =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-blue-500/50";
const LABEL = "mb-1.5 block text-xs font-medium text-zinc-500";

function IntegrationPicker({ onPick }) {
  const grouped = Object.keys(CATEGORIES)
    .map((category) => ({ category, items: INTEGRATIONS.filter((i) => i.category === category) }))
    .filter((group) => group.items.length);

  return (
    <div className="space-y-4">
      {grouped.map(({ category, items }) => (
        <div key={category}>
          <h4 className="mb-1 px-1 text-[11px] font-medium uppercase tracking-wider text-zinc-600">
            {CATEGORIES[category]}
          </h4>
          <div className="space-y-1">
            {items.map((integration) => (
              <button
                key={integration.id}
                type="button"
                onClick={() => onPick(integration)}
                className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors hover:border-zinc-800 hover:bg-zinc-900/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-zinc-200">{integration.name}</div>
                  <div className="mt-0.5 truncate text-[11px] text-zinc-500">{integration.description}</div>
                </div>
                <ChevronRight size={14} className="shrink-0 text-zinc-700 transition-colors group-hover:text-zinc-400" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function KnownIntegrationForm({ integration, onBack, onSubmit, isSubmitting }) {
  const [name, setName] = useState(integration.name);
  const [values, setValues] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit({
      name,
      slug: slugify(name),
      category: integration.category,
      provider: integration.id,
      transport: "stdio",
      command: integration.command,
      args: integration.baseArgs,
      env: values,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <button
        type="button"
        onClick={onBack}
        className="-ml-1 mb-1 flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <ArrowLeft size={12} /> Choose a different integration
      </button>

      <div>
        <label className={LABEL}>Name</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className={FIELD} />
      </div>

      {integration.fields.map((field) => (
        <div key={field.key}>
          <label className={`${LABEL} flex items-center gap-1.5`}>
            {field.type === "password" && <Lock size={11} className="text-zinc-600" />}
            {field.label}
          </label>
          <input
            required
            type={field.type}
            placeholder={field.placeholder}
            value={values[field.key] || ""}
            onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
            className={`${FIELD} font-mono`}
          />
        </div>
      ))}

      {integration.fields.length > 0 && (
        <p className="text-[11px] leading-relaxed text-zinc-600">Encrypted at rest. Never returned by the API after this.</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-zinc-100 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Connecting..." : `Connect ${integration.name}`}
      </button>
    </form>
  );
}

function OAuthIntegrationForm({ integration, onBack, onSubmit, isSubmitting }) {
  const [name, setName] = useState(integration.name);

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit({
      name,
      slug: slugify(name),
      category: integration.category,
      provider: integration.id,
      transport: integration.transport,
      url: integration.url,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <button
        type="button"
        onClick={onBack}
        className="-ml-1 mb-1 flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <ArrowLeft size={12} /> Choose a different integration
      </button>

      <div>
        <label className={LABEL}>Name</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className={FIELD} />
      </div>

      <p className="text-[11px] leading-relaxed text-zinc-600">
        You'll be sent to {integration.name} to sign in and approve access. No API key to paste — Subgrid
        registers itself as an OAuth client and stores only the resulting tokens, encrypted.
      </p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-100 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Connecting..." : `Continue to ${integration.name}`}
        {!isSubmitting && <ArrowUpRight size={14} />}
      </button>
    </form>
  );
}

function CustomForm({ integration, onBack, onSubmit, isSubmitting }) {
  const isStdio = integration.custom === "stdio";
  const [name, setName] = useState("");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState("");
  const [url, setUrl] = useState("");
  const [env, setEnv] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const parsedEnv = env
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .reduce((acc, line) => {
        const idx = line.indexOf("=");
        if (idx === -1) return acc;
        acc[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
        return acc;
      }, {});

    onSubmit({
      name,
      slug: slugify(name),
      category: "other",
      transport: isStdio ? "stdio" : "sse",
      ...(isStdio ? { command, args: args ? args.split(" ").filter(Boolean) : [] } : { url }),
      ...(Object.keys(parsedEnv).length ? { env: parsedEnv } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <button
        type="button"
        onClick={onBack}
        className="-ml-1 mb-1 flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <ArrowLeft size={12} /> Choose a different integration
      </button>

      <div>
        <label className={LABEL}>Name</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="My MCP server" className={FIELD} />
      </div>

      {isStdio ? (
        <>
          <div>
            <label className={LABEL}>Command</label>
            <input required value={command} onChange={(e) => setCommand(e.target.value)} placeholder="npx" className={`${FIELD} font-mono`} />
          </div>
          <div>
            <label className={LABEL}>Args (space separated)</label>
            <input
              value={args}
              onChange={(e) => setArgs(e.target.value)}
              placeholder="-y some-mcp-server"
              className={`${FIELD} font-mono`}
            />
          </div>
        </>
      ) : (
        <div>
          <label className={LABEL}>URL</label>
          <input required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className={`${FIELD} font-mono`} />
        </div>
      )}

      <div>
        <label className={`${LABEL} flex items-center gap-1.5`}>
          <Lock size={11} className="text-zinc-600" />
          Secrets <span className="font-normal text-zinc-700">— one KEY=value per line, encrypted at rest</span>
        </label>
        <textarea
          value={env}
          onChange={(e) => setEnv(e.target.value)}
          rows={3}
          placeholder={"API_TOKEN=..."}
          className={`${FIELD} font-mono text-xs placeholder:text-zinc-700`}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-zinc-100 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Registering..." : "Register server"}
      </button>
    </form>
  );
}

export default function AddServerDialog({ projectId, onClose, onSubmit, isSubmitting }) {
  const [integration, setIntegration] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const { data: passkeys = [] } = usePasskeys();

  const handleFormSubmit = async (payload) => {
    const hasSecrets = payload.env && Object.keys(payload.env).length > 0;

    if (hasSecrets && passkeys.length > 0) {
      try {
        setIsApproving(true);
        const token = await requestApproval("store_server_secrets");
        payload.approval_token = token;
      } catch {
        toast.error("Passkey approval was cancelled or failed");
        setIsApproving(false);
        return;
      }
      setIsApproving(false);
    }

    const created = await onSubmit({ ...payload, project_id: projectId });

    if (integration?.oauth && created?.id) {
      try {
        const res = await oauthService.authorize(created.id);
        const url = res?.data?.data?.authorize_url;
        if (url) {
          window.location.href = url;
          return;
        }
      } catch (err) {
        toast.error(err.message || "Could not start the OAuth flow");
      }
    }
  };

  const busy = isSubmitting || isApproving;

  return (
    <div className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="animate-scale-in panel-solid w-full max-w-md p-5">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-100">
            {integration ? `Connect ${integration.name}` : "Connect a component"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
          >
            <X size={16} />
          </button>
        </div>

        {!integration && <IntegrationPicker onPick={setIntegration} />}

        {integration && integration.oauth && (
          <OAuthIntegrationForm
            integration={integration}
            onBack={() => setIntegration(null)}
            onSubmit={handleFormSubmit}
            isSubmitting={busy}
          />
        )}

        {integration && !integration.custom && !integration.oauth && (
          <KnownIntegrationForm
            integration={integration}
            onBack={() => setIntegration(null)}
            onSubmit={handleFormSubmit}
            isSubmitting={busy}
          />
        )}

        {integration?.custom && (
          <CustomForm integration={integration} onBack={() => setIntegration(null)} onSubmit={handleFormSubmit} isSubmitting={busy} />
        )}

        {isApproving && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-blue-900/40 bg-blue-950/20 px-3 py-2.5 text-xs text-blue-300">
            <Fingerprint size={14} className="shrink-0 animate-pulse" />
            Waiting for your passkey...
          </div>
        )}
      </div>
    </div>
  );
}
