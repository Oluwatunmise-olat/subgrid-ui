export const CATEGORIES = {
  storage: "Storage",
  paas: "Compute / PaaS",
  dns: "DNS / Edge",
  email: "Email",
  database: "Database",
  other: "Other",
};

export const INTEGRATIONS = [
  {
    id: "resend",
    official: true,
    name: "Resend",
    category: "email",
    description: "Send email via the Resend API — published by Resend (resend-mcp)",
    command: "npx",
    baseArgs: ["-y", "resend-mcp"],
    fields: [
      { key: "RESEND_API_KEY", label: "API key", placeholder: "re_xxxxxxxxx", type: "password" },
      {
        key: "SENDER_EMAIL_ADDRESS",
        label: "Sender email",
        placeholder: "you@yourdomain.com (must be verified in Resend)",
        type: "text",
      },
    ],
  },
  {
    id: "resend-oauth",
    official: true,
    name: "Resend (hosted)",
    category: "email",
    description: "Resend's hosted server — sign in with Resend, no API key to paste",
    transport: "http",
    url: "https://mcp.resend.com/mcp",
    oauth: true,
  },
  {
    id: "cloudflare-full",
    official: true,
    name: "Cloudflare",
    category: "paas",
    description:
      "DNS, R2, Workers, zones — Cloudflare's official hosted server (sign in with Cloudflare)",
    transport: "http",
    url: "https://mcp.cloudflare.com/mcp",
    oauth: true,
  },
  {
    id: "sanity",
    official: true,
    name: "Sanity",
    category: "database",
    description: "Content ops via Sanity's official hosted MCP (sign in with Sanity)",
    transport: "http",
    url: "https://mcp.sanity.io",
    oauth: true,
  },
  {
    id: "bridge",
    firstParty: true,
    name: "Vendor API / CLI",
    category: "other",
    description: "Our own bridge — a vendor's documented REST API, or their own CLI",
    custom: "bridge",
    fields: [],
  },
  {
    id: "custom-stdio",
    name: "Custom (local command)",
    category: "other",
    description: "Any MCP server you run with a shell command — you are responsible for this code",
    command: "",
    baseArgs: [],
    fields: [],
    custom: "stdio",
  },
  {
    id: "custom-remote",
    name: "Custom (remote URL)",
    category: "other",
    description: "An MCP server reachable over SSE or HTTP",
    url: "",
    fields: [],
    custom: "remote",
  },
];

export const INTEGRATION_DOCS = {
  resend: { label: "Resend → API Keys", url: "https://resend.com/api-keys" },
};

export const FIELD_HELP = {
  RESEND_API_KEY: "Resend → API Keys → create a key with sending permission.",
  SENDER_EMAIL_ADDRESS:
    'The "from" address — it must be on a domain you\'ve verified in Resend → Domains.',
};

export const INTEGRATION_SETUP = {
  resend: {
    docs: "https://resend.com/api-keys",
    steps: [
      "Resend → API Keys → create a key with sending permission.",
      "Verify a domain in Resend → Domains, then use a sender address on that domain.",
    ],
  },
};

export const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
