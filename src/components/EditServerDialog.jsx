import { useState } from "react";
import { Eye, EyeOff, Info, Lock, X } from "lucide-react";
import toast from "react-hot-toast";

import { useCatalog, usePasskeys } from "../hooks/useQueryHooks";
import { brandFor } from "../lib/brand";
import { requestApproval } from "../lib/webauthn";

const FIELD =
  "w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-sunken)] px-3 py-2.5 text-[13px] text-[color:var(--text)] outline-none transition-colors placeholder:text-[color:var(--text-faint)] focus:border-[color:var(--brand)]";

const LABEL = "mb-1.5 block text-xs font-medium text-[color:var(--text-dim)]";

export default function EditServerDialog({
  server,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  const { data: catalog } = useCatalog();

  const integration = catalog.integrations.find(
    (item) => item.id === (server.catalog_id || server.provider),
  );

  const preset = catalog.presets.find((item) => item.id === server.catalog_id);

  const fields = integration?.fields
    ? integration.fields
    : [...(preset?.fields || []), ...(preset?.optionalFields || [])];

  const displayName = integration?.name || preset?.name || server.name;

  const { Icon } = brandFor(server.provider);

  const { data: passkeys = [] } = usePasskeys();

  const existingKeys = server.secret_keys || [];

  const [name, setName] = useState(server.name);

  const [values, setValues] = useState({});

  const [showSecrets, setShowSecrets] = useState({});

  const [isApproving, setIsApproving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const env = Object.fromEntries(
      fields
        .filter((field) => (values[field.key] || "").trim() !== "")
        .map((field) => [field.key, values[field.key].trim()]),
    );

    const hasSecrets = Object.keys(env).length > 0;

    let approval_token;

    if (hasSecrets && passkeys.length > 0) {
      try {
        setIsApproving(true);

        approval_token = await requestApproval("store_server_secrets");
      } catch {
        toast.error("Passkey approval was cancelled or failed");

        setIsApproving(false);

        return;
      }

      setIsApproving(false);
    }

    onSubmit({ name, env, approval_token });
  };

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-scale-in panel-solid flex max-h-[calc(100vh-48px)] w-full max-w-md flex-col overflow-hidden"
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
              Edit {server.name}
            </h3>
            <p className="mt-0.5 text-[11px] text-[color:var(--text-dim)]">
              {fields.length > 0
                ? "Change credentials or configuration."
                : "This component was added manually."}
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

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div>
              <label className={LABEL}>Display name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={FIELD}
              />
            </div>

            {fields.length > 0 ? (
              <div className="space-y-3.5">
                {fields.map((field) => {
                  const isSet = existingKeys.includes(field.key);

                  const warning =
                    field.key === "CLOUDFLARE_ZONE_ID" &&
                    (values[field.key] || "").trim() &&
                    !/^[a-f0-9]{32}$/i.test((values[field.key] || "").trim())
                      ? "That doesn't look like a Zone ID — it's a 32-character hex string, not the domain name."
                      : null;

                  return (
                    <div key={field.key}>
                      <label
                        className={`${LABEL} flex items-center justify-between`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Lock
                            size={11}
                            className="text-[color:var(--text-faint)]"
                          />
                          {field.label}
                          <span className="font-mono text-[10px] text-[color:var(--text-faint)]">
                            {field.key}
                          </span>
                        </span>
                        {field.type === "password" && (
                          <button
                            type="button"
                            onClick={() =>
                              setShowSecrets((s) => ({
                                ...s,
                                [field.key]: !s[field.key],
                              }))
                            }
                            className="flex items-center gap-1 text-[11px] text-[color:var(--text-faint)] hover:text-[color:var(--text-dim)]"
                          >
                            {showSecrets[field.key] ? (
                              <EyeOff size={11} />
                            ) : (
                              <Eye size={11} />
                            )}{" "}
                            {showSecrets[field.key] ? "Hide" : "Show"}
                          </button>
                        )}
                      </label>
                      <input
                        type={
                          field.type === "password" && !showSecrets[field.key]
                            ? "password"
                            : "text"
                        }
                        placeholder={
                          isSet
                            ? "••••••••  (leave blank to keep current)"
                            : field.placeholder
                        }
                        value={values[field.key] || ""}
                        onChange={(e) =>
                          setValues((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        className={`${FIELD} font-mono text-[12px] ${warning ? "border-amber-400/50" : ""}`}
                        autoComplete="off"
                        spellCheck={false}
                      />
                      {isSet && !(values[field.key] || "").trim() && (
                        <p className="mt-1 text-[10.5px] text-emerald-400/90">
                          Currently set — leave blank to keep it.
                        </p>
                      )}
                      {warning && (
                        <p className="mt-1.5 text-[11px] leading-relaxed text-amber-400">
                          {warning}
                        </p>
                      )}
                      {!warning && field.help && (
                        <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--text-dim)]">
                          {field.help}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[12px] leading-relaxed text-[color:var(--text-dim)]">
                This component has a custom command/URL with no declared
                credentials, so there is nothing here to edit.
              </p>
            )}

            {integration?.steps && (
              <p className="flex items-start gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-sunken)] px-3 py-2.5 text-[11px] leading-relaxed text-[color:var(--text-dim)]">
                <Info
                  size={12}
                  className="mt-0.5 shrink-0 text-[color:var(--brand)]"
                />
                Need help finding a value? Open{" "}
                <span className="text-[color:var(--text)]">
                  Connect a component
                </span>{" "}
                and use the “How to connect” guide for {displayName}.
              </p>
            )}
          </div>

          <div className="border-t border-[color:var(--border)] px-5 py-4">
            <button
              type="submit"
              disabled={isSubmitting || isApproving}
              className="btn-primary w-full justify-center py-2.5"
            >
              {isSubmitting || isApproving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
