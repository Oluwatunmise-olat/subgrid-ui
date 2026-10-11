import { useState } from "react";
import { ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

import StarfieldBackground from "./StarfieldBackground";
import { useCreateProject } from "../hooks/useQueryHooks";

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function CreateProjectScreen({ onCreated }) {
  const [name, setName] = useState("");
  const createProject = useCreateProject();

  const handleSubmit = (e) => {
    e.preventDefault();
    const slug = slugify(name);
    if (!slug) return;

    createProject.mutate(
      { name: name.trim(), slug },
      {
        onSuccess: (res) => onCreated(res?.data?.data?.project),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-obsidian px-6">
      <StarfieldBackground />
      <div className="pointer-events-none absolute inset-x-0 top-1/3 z-0 h-96 bg-gradient-to-b from-blue-500/[0.08] to-transparent blur-2xl" />

      <div className="animate-fade-up relative z-10 w-full max-w-md text-center">
        <div className="mb-10 flex items-center justify-center gap-2">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#18181b" />
            <path d="M8 20 L16 10 L24 20" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-display text-sm font-semibold text-zinc-200">Subgrid</span>
        </div>

        <h1 className="font-display mb-2.5 text-[30px] font-medium text-zinc-100">Name your first project</h1>
        <p className="mb-9 text-[15px] leading-relaxed text-zinc-500">
          A project groups the MCP servers you connect — Coolify, Cloudflare, anything else.
        </p>

        <form onSubmit={handleSubmit} className="panel-solid flex items-center gap-2 p-1.5">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="cloaq"
            className="flex-1 bg-transparent px-3 py-2.5 text-[15px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!name.trim() || createProject.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600"
          >
            {createProject.isPending ? "Creating..." : <ArrowRight size={16} />}
          </button>
        </form>

        {name.trim() && <p className="mt-2.5 text-left font-mono text-xs text-zinc-700">slug: {slugify(name)}</p>}
      </div>
    </div>
  );
}
