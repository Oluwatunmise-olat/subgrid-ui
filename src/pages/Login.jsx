import { useState } from "react";
import { Fingerprint, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

import { usePasskeysExist } from "../hooks/useQueryHooks";
import { registerPasskey, requestApproval } from "../lib/webauthn";
import { QUERY_KEYS } from "../lib/constants";

export default function Login({ onSignedIn }) {
  const { data: hasPasskeys, isLoading } = usePasskeysExist();

  const [isBusy, setIsBusy] = useState(false);

  const queryClient = useQueryClient();

  const complete = async () => {
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.session] });

    onSignedIn();
  };

  const handleSignIn = async () => {
    try {
      setIsBusy(true);

      await requestApproval("login");

      await complete();
    } catch (err) {
      toast.error(err?.message || "Sign-in was cancelled");
    } finally {
      setIsBusy(false);
    }
  };

  const handleFirstRun = async () => {
    try {
      setIsBusy(true);

      await registerPasskey("Primary passkey");

      await complete();
    } catch (err) {
      toast.error(err?.message || "Could not set up your passkey");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-obsidian px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-white/[0.06] to-transparent" />
      <div className="animate-fade-up relative w-full max-w-[420px]">
        <div className="mb-12 flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <rect
              width="32"
              height="32"
              rx="8"
              fill="#f4f4f6"
              className="logo-mark-rect"
            />
            <path
              d="M8 20 L16 10 L24 20"
              stroke="#0b0b0f"
              className="logo-mark-path"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-display text-sm font-semibold text-[color:var(--text)]">
            Subgrid
          </span>
          <span className="ml-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--text-dim)]">
            Control plane
          </span>
        </div>

        {isLoading ? (
          <div className="text-xs text-[color:var(--text-faint)]">
            Loading...
          </div>
        ) : hasPasskeys ? (
          <>
            <div className="eyebrow mb-3">Secure workspace</div>
            <div className="well mb-5 flex h-11 w-11 items-center justify-center rounded-xl">
              <KeyRound size={18} className="text-[color:var(--text-dim)]" />
            </div>
            <h1 className="font-display mb-2 text-[30px] font-semibold text-[color:var(--text)]">
              Welcome back.
            </h1>
            <p className="mb-8 max-w-sm text-[13px] leading-relaxed text-[color:var(--text-dim)]">
              Sign in with the passkey registered to this Subgrid instance to
              access your projects and production connections.
            </p>
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isBusy}
              className="btn-primary w-full justify-center !py-3 text-[14px]"
            >
              <Fingerprint
                size={16}
                className={isBusy ? "animate-pulse" : ""}
              />
              {isBusy ? "Waiting for your passkey..." : "Sign in with passkey"}
            </button>
          </>
        ) : (
          <>
            <div className="eyebrow mb-3">First-time setup</div>
            <div className="well mb-5 flex h-11 w-11 items-center justify-center rounded-xl">
              <Fingerprint size={18} className="text-[color:var(--text-dim)]" />
            </div>
            <h1 className="font-display mb-2 text-[30px] font-semibold text-[color:var(--text)]">
              Secure this instance.
            </h1>
            <p className="mb-8 max-w-sm text-[13px] leading-relaxed text-[color:var(--text-dim)]">
              Create the first passkey. It becomes the only way into this
              workspace and the approval key for storing production secrets.
            </p>
            <button
              type="button"
              onClick={handleFirstRun}
              disabled={isBusy}
              className="btn-primary w-full justify-center !py-3 text-[14px]"
            >
              <Fingerprint
                size={16}
                className={isBusy ? "animate-pulse" : ""}
              />
              {isBusy ? "Waiting for your passkey..." : "Create your passkey"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
