// Known MCP integrations, verified real npm packages (see subgrid README).
// Picking one here means the user never has to know a command/args/env-var name.

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
    id: "coolify",
    name: "Coolify",
    category: "paas",
    description: "Manage servers, apps, databases, deployments",
    command: "npx",
    baseArgs: ["-y", "coolify-mcp-server"],
    fields: [
      { key: "COOLIFY_BASE_URL", label: "Coolify URL", placeholder: "https://coolify.example.com", type: "text" },
      { key: "COOLIFY_TOKEN", label: "API token", placeholder: "Security → API Tokens in Coolify", type: "password" },
    ],
  },
  {
    id: "cloudflare-dns",
    name: "Cloudflare DNS",
    category: "dns",
    description: "List, create, update, delete DNS records",
    command: "npx",
    baseArgs: ["-y", "@thelord/mcp-cloudflare"],
    fields: [
      { key: "CLOUDFLARE_API_TOKEN", label: "API token", placeholder: "Zone:Edit template", type: "password" },
      { key: "CLOUDFLARE_ZONE_ID", label: "Zone ID", placeholder: "From the domain overview page", type: "text" },
    ],
  },
  {
    id: "s3-r2",
    name: "S3 / Cloudflare R2",
    category: "storage",
    description: "List buckets, browse objects, upload, delete — any S3-compatible store",
    command: "npx",
    baseArgs: ["-y", "github:AM1010101/s3-mcp-server"],
    fields: [
      { key: "S3_ENDPOINT", label: "Endpoint", placeholder: "https://<account-id>.r2.cloudflarestorage.com", type: "text" },
      { key: "S3_ACCESS_KEY_ID", label: "Access key ID", placeholder: "", type: "password" },
      { key: "S3_SECRET_ACCESS_KEY", label: "Secret access key", placeholder: "", type: "password" },
      { key: "S3_REGION", label: "Region", placeholder: "auto", type: "text" },
    ],
  },
  {
    id: "cloudinary",
    name: "Cloudinary",
    category: "storage",
    description: "Upload and manage media assets",
    command: "npx",
    baseArgs: ["-y", "cloudinary-mcp-server"],
    fields: [
      { key: "CLOUDINARY_CLOUD_NAME", label: "Cloud name", placeholder: "", type: "text" },
      { key: "CLOUDINARY_API_KEY", label: "API key", placeholder: "console.cloudinary.com/settings/api-keys", type: "password" },
      { key: "CLOUDINARY_API_SECRET", label: "API secret", placeholder: "", type: "password" },
    ],
  },
  {
    id: "resend",
    name: "Resend",
    category: "email",
    description: "Send email, manage domains, contacts, broadcasts",
    command: "npx",
    baseArgs: ["-y", "resend-mcp"],
    fields: [{ key: "RESEND_API_KEY", label: "API key", placeholder: "re_xxxxxxxxx", type: "password" }],
  },
  {
    id: "zeptomail",
    name: "ZeptoMail (Zoho)",
    category: "email",
    description: "Template management only — needs a Zoho OAuth app, more setup than the others",
    command: "npx",
    baseArgs: ["-y", "zeptomail-mcp"],
    fields: [
      { key: "ZOHO_CLIENT_ID", label: "Zoho client ID", placeholder: "", type: "text" },
      { key: "ZOHO_CLIENT_SECRET", label: "Zoho client secret", placeholder: "", type: "password" },
      { key: "ZOHO_REFRESH_TOKEN", label: "Refresh token", placeholder: "from the zeptomail-mcp-login flow", type: "password" },
    ],
  },
  {
    id: "vercel",
    name: "Vercel",
    category: "paas",
    description: "Deployments, projects, env vars, domains, DNS, logs",
    command: "npx",
    baseArgs: ["-y", "vercel-mcp-pro"],
    fields: [
      { key: "VERCEL_TOKEN", label: "Access token", placeholder: "vercel.com/account/settings/tokens", type: "password" },
      { key: "VERCEL_TEAM_ID", label: "Team ID", placeholder: "optional — leave blank for personal account", type: "text" },
    ],
  },
  {
    id: "contabo",
    name: "Contabo",
    category: "paas",
    description: "VPS instances, snapshots, object storage, DNS",
    command: "npx",
    baseArgs: ["-y", "@kieksme/contabo-mcp"],
    fields: [
      { key: "CONTABO_CLIENT_ID", label: "Client ID", placeholder: "my.contabo.com/api/details", type: "text" },
      { key: "CONTABO_CLIENT_SECRET", label: "Client secret", placeholder: "", type: "password" },
      { key: "CONTABO_API_USER", label: "API user (email)", placeholder: "", type: "text" },
      { key: "CONTABO_API_PASSWORD", label: "API password", placeholder: "", type: "password" },
    ],
  },
  {
    id: "godaddy-dns",
    name: "GoDaddy DNS",
    category: "dns",
    description: "List, add, replace, delete DNS records on your domains",
    command: "npx",
    baseArgs: ["-y", "@appouse/godaddy-dns-mcp"],
    fields: [
      { key: "GODADDY_API_KEY", label: "API key", placeholder: "developer.godaddy.com/keys (Production, not OTE)", type: "password" },
      { key: "GODADDY_API_SECRET", label: "API secret", placeholder: "", type: "password" },
    ],
  },
  {
    id: "resend-oauth",
    name: "Resend (hosted)",
    category: "email",
    description: "Official hosted server — sign in with Resend, no API key to paste",
    transport: "http",
    url: "https://mcp.resend.com/mcp",
    oauth: true,
  },
  {
    id: "sanity",
    name: "Sanity",
    category: "database",
    description: "Content ops via Sanity's official hosted MCP — OAuth only, no local API-key option",
    transport: "http",
    url: "https://mcp.sanity.io",
    oauth: true,
  },
  {
    id: "cloudflare-full",
    name: "Cloudflare (full API)",
    category: "paas",
    description: "R2, Workers, zones — Cloudflare's official hosted server, broader than the DNS-only option above",
    transport: "http",
    url: "https://mcp.cloudflare.com/mcp",
    oauth: true,
  },
  {
    id: "custom-stdio",
    name: "Custom (local command)",
    category: "other",
    description: "Any MCP server you run with a shell command",
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

export const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
