import { useState } from "react";
import { Fingerprint, KeyRound, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

import { usePasskeys, useRemovePasskey } from "../hooks/useQueryHooks";
import { registerPasskey } from "../lib/webauthn";

export default function PasskeySettings({ onClose }) {
  const { data: passkeys = [], isLoading } = usePasskeys();
  const removePasskey = useRemovePasskey();
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAdd = async () => {
    const label = window.prompt("Name this passkey (e.g. \"MacBook Touch ID\")", "Passkey");
    if (label === null) return;

    try {
      setIsRegistering(true);
      await registerPasskey(label || "Passkey");
      toast.success("Passkey added");
    } catch (err) {
      toast.error(err?.message || "Could not register passkey");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="animate-scale-in panel-solid w-full max-w-md p-5">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <KeyRound size={15} className="text-zinc-500" />
            Passkeys
          </h3>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-200">
            <X size={16} />
          </button>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-zinc-500">
          Once you add a passkey, storing or changing any server's secrets requires a fresh tap to approve —
          Subgrid's own code decrypts secrets only to connect to a server; no model or agent ever sees them.
        </p>

        {!isLoading && passkeys.length === 0 && (
          <div className="mb-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-800 px-4 py-6 text-center">
            <Fingerprint size={18} className="text-zinc-700" />
            <p className="text-xs text-zinc-600">No passkeys yet — secrets aren't gated until you add one.</p>
          </div>
        )}

        {passkeys.length > 0 && (
          <div className="mb-4 space-y-1">
            {passkeys.map((pk) => (
              <div key={pk.id} className="flex items-center justify-between rounded-lg border border-zinc-900 bg-zinc-950/40 px-3 py-2.5">
                <div>
                  <div className="text-[13px] text-zinc-200">{pk.label || "Passkey"}</div>
                  <div className="text-[11px] text-zinc-600">
                    {pk.last_used_at ? `Last used ${new Date(pk.last_used_at).toLocaleDateString()}` : "Never used"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removePasskey.mutate(pk.id, { onSuccess: () => toast.success("Passkey removed") })}
                  className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-rose-950 hover:text-rose-400"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleAdd}
          disabled={isRegistering}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-100 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={14} />
          {isRegistering ? "Waiting for your passkey..." : "Add a passkey"}
        </button>
      </div>
    </div>
  );
}
