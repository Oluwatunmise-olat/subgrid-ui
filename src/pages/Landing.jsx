import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Github,
  Loader2,
  Lock,
  RotateCcw,
  ShieldCheck,
  Terminal,
  Workflow,
  Wrench,
  X,
} from "lucide-react";

const REPO_URL = "https://github.com/Oluwatunmise-olat/subgrid";
const UI_REPO_URL = "https://github.com/Oluwatunmise-olat/subgrid-ui";

const STEPS = [
  {
    title: "Connect a component",
    body: "A real MCP server, or a plain REST API or S3-compatible storage service through Subgrid's own bridge. Credentials are encrypted at rest.",
  },
  {
    title: "Describe what you want done",
    body: "“Add an A record for secrets.example.com”. No dashboards to hunt through.",
  },
  {
    title: "Review the plan, approve it",
    body: "Reads happen automatically. Writes and destructive steps pause for an explicit Allow / Don’t allow.",
  },
  {
    title: "It runs, and it’s logged",
    body: "Every call is recorded immutably, with credentials masked, so you can see exactly what happened.",
  },
];

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#f4f4f6" />
      <path
        d="M8 20 L16 10 L24 20"
        stroke="#0b0b0f"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const WRITE_STATE = {
  pending: {
    label: "Needs approval",
    icon: AlertTriangle,
    cls: "text-amber-400",
    border: "border-amber-400/40",
  },
  running: {
    label: "Running…",
    icon: Loader2,
    cls: "text-[color:var(--brand)]",
    border: "border-[color:var(--brand-line)]",
  },
  approved: {
    label: "Completed",
    icon: Check,
    cls: "text-emerald-400",
    border: "border-emerald-400/40",
  },
  declined: {
    label: "Declined",
    icon: X,
    cls: "text-rose-400",
    border: "border-rose-400/40",
  },
};

function PreviewCard({ cardRef, pos, dragging, onPointerDown, children }) {
  return (
    <div
      ref={cardRef}
      onPointerDown={onPointerDown}
      className={`group/card absolute left-1/2 w-[340px] -translate-x-1/2 ${dragging ? "z-20 cursor-grabbing" : "z-10 cursor-grab"}`}
      style={{
        top: pos.y,
        transform: `translate(calc(-50% + ${pos.x}px), 0)`,
        transition: dragging
          ? "none"
          : "top 240ms var(--ease), transform 240ms var(--ease)",
      }}
    >
      <span className="pointer-events-none absolute -top-2.5 left-1/2 z-20 -translate-x-1/2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-raised)] px-2 py-px font-mono text-[9px] uppercase tracking-wide text-[color:var(--text-faint)] opacity-0 transition-opacity duration-150 group-hover/card:opacity-100">
        drag
      </span>
      {children}
    </div>
  );
}

function PlanPreview() {
  const containerRef = useRef(null);
  const readRef = useRef(null);
  const writeRef = useRef(null);

  const READ_Y = 0;
  const WRITE_Y = 232;

  const [pos, setPos] = useState({
    read: { x: 0, y: READ_Y },
    write: { x: 0, y: WRITE_Y },
  });
  const [draggingKey, setDraggingKey] = useState(null);
  const [writeStatus, setWriteStatus] = useState("pending");
  const [line, setLine] = useState(null);

  const measureLine = () => {
    const container = containerRef.current;
    const a = readRef.current;
    const b = writeRef.current;
    if (!container || !a || !b) return;

    const containerRect = container.getBoundingClientRect();
    const aRect = a.getBoundingClientRect();
    const bRect = b.getBoundingClientRect();

    const next = {
      x1: aRect.left + aRect.width / 2 - containerRect.left,
      y1: aRect.bottom - containerRect.top,
      x2: bRect.left + bRect.width / 2 - containerRect.left,
      y2: bRect.top - containerRect.top,
    };

    setLine((prev) =>
      prev &&
      prev.x1 === next.x1 &&
      prev.y1 === next.y1 &&
      prev.x2 === next.x2 &&
      prev.y2 === next.y2
        ? prev
        : next,
    );
  };

  useLayoutEffect(() => {
    measureLine();
  });

  useEffect(() => {
    const onResize = () => measureLine();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const startDrag = (key) => (e) => {
    if (e.target.closest("button, a")) return;
    e.preventDefault();

    const start = pos[key];
    const originX = e.clientX;
    const originY = e.clientY;

    setDraggingKey(key);
    document.body.style.userSelect = "none";

    const onMove = (ev) => {
      setPos((prev) => ({
        ...prev,
        [key]: {
          x: start.x + (ev.clientX - originX),
          y: Math.max(0, start.y + (ev.clientY - originY)),
        },
      }));
    };
    const onUp = () => {
      setDraggingKey(null);
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const handleAllow = () => {
    if (writeStatus !== "pending") return;
    setWriteStatus("running");
    setTimeout(() => setWriteStatus("approved"), 1100);
  };

  const handleDecline = () => {
    if (writeStatus !== "pending") return;
    setWriteStatus("declined");
  };

  const resolved = writeStatus === "approved" || writeStatus === "declined";
  const height = Math.max(pos.read.y, pos.write.y) + (resolved ? 560 : 420);

  const write = WRITE_STATE[writeStatus];
  const WriteIcon = write.icon;

  const edgeColor =
    writeStatus === "approved"
      ? "var(--brand)"
      : writeStatus === "declined"
        ? "var(--danger)"
        : "var(--border-strong)";

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full max-w-xl"
      style={{ height, transition: "height 300ms var(--ease)" }}
    >
      {line && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          <path
            d={`M ${line.x1} ${line.y1} C ${line.x1} ${line.y1 + 28}, ${line.x2} ${line.y2 - 28}, ${line.x2} ${line.y2}`}
            fill="none"
            stroke={edgeColor}
            strokeWidth="2"
            strokeDasharray={resolved ? "none" : "4 5"}
            style={{ transition: "stroke 300ms var(--ease)" }}
          />
        </svg>
      )}

      <PreviewCard
        cardRef={readRef}
        pos={pos.read}
        dragging={draggingKey === "read"}
        onPointerDown={startDrag("read")}
      >
        <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-raised)]">
          <div className="px-5 pb-4 pt-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                <Check size={15} className="text-emerald-400" />
              </span>
              <span className="text-[15px] font-medium text-[color:var(--text)]">
                Cloudflare DNS
              </span>
              <span className="ml-auto shrink-0 text-[9px] uppercase tracking-wider text-[color:var(--text-faint)]">
                read
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[13px] text-emerald-400">
              <Check size={13} />
              <span>Completed</span>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-[color:var(--border)] px-5 py-3">
            <Wrench
              size={12}
              className="shrink-0 text-[color:var(--text-faint)]"
            />
            <span className="truncate font-mono text-[11.5px] text-[color:var(--text-dim)]">
              list_dns_records
            </span>
          </div>
        </div>
      </PreviewCard>

      <PreviewCard
        cardRef={writeRef}
        pos={pos.write}
        dragging={draggingKey === "write"}
        onPointerDown={startDrag("write")}
      >
        <div
          className={`overflow-hidden rounded-2xl border bg-[color:var(--surface-raised)] transition-colors duration-300 ${write.border}`}
        >
          <div className="px-5 pb-4 pt-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                <WriteIcon
                  size={15}
                  className={`${write.cls} ${writeStatus === "running" ? "animate-spin" : ""}`}
                />
              </span>
              <span className="text-[15px] font-medium text-[color:var(--text)]">
                Cloudflare DNS
              </span>
              <span className="ml-auto shrink-0 text-[9px] uppercase tracking-wider text-amber-400">
                write
              </span>
            </div>
            <div
              className={`mt-4 flex items-center gap-2 text-[13px] transition-colors duration-300 ${write.cls}`}
            >
              <WriteIcon
                size={13}
                className={writeStatus === "running" ? "animate-spin" : ""}
              />
              <span>{write.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-[color:var(--border)] px-5 py-3">
            <Wrench
              size={12}
              className="shrink-0 text-[color:var(--text-faint)]"
            />
            <span className="truncate font-mono text-[11.5px] text-[color:var(--text-dim)]">
              delete_dns_record
            </span>
          </div>
          <div className="border-t border-[color:var(--border)] px-5 py-3">
            {writeStatus === "pending" && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAllow}
                  className="rounded-lg bg-amber-400 px-3 py-1.5 text-[12px] font-semibold text-black transition-colors hover:bg-amber-300"
                >
                  Allow
                </button>
                <button
                  type="button"
                  onClick={handleDecline}
                  className="btn-ghost !py-1.5 text-[12px]"
                >
                  Don&apos;t allow
                </button>
              </div>
            )}
            {writeStatus === "running" && (
              <p className="font-mono text-[11px] text-[color:var(--text-faint)]">
                Calling Cloudflare DNS…
              </p>
            )}
            {resolved && (
              <button
                type="button"
                onClick={() => setWriteStatus("pending")}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[color:var(--text-faint)] transition-colors hover:text-[color:var(--text-dim)]"
              >
                <RotateCcw size={10} />
                Reset demo
              </button>
            )}
          </div>
        </div>

        {writeStatus === "approved" && (
          <div className="animate-fade-up mt-4 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-raised)]">
            <div className="flex items-center gap-3 px-5 pb-4 pt-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/10">
                <Check size={15} className="text-emerald-400" />
              </span>
              <span className="text-[15px] font-medium text-[color:var(--text)]">
                Result
              </span>
              <span className="ml-auto shrink-0 text-[9px] uppercase tracking-wider text-emerald-400">
                data
              </span>
            </div>
            <p className="px-5 pb-4 text-[13px] leading-relaxed text-[color:var(--text-dim)]">
              secrets.example.com no longer resolves.
            </p>
            <div className="border-t border-[color:var(--border)] px-5 py-3 font-mono text-[11px] text-[color:var(--text-faint)]">
              HTTP 200 · {`{ "success": true, "errors": [] }`}
            </div>
          </div>
        )}

        {writeStatus === "declined" && (
          <div className="animate-fade-up mt-4 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-raised)]">
            <div className="flex items-center gap-3 px-5 pb-4 pt-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-400/10">
                <X size={15} className="text-rose-400" />
              </span>
              <span className="text-[15px] font-medium text-[color:var(--text)]">
                Result
              </span>
              <span className="ml-auto shrink-0 text-[9px] uppercase tracking-wider text-rose-400">
                not run
              </span>
            </div>
            <p className="px-5 pb-4 text-[13px] leading-relaxed text-[color:var(--text-dim)]">
              Declined. Nothing was sent to Cloudflare. The record is
              untouched.
            </p>
          </div>
        )}
      </PreviewCard>
    </div>
  );
}

export default function Landing({ onGetStarted }) {
  return (
    <div className="canvas-grid min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-display text-sm font-semibold text-[color:var(--text)]">
            Subgrid
          </span>
        </div>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost !py-2"
        >
          <Github size={14} />
          GitHub
        </a>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="animate-fade-up flex flex-col items-center pb-20 pt-16 text-center">
          <span className="eyebrow mb-5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1.5">
            Self-hosted · own your infrastructure
          </span>
          <h1 className="font-display max-w-2xl text-[40px] font-semibold leading-[1.1] tracking-tight text-[color:var(--text)] sm:text-[52px]">
            End dashboard fatigue.
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-[color:var(--text-dim)]">
            A DNS record here, an env var there, a bucket somewhere else.
            Routine infra changes shouldn't mean logging into a dozen different
            dashboards. Subgrid connects to the infrastructure you already run
            and lets you operate all of it from one place, by describing what
            you want done. Every action is planned, shown for approval, and
            logged.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onGetStarted}
              className="btn-brand !px-5 !py-3 text-[14px]"
            >
              Get started
              <ArrowRight size={14} />
            </button>
            <a
              href={`${REPO_URL}#self-hosting`}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost !px-5 !py-3 text-[14px]"
            >
              Self-hosting guide
            </a>
          </div>
        </section>

        <section className="animate-fade-up pb-16">
          <div className="flex flex-col items-center">
            <span className="mb-5 truncate rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-raised)] px-3.5 py-2 font-mono text-[12px] text-[color:var(--text)]">
              <span className="mr-1.5 text-[color:var(--brand)]">›</span>
              delete the DNS record for secrets.example.com
            </span>

            <PlanPreview />

            <p className="mt-6 max-w-sm text-center text-[11.5px] leading-relaxed text-[color:var(--text-faint)]">
              The record id is looked up for you and never shown. The write
              step is the only one that pauses for approval. Try it: drag the
              cards around, then click Allow.
            </p>
          </div>
        </section>

        <section className="grid gap-3 border-t border-[color:var(--border)] py-16 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5"
            >
              <span className="eyebrow">{`0${index + 1}`}</span>
              <h3 className="mt-3 text-[14px] font-medium text-[color:var(--text)]">
                {step.title}
              </h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">
                {step.body}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 border-t border-[color:var(--border)] py-16 sm:grid-cols-3">
          <div className="flex flex-col gap-2.5">
            <Lock size={16} className="text-[color:var(--brand)]" />
            <h3 className="text-[13.5px] font-medium text-[color:var(--text)]">
              Runs on your infrastructure
            </h3>
            <p className="text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">
              Your secrets, your database, your audit log.
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <ShieldCheck size={16} className="text-[color:var(--brand)]" />
            <h3 className="text-[13.5px] font-medium text-[color:var(--text)]">
              Passkey-gated secrets
            </h3>
            <p className="text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">
              The first passkey registered on an instance is the login.
              Storing or changing credentials needs a fresh approval.
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <Workflow size={16} className="text-[color:var(--brand)]" />
            <h3 className="text-[13.5px] font-medium text-[color:var(--text)]">
              MCP-native, bridges you can audit
            </h3>
            <p className="text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">
              Catalog presets run through Subgrid's own bridge code, not a
              third-party package, so your credentials never leave Subgrid's
              process. The catalog is still small; you can also connect any
              community MCP server, but that's a third party's code handling
              your keys, so only do it if you trust who built it.
            </p>
          </div>
        </section>

        <section className="border-t border-[color:var(--border)] py-16">
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-[color:var(--text-faint)]" />
              <span className="eyebrow">Self-host it</span>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-sunken)] p-4 font-mono text-[12px] leading-relaxed text-[color:var(--text-dim)]">
              {`cp .env.example .env   # set ENCRYPTION_KEY, APPROVAL_SECRET (openssl rand -hex 32)
docker compose up -d   # builds the app image, runs migrations, starts the API`}
            </pre>
            <p className="mt-4 text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">
              No separate build step, no manual migration. One command once
              `.env` is set. The backend above talks to this UI, a separate
              Vite/React app,{" "}
              <a
                href={UI_REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="text-[color:var(--text)] underline underline-offset-2"
              >
                subgrid-ui
              </a>
              , over its own API. Full setup steps, required env vars, and the
              API reference are in each repo's README.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[color:var(--border)] py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 text-center">
          <p className="max-w-md text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">
            Issues and PRs are welcome. Open an issue to discuss anything
            nontrivial before sending a large PR.
          </p>
          <a
            href={`${REPO_URL}#contributing`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[11px] text-[color:var(--text-faint)] transition-colors hover:text-[color:var(--text-dim)]"
          >
            Read the contributing guide →
          </a>
        </div>
      </footer>
    </div>
  );
}
