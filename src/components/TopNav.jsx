import { useState } from "react";
import { NavLink } from "react-router-dom";
import { KeyRound, LogOut, Package } from "lucide-react";

import PasskeySettings from "./PasskeySettings";
import { useLogout } from "../hooks/useQueryHooks";

const navLinkClass = ({ isActive }) =>
  `rounded-md px-2 py-1 text-[13px] transition-colors ${isActive ? "bg-zinc-900 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`;

export default function TopNav({ extra }) {
  const [showPasskeys, setShowPasskeys] = useState(false);
  const logout = useLogout();

  return (
    <>
      <header className="relative z-10 flex items-center justify-between border-b border-zinc-900/80 px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none" className="shrink-0">
            <rect width="32" height="32" rx="8" fill="#18181b" />
            <path d="M8 20 L16 10 L24 20" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-display text-[14px] font-semibold text-zinc-100">Subgrid</span>

          <nav className="ml-2 flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/products" className={navLinkClass}>
              <span className="flex items-center gap-1">
                <Package size={12} />
                Products
              </span>
            </NavLink>
          </nav>

          {extra && (
            <>
              <span className="text-zinc-800">/</span>
              {extra}
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowPasskeys(true)}
            title="Passkeys"
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
          >
            <KeyRound size={15} />
          </button>
          <button
            type="button"
            onClick={() => logout.mutate()}
            title="Sign out"
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {showPasskeys && <PasskeySettings onClose={() => setShowPasskeys(false)} />}
    </>
  );
}
