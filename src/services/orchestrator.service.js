import api from "./api";

import { API_ROUTES } from "../lib/constants";

const orchestratorService = {
  listTools: async (serverId) => {
    const response = await api.get(API_ROUTES.mcpServerTools(serverId));

    return response;
  },

  callTool: async (serverId, payload) => {
    const response = await api.post(API_ROUTES.mcpServerToolCall(serverId), payload);

    return response;
  },

  history: async (serverId, projectId) => {
    const params = {};

    if (serverId) params.server_id = serverId;

    if (projectId) params.project_id = projectId;

    const response = await api.get(API_ROUTES.mcpServerHistory, { params });

    return response;
  },
};

export default orchestratorService;
