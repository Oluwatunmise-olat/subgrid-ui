import { useState } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";

import StarfieldBackground from "../components/StarfieldBackground";
import TopNav from "../components/TopNav";
import { CATEGORIES, INTEGRATIONS } from "../lib/integrations";

export default function Products() {
  const [filter, setFilter] = useState("all");

  const visible = filter === "all" ? INTEGRATIONS : INTEGRATIONS.filter((i) => i.category === filter);
  const usedCategories = [...new Set(INTEGRATIONS.map((i) => i.category))];

  return (
    <div className="relative min-h-screen overflow-hidden bg-obsidian">
      <StarfieldBackground />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-72 bg-gradient-to-b from-blue-500/[0.07] to-transparent" />

      <TopNav />

      <main className="relative z-10 mx-auto max-w-5xl px-5 py-10">
        <h1 className="font-display mb-2 text-2xl font-medium text-zinc-100">Products</h1>
        <p className="mb-6 max-w-xl text-sm leading-relaxed text-zinc-500">
          Every integration here is a verified, real MCP server — checked against its published npm package,
          not guessed. Connect one from inside a project.
        </p>

        <div className="mb-6 flex flex-wrap gap-1.5">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="All" />
          {usedCategories.map((category) => (
            <FilterChip key={category} active={filter === category} onClick={() => setFilter(category)} label={CATEGORIES[category]} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((integration) => (
            <div key={integration.id} className="panel flex flex-col gap-3 p-4">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-zinc-100">{integration.name}</h3>
                  <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
                    {CATEGORIES[integration.category]}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-zinc-500">{integration.description}</p>
              </div>

              {integration.fields?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {integration.fields.map((field) => (
                    <span
                      key={field.key}
                      className="flex items-center gap-1 rounded-md bg-zinc-900/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500"
                    >
                      {field.type === "password" && <Lock size={9} />}
                      {field.key}
                    </span>
                  ))}
                </div>
              )}

              <Link
                to="/"
                className="mt-auto text-left text-[11px] text-zinc-500 underline decoration-zinc-700 underline-offset-2 transition-colors hover:text-zinc-300"
              >
                Connect from a project →
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function FilterChip({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active ? "border-zinc-700 bg-zinc-900 text-zinc-100" : "border-zinc-900 text-zinc-500 hover:border-zinc-800 hover:text-zinc-300"
      }`}
    >
      {label}
    </button>
  );
}
