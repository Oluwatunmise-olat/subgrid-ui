# Subgrid UI

The frontend for [Subgrid](https://github.com/Oluwatunmise-olat/subgrid) — a
self-hosted control plane for your infrastructure. This is a plain Vite/React
app; it owns no business logic and talks to the `subgrid` backend entirely
over its HTTP API.

## Setup

```bash
cp .env.example .env    # points at your subgrid backend, defaults to :8081
bun install
bun run dev              # http://localhost:5173
```

The backend (`subgrid`) needs to be running first — see its own README for
self-hosting instructions. `VITE_API_BASE_URL` in `.env` controls which
backend this UI talks to.

## Scripts

- `bun run dev` — local dev server
- `bun run build` — production build to `dist/`
- `bun run lint` — eslint

## Stack

Vite + React + Tailwind, React Query for server state, React Router. No
state management library beyond what React Query gives you for free.

## Contributing

Issues and PRs are welcome. Keep `bun run lint` and `bun run build` clean
before sending a PR, and open an issue first for anything that changes the
overall information architecture rather than a single page/component.
