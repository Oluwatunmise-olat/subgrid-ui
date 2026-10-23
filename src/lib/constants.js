export const QUERY_KEYS = {
  session: "session",
  catalog: "catalog",
  suggestions: "component-suggestions",
  projects: "projects",
  mcpServers: "mcp-servers",
  serverTools: "mcp-server-tools",
  actionHistory: "action-history",
  workflows: "workflow",
  passkeys: "passkeys",
  passkeysExist: "passkeys-exist",
  llmSettings: "llm-settings",
};

export const STORAGE_KEYS = {
  lastProjectId: "subgrid.last-project-id",
  collapsedSection: (id) => `subgrid.collapsed.${id}`,
};

export const DESTRUCTIVE_TOOL_KEYWORDS = ["delete", "remove", "drop", "destroy", "revoke", "purge"];

export const LINKS = {
  repo: "https://github.com/Oluwatunmise-olat/subgrid",
  uiRepo: "https://github.com/Oluwatunmise-olat/subgrid-ui",
};

export const API_ROUTES = {
  projects: "/projects",
  project: (id) => `/projects/${id}`,
  projectSuggest: (id) => `/projects/${id}/suggest-components`,
  projectPlan: (id) => `/projects/${id}/plan`,
  llmSettings: "/llm-settings",

  mcpServers: "/mcp-servers",
  mcpServer: (id) => `/mcp-servers/${id}`,
  mcpServerHealth: (id) => `/mcp-servers/${id}/health-check`,
  mcpServerTools: (id) => `/mcp-servers/${id}/tools`,
  mcpServerToolCall: (id) => `/mcp-servers/${id}/tools/call`,
  mcpServerHistory: "/mcp-servers/history",

  mcpServerOauthAuthorize: (id) => `/mcp-servers/${id}/oauth/authorize`,
  mcpServerOauthStatus: (id) => `/mcp-servers/${id}/oauth/status`,
  mcpServerOauth: (id) => `/mcp-servers/${id}/oauth`,

  workflows: (id) => `/workflows/${id}`,
  workflowApprove: (id) => `/workflows/${id}/approve`,
  workflowCancel: (id) => `/workflows/${id}/cancel`,
  workflowExecute: (id) => `/workflows/${id}/execute`,
  workflowRetryStep: (id, stepId) => `/workflows/${id}/steps/${stepId}/retry`,
  workflowSelectStepOption: (id, stepId) => `/workflows/${id}/steps/${stepId}/select`,
};
