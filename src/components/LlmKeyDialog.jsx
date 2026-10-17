import { useEffect, useState } from "react";
import { KeyRound, X } from "lucide-react";
import toast from "react-hot-toast";

import { requestApproval } from "../lib/webauthn";
import {
  useClearLlmSettings,
  useLlmSettings,
  usePasskeys,
  useSetLlmSettings,
} from "../hooks/useQueryHooks";

const LLM_SETTINGS_APPROVAL_ACTION = "store_llm_settings";

export default function LlmKeyDialog({ onClose }) {
  const { data: settings } = useLlmSettings();
  const { data: passkeys = [] } = usePasskeys();
  const setLlmSettings = useSetLlmSettings();
  const clearLlmSettings = useClearLlmSettings();

  const hasStoredKey = settings.source === "stored";
  const hasEnvFallback = settings.source === "env";

  const [provider, setProvider] = useState(settings.provider || "openai");
  const [apiKey, setApiKey] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    if (settings.provider) setProvider(settings.provider);
  }, [settings.provider]);

  const isBusy =
    isApproving || setLlmSettings.isPending || clearLlmSettings.isPending;

  const withApproval = async () => {
    if (passkeys.length === 0) return undefined;

    setIsApproving(true);

    let token;
    let approvalError;

    try {
      token = await requestApproval(LLM_SETTINGS_APPROVAL_ACTION);
    } catch (err) {
      approvalError = err;
    }

    setIsApproving(false);

    if (approvalError) throw approvalError;

    return token;
  };

  const handleSave = async () => {
    if (!apiKey.trim()) return;

    let approvalToken;

    try {
      approvalToken = await withApproval();
    } catch {
      toast.error("Passkey approval was cancelled or failed");
      return;
    }

    try {
      await setLlmSettings.mutateAsync({
        provider,
        apiKey: apiKey.trim(),
        approvalToken,
      });

      onClose();
    } catch (err) {
      toast.error(err.message || "Could not save the API key");
    }
  };

  const handleClear = async () => {
    let approvalToken;

    try {
      approvalToken = await withApproval();
    } catch {
      toast.error("Passkey approval was cancelled or failed");
      return;
    }

    try {
      await clearLlmSettings.mutateAsync(approvalToken);

      onClose();
    } catch (err) {
      toast.error(err.message || "Could not remove the saved key");
    }
  };

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Planner API key"
      onClick={onClose}
    >
      <div
        className="animate-scale-in w-full max-w-sm overflow-hidden rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-[color:var(--border)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--surface-raised)]">
              <KeyRound size={14} className="text-[color:var(--text-dim)]" />
            </span>
            <h3 className="text-[14px] font-medium text-[color:var(--text)]">
              {hasStoredKey ? "Update planner API key" : "Add a planner API key"}
            </h3>
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

        <div className="px-5 py-4">
          <p className="mb-4 text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">
            Most requests that name a connected component resolve without an
            LLM. Free-form requests that need judgement call out to OpenAI or
            OpenRouter. This key is stored encrypted on the server and used
            for every planning request on this instance —{" "}
            {hasStoredKey
              ? "entering a new one replaces it for everyone, not just you."
              : hasEnvFallback
                ? "this instance already has one configured via environment variables; setting one here overrides it for everyone."
                : "it's not shared with anyone outside this instance."}
          </p>

          <label className="mb-3 block">
            <span className="mb-1 block font-mono text-[10px] text-[color:var(--text-dim)]">
              Provider
            </span>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-raised)] px-2.5 py-1.5 text-[12.5px] text-[color:var(--text)] focus:border-[color:var(--brand)] focus:outline-none"
            >
              <option value="openai">OpenAI</option>
              <option value="openrouter">OpenRouter</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block font-mono text-[10px] text-[color:var(--text-dim)]">
              API key
            </span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasStoredKey ? "Already set on this instance" : "sk-..."}
              className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-raised)] px-2.5 py-1.5 font-mono text-[12.5px] text-[color:var(--text)] placeholder:text-[color:var(--text-faint)] focus:border-[color:var(--brand)] focus:outline-none"
            />
          </label>
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-[color:var(--border)] px-5 py-4">
          {hasStoredKey ? (
            <button
              type="button"
              onClick={handleClear}
              disabled={isBusy}
              className="font-mono text-[11px] text-rose-400 transition-colors hover:text-rose-300 disabled:opacity-50"
            >
              Remove saved key
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!apiKey.trim() || isBusy}
            className="btn-primary !py-2"
          >
            {isApproving ? "Approving…" : hasStoredKey ? "Update" : "Save"}
          </button>
        </footer>
      </div>
    </div>
  );
}
