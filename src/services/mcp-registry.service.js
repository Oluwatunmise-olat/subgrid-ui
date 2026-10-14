import api from "./api";

import { API_ROUTES } from "../lib/constants";

const mcpRegistryService = {
  list: async (projectId) => {
    const response = await api.get(API_ROUTES.mcpServers, {
      params: projectId ? { project_id: projectId } : {},
    });

    return response;
  },

  register: async (payload) => {
    const response = await api.post(API_ROUTES.mcpServers, payload);

    return response;
  },

  update: async (serverId, payload) => {
    const response = await api.put(API_ROUTES.mcpServer(serverId), payload);

    return response;
  },

  remove: async (serverId) => {
    const response = await api.delete(API_ROUTES.mcpServer(serverId));

    return response;
  },

  checkHealth: async (serverId) => {
    const response = await api.post(API_ROUTES.mcpServerHealth(serverId));

    return response;
  },
};

export default mcpRegistryService;
