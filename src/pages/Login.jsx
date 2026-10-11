import { useState } from "react";
import { Fingerprint, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

import StarfieldBackground from "../components/StarfieldBackground";
import { usePasskeysExist } from "../hooks/useQueryHooks";
import { registerPasskey, requestApproval } from "../lib/webauthn";

export default function Login({ onSignedIn }) {
  const { data: hasPasskeys, isLoading } = usePasskeysExist();
  const [isBusy, setIsBusy] = useState(false);
  const queryClient = useQueryClient();

  const complete = async () => {
    await queryClient.invalidateQueries({ queryKey: ["session"] });
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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-obsidian px-6">
      <StarfieldBackground />
      <div className="pointer-events-none absolute inset-x-0 top-1/3 z-0 h-96 bg-gradient-to-b from-blue-500/[0.08] to-transparent blur-2xl" />

      <div className="animate-fade-up relative z-10 w-full max-w-sm text-center">
        <div className="mb-10 flex items-center justify-center gap-2">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#18181b" />
            <path d="M8 20 L16 10 L24 20" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-display text-sm font-semibold tracking-tight text-zinc-200">Subgrid</span>
        </div>

        {isLoading ? (
          <div className="text-xs text-zinc-600">Loading...</div>
        ) : hasPasskeys ? (
          <>
            <KeyRound size={22} className="mx-auto mb-4 text-zinc-600" />
            <h1 className="font-display mb-2 text-2xl font-medium text-zinc-100">Sign in</h1>
            <p className="mb-8 text-sm leading-relaxed text-zinc-500">Use the passkey registered to this Subgrid instance.</p>
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isBusy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Fingerprint size={16} className={isBusy ? "animate-pulse" : ""} />
              {isBusy ? "Waiting for your passkey..." : "Sign in with passkey"}
            </button>
          </>
        ) : (
          <>
            <Fingerprint size={22} className="mx-auto mb-4 text-zinc-600" />
            <h1 className="font-display mb-2 text-2xl font-medium text-zinc-100">Secure this instance</h1>
            <p className="mb-8 text-sm leading-relaxed text-zinc-500">
              No passkey set up yet. Create one now — it's the only way in, and the only thing that can
              approve storing a secret later.
            </p>
            <button
              type="button"
              onClick={handleFirstRun}
              disabled={isBusy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Fingerprint size={16} className={isBusy ? "animate-pulse" : ""} />
              {isBusy ? "Waiting for your passkey..." : "Create your passkey"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
