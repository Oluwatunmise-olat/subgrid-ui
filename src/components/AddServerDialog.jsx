import { useEffect, useRef, useState } from "react";

import {
  ArrowLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  Fingerprint,
  Info,
  Lock,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { slugify } from "../lib/utils";
import { brandFor } from "../lib/brand";
import { requestApproval } from "../lib/webauthn";
import { useCatalog, usePasskeys } from "../hooks/useQueryHooks";
import oauthService from "../services/oauth.service";

const FIELD =
  "w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2.5 text-[13px] text-[color:var(--text)] outline-none transition-colors placeholder:text-[color:var(--text-faint)] focus:border-[color:var(--brand)]";

const LABEL = "mb-1.5 block text-xs font-medium text-[color:var(--text-dim)]";

const fieldWarning = (key, value) => {
  const v = (value || "").trim();

  if (!v) return null;

  if (key === "CLOUDFLARE_ZONE_ID" && !/^[a-f0-9]{32}$/i.test(v)) {
    return "That doesn't look like a Zone ID. A Zone ID is a 32-character hex string (e.g. 023e105f4ecef8ad9ca31a8372d0c353) — it is not the domain name. Open the domain in Cloudflare and copy the Zone ID from the Overview page's right sidebar.";
  }

  return null;
};

function PickerList({ onPick, selectedId }) {
  const { data: catalog } = useCatalog();

  const integrations = catalog.integrations;

  const [q, setQ] = useState("");

  const filtered = integrations.filter(
    (i) =>
      !q.trim() ||
      `${i.name} ${i.description} ${i.id}`
        .toLowerCase()
        .includes(q.trim().toLowerCase()),
  );

  const grouped = Object.keys(catalog.categories)
    .map((category) => ({
      category,
      items: filtered.filter((i) => i.category === category),
    }))
    .filter((g) => g.items.length);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="well mb-3 flex shrink-0 items-center gap-2 rounded-xl px-3 py-2">
        <Search size={13} className="shrink-0 text-[color:var(--text-faint)]" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Cloudinary, Resend, DNS..."
          className="w-full bg-transparent text-[13px] text-[color:var(--text)] placeholder:text-[color:var(--text-faint)] focus:outline-none"
        />
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {grouped.map(({ category, items }) => (
          <div key={category}>
            <h4 className="eyebrow mb-1.5 px-1">{catalog.categories[category]}</h4>
            <div className="space-y-1">
              {items.map((integration) => {
                const { Icon } = brandFor(integration.id);

                const active = selectedId === integration.id;

                return (
                  <button
                    key={integration.id}
                    type="button"
                    onClick={() => onPick(integration)}
                    className={`connector-option group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                      active
                        ? "connector-option-active"
                        : "border-transparent hover:border-[color:var(--border)] hover:bg-[color:var(--surface-sunken)]"
                    }`}
                  >
                    <div className="well flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                      <Icon
                        size={15}
                        strokeWidth={1.8}
                        className="text-[color:var(--text-dim)]"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[13px] font-medium text-[color:var(--text)]">
                          {integration.name}
                        </span>
                        {integration.official && (
                          <span
                            title="Published and hosted by the vendor"
                            className="shrink-0 rounded border border-emerald-400/30 bg-emerald-400/10 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-emerald-300"
                          >
                            Official
                          </span>
                        )}
                        {integration.firstParty && (
                          <span
                            title="Written and run by Subgrid — not a third-party package"
                            className="shrink-0 rounded border border-[color:var(--brand-line)] bg-[color:var(--brand-soft)] px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-[color:var(--brand)]"
                          >
                            First-party
                          </span>
                        )}
                      </div>
                      <div className="truncate text-[11px] text-[color:var(--text-dim)]">
                        {integration.description}
                      </div>
                    </div>
                    <ArrowUpRight
                      size={13}
                      className="shrink-0 text-[color:var(--text-faint)] transition-colors group-hover:text-[color:var(--text-dim)]"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-xs text-[color:var(--text-faint)]">
            No matches for "{q}".
          </p>
        )}
      </div>
    </div>
  );
}

function HelpSheet({ integration, onClose }) {
  const setup = integration.steps
    ? { steps: integration.steps, docs: integration.docs?.url }
    : null;

  const { Icon } = brandFor(integration.id);

  if (!setup) return null;

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-[60] flex justify-end bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <aside
        className="animate-sheet-in flex h-full w-[min(440px,100vw)] flex-col border-l border-[color:var(--border-strong)] bg-[#1c1c23]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start gap-3 border-b border-[color:var(--border)] px-5 py-4">
          <span className="well flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
            <Icon
              size={16}
              strokeWidth={1.8}
              className="text-[color:var(--text-dim)]"
            />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-semibold text-[color:var(--text)]">
              How to connect {integration.name}
            </h3>
            <p className="mt-0.5 text-[11px] text-[color:var(--text-dim)]">
              {integration.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-[color:var(--text-faint)] transition-colors hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--text)]"
          >
            <X size={15} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <ol className="space-y-3.5">
            {setup.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[color:var(--border)] font-mono text-[10px] text-[color:var(--text-dim)]">
                  {i + 1}
                </span>
                <span className="text-[12.5px] leading-relaxed text-[color:var(--text)]">
                  {step}
                </span>
              </li>
            ))}
          </ol>

          {setup.docs && (
            <a
              href={setup.docs}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-1.5 text-[12px] font-medium text-[color:var(--brand)] transition-colors hover:text-[color:var(--brand-strong)]"
            >
              Open {integration.name} <ArrowUpRight size={12} />
            </a>
          )}
        </div>
      </aside>
    </div>
  );
}

function SecretField({
  field,
  value,
  show,
  onToggle,
  onChange,
  sources,
  reusedFrom,
  onReuse,
  onClearReuse,
}) {
  const reused = Boolean(reusedFrom);

  const warning = fieldWarning(field.key, value);

  return (
    <div>
      <label className={`${LABEL} flex items-center justify-between`}>
        <span className="flex items-center gap-1.5">
          <Lock size={11} className="text-[color:var(--text-faint)]" />
          {field.label}
          <span className="font-mono text-[10px] text-[color:var(--text-faint)]">
            {field.key}
          </span>
        </span>
        {field.type === "password" && !reused && (
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-1 text-[11px] text-[color:var(--text-faint)] hover:text-[color:var(--text-dim)]"
          >
            {show ? <EyeOff size={11} /> : <Eye size={11} />}{" "}
            {show ? "Hide" : "Show"}
          </button>
        )}
      </label>

      {reused ? (
        <div className="flex items-center gap-2 rounded-lg border border-[color:var(--brand-line)] bg-[color:var(--brand-soft)] px-3 py-2.5">
          <Lock size={12} className="shrink-0 text-[color:var(--brand)]" />
          <span className="min-w-0 flex-1 truncate text-[12px] text-[color:var(--text)]">
            Reusing secret from “{reusedFrom.name}”
          </span>
          <button
            type="button"
            onClick={onClearReuse}
            className="shrink-0 text-[11px] text-[color:var(--text-dim)] hover:text-[color:var(--text)]"
          >
            Enter new
          </button>
        </div>
      ) : (
        <input
          required={field.required !== false && !sources?.length}
          type={field.type === "password" && !show ? "password" : "text"}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${FIELD} font-mono text-[12px] ${warning ? "border-amber-400/50" : ""}`}
          autoComplete="off"
          spellCheck={false}
        />
      )}

      {!reused && warning && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-amber-400">
          {warning}
        </p>
      )}

      {!reused && sources?.length > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[10.5px] text-[color:var(--text-faint)]">
            Reuse from:
          </span>
          {sources.map((source) => (
            <button
              key={source.id}
              type="button"
              onClick={() => onReuse(source.id)}
              className="rounded-full border border-[color:var(--border)] px-2 py-0.5 text-[10.5px] text-[color:var(--text-dim)] transition-colors hover:border-[color:var(--brand)] hover:text-[color:var(--text)]"
            >
              {source.name}
            </button>
          ))}
        </div>
      )}
      {!reused && field.help && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--text-dim)]">
          {field.help}
        </p>
      )}
    </div>
  );
}

function KnownIntegrationForm({
  integration,
  onBack,
  onSubmit,
  isSubmitting,
  existingServers = [],
}) {
  const [name, setName] = useState(integration.name);

  const [values, setValues] = useState({});

  const [showSecrets, setShowSecrets] = useState({});

  const [reuse, setReuse] = useState({});

  const [showHelp, setShowHelp] = useState(false);

  const { Icon } = brandFor(integration.id);

  const handleSubmit = (e) => {
    e.preventDefault();

    const env = Object.fromEntries(
      integration.fields
        .filter((field) => !reuse[field.key])
        .map((field) => [
          field.key,
          values[field.key] ||
            (field.required === false ? field.defaultValue || "" : ""),
        ]),
    );

    onSubmit({
      name,
      slug: slugify(name),
      integration_id: integration.id,
      env,
      ...(Object.keys(reuse).length ? { reuse_keys: reuse } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 flex w-fit items-center gap-1 text-xs text-[color:var(--text-dim)] hover:text-[color:var(--text)]"
      >
        <ArrowLeft size={12} /> All components
      </button>

      <div className="mb-4 flex items-center gap-3">
        <div className="well flex h-11 w-11 items-center justify-center rounded-xl">
          <Icon
            size={18}
            strokeWidth={1.8}
            className="text-[color:var(--text-dim)]"
          />
        </div>
        <div>
          <h3 className="font-display text-[15px] font-semibold text-[color:var(--text)]">
            {integration.name}
          </h3>
          <p className="text-[11px] text-[color:var(--text-dim)]">
            {integration.description}
          </p>
        </div>
      </div>

      {integration.steps && (
        <button
          type="button"
          onClick={() => setShowHelp(true)}
          className="mb-4 flex w-full items-center gap-2.5 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-sunken)] px-3 py-2.5 text-left text-[11.5px] text-[color:var(--text-dim)] transition-colors hover:border-[color:var(--border-strong)] hover:text-[color:var(--text)]"
        >
          <Info size={13} className="shrink-0 text-[color:var(--brand)]" />
          <span className="min-w-0 flex-1">
            How to connect — step-by-step guide
          </span>
          <ArrowUpRight
            size={12}
            className="shrink-0 text-[color:var(--text-faint)]"
          />
        </button>
      )}

      {integration.setupNote && (
        <div className="mb-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-sunken)] px-3 py-2.5 text-[11px] leading-relaxed text-[color:var(--text-dim)]">
          {integration.setupNote}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className={LABEL}>Display name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={FIELD}
          />
          <p className="mt-1 font-mono text-[10px] text-[color:var(--text-faint)]">
            slug: {slugify(name) || "—"}
          </p>
        </div>

        <div className="space-y-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-sunken)]/40 p-3">
          {integration.fields.map((field) => (
            <SecretField
              key={field.key}
              field={field}
              value={values[field.key] || ""}
              show={showSecrets[field.key]}
              onToggle={() =>
                setShowSecrets((s) => ({ ...s, [field.key]: !s[field.key] }))
              }
              onChange={(v) =>
                setValues((prev) => ({ ...prev, [field.key]: v }))
              }
              sources={existingServers.filter((s) =>
                (s.secret_keys || []).includes(field.key),
              )}
              reusedFrom={
                reuse[field.key]
                  ? existingServers.find((s) => s.id === reuse[field.key])
                  : null
              }
              onReuse={(sourceId) =>
                setReuse((r) => ({ ...r, [field.key]: sourceId }))
              }
              onClearReuse={() =>
                setReuse((r) => {
                  const next = { ...r };

                  delete next[field.key];

                  return next;
                })
              }
            />
          ))}
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-sunken)]/60 px-3 py-2.5">
          <ShieldCheck size={13} className="mt-0.5 shrink-0 text-emerald-400" />
          <p className="text-[11px] leading-relaxed text-[color:var(--text-dim)]">
            AES-GCM encrypted at rest. Never returned by the API. You'll tap
            your passkey once to approve storing these — that's the only code
            path that can decrypt them.
          </p>
        </div>
      </div>

      <div className="sticky bottom-0 mt-5 border-t border-[color:var(--border)] bg-[color:var(--surface)] pb-1 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full justify-center py-2.5"
        >
          {isSubmitting ? "Connecting..." : `Connect ${integration.name}`}
        </button>
      </div>

      {showHelp && (
        <HelpSheet
          integration={integration}
          onClose={() => setShowHelp(false)}
        />
      )}
    </form>
  );
}

function OAuthIntegrationForm({ integration, onBack, onSubmit, isSubmitting }) {
  const [name, setName] = useState(integration.name);

  const { Icon } = brandFor(integration.id);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          name,
          slug: slugify(name),
          integration_id: integration.id,
        });
      }}
    >
      <button
        type="button"
        onClick={onBack}
        className="mb-3 flex w-fit items-center gap-1 text-xs text-[color:var(--text-dim)] hover:text-[color:var(--text)]"
      >
        <ArrowLeft size={12} /> All components
      </button>
      <div className="mb-4 flex items-center gap-3">
        <div className="well flex h-11 w-11 items-center justify-center rounded-xl">
          <Icon
            size={18}
            strokeWidth={1.8}
            className="text-[color:var(--text-dim)]"
          />
        </div>
        <div>
          <h3 className="font-display text-[15px] font-semibold text-[color:var(--text)]">
            {integration.name}
          </h3>
          <p className="text-[11px] text-[color:var(--text-dim)]">
            {integration.description}
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className={LABEL}>Display name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={FIELD}
          />
        </div>
        <div className="connector-oauth-note rounded-xl border px-3 py-3">
          <p className="text-[12px] leading-relaxed">
            No secret to paste. After creating the component you'll be sent to{" "}
            {integration.name} to sign in — Subgrid stores only the resulting
            tokens, encrypted.
          </p>
        </div>
      </div>
      <div className="sticky bottom-0 mt-5 border-t border-[color:var(--border)] bg-[color:var(--surface)] pb-1 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full justify-center py-2.5"
        >
          {isSubmitting ? "Creating..." : `Continue to ${integration.name}`}{" "}
          <ArrowUpRight size={14} />
        </button>
      </div>
    </form>
  );
}

function BridgePresetForm({
  onBack,
  onSubmit,
  isSubmitting,
  existingServers = [],
  initialPresetId = null,
}) {
  const [presetId, setPresetId] = useState(initialPresetId);

  const [name, setName] = useState("");

  const [values, setValues] = useState({});

  const [showSecrets, setShowSecrets] = useState({});

  const [reuse, setReuse] = useState({});

  const { data: catalog } = useCatalog();

  const presets = catalog.presets;

  const preset = presets.find((entry) => entry.id === presetId) || null;

  useEffect(() => {
    if (preset) setName(preset.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetId]);

  if (!preset) {
    return (
      <>
        <button
          type="button"
          onClick={onBack}
          className="mb-3 flex w-fit items-center gap-1 text-xs text-[color:var(--text-dim)] hover:text-[color:var(--text)]"
        >
          <ArrowLeft size={12} /> All components
        </button>
        <div className="mb-4">
          <h3 className="font-display text-[15px] font-semibold text-[color:var(--text)]">
            Vendor API
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--text-dim)]">
            Each of these runs{" "}
            <strong className="font-medium text-[color:var(--text)]">
              our own bridge
            </strong>{" "}
            — one small server that calls a vendor&rsquo;s documented REST API,
            and can only ever reach the host configured for it. No community
            package, no third-party process holding your token.
          </p>
        </div>
        <div className="space-y-1.5">
          {presets.map((entry) => {
            const { Icon } = brandFor(entry.provider);

            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setPresetId(entry.id)}
                className="flex w-full items-start gap-3 rounded-xl border border-[color:var(--border)] px-3 py-3 text-left transition-colors hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-sunken)]"
              >
                <span className="well flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <Icon size={15} className="text-[color:var(--text-dim)]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[13px] font-medium text-[color:var(--text)]">
                      {entry.name}
                    </span>
                    <span className="shrink-0 rounded border border-[color:var(--border)] px-1 py-px font-mono text-[9px] uppercase tracking-wide text-[color:var(--text-faint)]">
                      {entry.kind === "s3" ? "S3" : "REST"}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[11px] text-[color:var(--text-dim)]">
                    {entry.description}
                  </span>
                  <span className="mt-1 block truncate font-mono text-[10px] text-[color:var(--text-faint)]">
                    {entry.verbNames.length} tools · {entry.authority}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </>
    );
  }

  const { Icon } = brandFor(preset.provider);

  const isS3 = preset.kind === "s3";

  const allFields = [
    ...(preset.fields || []),
    ...(preset.optionalFields || []),
  ];

  const handleSubmit = (event) => {
    event.preventDefault();

    const env = Object.fromEntries(
      allFields
        .filter(
          (field) => !reuse[field.key] && (values[field.key] || "").trim(),
        )
        .map((field) => [field.key, values[field.key]]),
    );

    onSubmit({
      name,
      slug: slugify(name),
      preset_id: preset.id,
      env,
      ...(Object.keys(reuse).length ? { reuse_keys: reuse } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="button"
        onClick={() => {
          setPresetId(null);
          setValues({});
          setReuse({});
        }}
        className="mb-3 flex w-fit items-center gap-1 text-xs text-[color:var(--text-dim)] hover:text-[color:var(--text)]"
      >
        <ArrowLeft size={12} /> Providers
      </button>

      <div className="mb-4 flex items-center gap-3">
        <div className="well flex h-11 w-11 items-center justify-center rounded-xl">
          <Icon
            size={18}
            strokeWidth={1.8}
            className="text-[color:var(--text-dim)]"
          />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-[15px] font-semibold text-[color:var(--text)]">
            {preset.name}
          </h3>
          <p className="text-[11px] text-[color:var(--text-dim)]">
            {preset.description}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className={LABEL}>Display name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={FIELD}
          />
          <p className="mt-1 font-mono text-[10px] text-[color:var(--text-faint)]">
            slug: {slugify(name) || "—"}
          </p>
        </div>

        {preset.note && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-3 py-2.5">
            <Info size={13} className="mt-0.5 shrink-0 text-amber-300" />
            <p className="text-[11px] leading-relaxed text-amber-200/90">
              {preset.note}
            </p>
          </div>
        )}

        {allFields.length > 0 && (
          <div className="space-y-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-sunken)]/40 p-3">
            {allFields.map((field) => (
              <SecretField
                key={field.key}
                field={field}
                value={values[field.key] || ""}
                show={showSecrets[field.key]}
                onToggle={() =>
                  setShowSecrets((s) => ({ ...s, [field.key]: !s[field.key] }))
                }
                onChange={(v) =>
                  setValues((prev) => ({ ...prev, [field.key]: v }))
                }
                sources={existingServers.filter((s) =>
                  (s.secret_keys || []).includes(field.key),
                )}
                reusedFrom={
                  reuse[field.key]
                    ? existingServers.find((s) => s.id === reuse[field.key])
                    : null
                }
                onReuse={(sourceId) =>
                  setReuse((r) => ({ ...r, [field.key]: sourceId }))
                }
                onClearReuse={() =>
                  setReuse((r) => {
                    const next = { ...r };

                    delete next[field.key];

                    return next;
                  })
                }
              />
            ))}
          </div>
        )}

        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-sunken)]/60 px-3 py-2.5">
          <p className="text-[11px] leading-relaxed text-[color:var(--text-dim)]">
            <span className="font-medium text-[color:var(--text)]">
              Boundary:
            </span>{" "}
            {isS3 ? (
              <>
                this component talks only to the endpoint you configure, with
                every request signed using this component&rsquo;s own keys.
                Nothing is read from your machine and no global login is
                involved.
              </>
            ) : (
              <>
                this component can only ever call{" "}
                <span className="font-mono text-[10.5px]">
                  {preset.authority}
                </span>
                .
              </>
            )}{" "}
            It exposes {preset.verbNames.length} tools —{" "}
            <span className="font-mono text-[10.5px]">
              {preset.verbNames.join(", ")}
            </span>
            . Anything else is refused before anything runs.
          </p>
          {preset.limits && (
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-[color:var(--text-faint)]">
              {preset.limits}
            </p>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 mt-5 border-t border-[color:var(--border)] bg-[color:var(--surface)] pb-1 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full justify-center py-2.5"
        >
          {isSubmitting ? "Connecting..." : `Connect ${preset.name}`}
        </button>
      </div>
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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const parsedEnv = env
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .reduce((acc, line) => {
            const idx = line.indexOf("=");
            if (idx !== -1)
              acc[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
            return acc;
          }, {});
        onSubmit({
          name,
          slug: slugify(name),
          category: "other",
          transport: isStdio ? "stdio" : "sse",
          ...(isStdio
            ? { command, args: args ? args.split(" ").filter(Boolean) : [] }
            : { url }),
          ...(Object.keys(parsedEnv).length ? { env: parsedEnv } : {}),
        });
      }}
    >
      <button
        type="button"
        onClick={onBack}
        className="mb-3 flex w-fit items-center gap-1 text-xs text-[color:var(--text-dim)] hover:text-[color:var(--text)]"
      >
        <ArrowLeft size={12} /> All components
      </button>
      <div className="space-y-3">
        <div>
          <label className={LABEL}>Display name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My MCP server"
            className={FIELD}
          />
        </div>
        {isStdio ? (
          <>
            <div>
              <label className={LABEL}>Command</label>
              <input
                required
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="npx"
                className={`${FIELD} font-mono`}
              />
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
            <input
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className={`${FIELD} font-mono`}
            />
          </div>
        )}
        <div>
          <label className={LABEL}>Secrets — one KEY=value per line</label>
          <textarea
            value={env}
            onChange={(e) => setEnv(e.target.value)}
            rows={3}
            placeholder="API_TOKEN=..."
            className={`${FIELD} font-mono text-xs`}
          />
        </div>
      </div>
      <div className="sticky bottom-0 mt-5 border-t border-[color:var(--border)] bg-[color:var(--surface)] pb-1 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full justify-center py-2.5"
        >
          {isSubmitting ? "Registering..." : "Register server"}
        </button>
      </div>
    </form>
  );
}

export default function AddServerDialog({
  projectId,
  initialIntegrationId,
  existingServers = [],
  onClose,
  onSubmit,
  isSubmitting,
}) {
  const { data: catalog } = useCatalog();

  const integrations = catalog.integrations;

  const initialPresetId = catalog.presets.some(
    (item) => item.id === initialIntegrationId,
  )
    ? initialIntegrationId
    : null;

  const [integration, setIntegration] = useState(null);

  const [isApproving, setIsApproving] = useState(false);

  const submittingRef = useRef(false);

  const { data: passkeys = [] } = usePasskeys();

  useEffect(() => {
    setIntegration((current) => {
      if (current && integrations.some((item) => item.id === current.id))
        return current;

      if (initialPresetId) {
        return (
          integrations.find((item) => item.custom === "bridge") ||
          integrations[0] ||
          null
        );
      }

      return (
        integrations.find((item) => item.id === initialIntegrationId) ||
        integrations[0] ||
        null
      );
    });
  }, [initialIntegrationId, initialPresetId, integrations]);

  const handleFormSubmit = async (payload) => {
    if (submittingRef.current) return;

    submittingRef.current = true;

    try {
      const hasSecrets = payload.env && Object.keys(payload.env).length > 0;

      if (hasSecrets && passkeys.length > 0) {
        try {
          setIsApproving(true);

          payload.approval_token = await requestApproval(
            "store_server_secrets",
          );
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

          const url = res?.data?.authorize_url;

          if (url) {
            window.location.href = url;

            return;
          }
        } catch (err) {
          toast.error(err.message || "Could not start the OAuth flow");
        }
      }
    } finally {
      submittingRef.current = false;
    }
  };

  const busy = isSubmitting || isApproving;

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="connector-dialog animate-scale-in panel-solid flex h-[min(640px,calc(100vh-48px))] max-h-[calc(100vh-48px)] w-full max-w-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="connector-sidebar flex h-full min-h-0 w-[300px] shrink-0 flex-col border-r border-[color:var(--border)] bg-[color:var(--surface-sunken)]/60 p-4">
          <div className="mb-2 flex shrink-0 items-center justify-between px-1">
            <h3 className="font-display text-[13px] font-semibold text-[color:var(--text)]">
              Connect a component
            </h3>
          </div>
          <div className="min-h-0 flex-1">
            <PickerList onPick={setIntegration} selectedId={integration?.id} />
          </div>
        </div>

        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-5">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[color:var(--text-faint)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--text-dim)]"
            >
              <X size={16} />
            </button>
          </div>
          <div className="min-h-0 min-w-0 h-0 flex-1 overflow-y-auto">
            {!integration && (
              <div className="flex min-h-full flex-col items-center justify-center gap-2 px-6 py-8 text-center">
                <Fingerprint
                  size={20}
                  className="text-[color:var(--text-faint)]"
                />
                <p className="text-[13px] text-[color:var(--text-dim)]">
                  Select a component on the left
                </p>
                <p className="max-w-[260px] text-[11px] leading-relaxed text-[color:var(--text-faint)]">
                  Secrets are encrypted and passkey-approved.
                </p>
              </div>
            )}
            {integration?.oauth && (
              <OAuthIntegrationForm
                key={integration.id}
                integration={integration}
                onBack={() => setIntegration(integrations[0] || null)}
                onSubmit={handleFormSubmit}
                isSubmitting={busy}
              />
            )}
            {integration && !integration.custom && !integration.oauth && (
              <KnownIntegrationForm
                key={integration.id}
                integration={integration}
                existingServers={existingServers}
                onBack={() => setIntegration(integrations[0] || null)}
                onSubmit={handleFormSubmit}
                isSubmitting={busy}
              />
            )}
            {integration?.custom === "bridge" && (
              <BridgePresetForm
                key={integration.id}
                onBack={() => setIntegration(integrations[0] || null)}
                onSubmit={handleFormSubmit}
                isSubmitting={busy}
                existingServers={existingServers}
                initialPresetId={initialPresetId}
              />
            )}
            {integration?.custom && integration.custom !== "bridge" && (
              <CustomForm
                key={integration.id}
                integration={integration}
                onBack={() => setIntegration(integrations[0] || null)}
                onSubmit={handleFormSubmit}
                isSubmitting={busy}
              />
            )}
          </div>
          {isApproving && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-[color:var(--brand)]/20 bg-[color:var(--brand-dim)] px-3 py-2.5 text-xs text-blue-700">
              <Fingerprint size={14} className="shrink-0 animate-pulse" />
              Waiting for your passkey — tap to approve storing these secrets...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
