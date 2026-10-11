import api from "./api";

const mcpRegistryService = {
  list: async (projectId) => {
    const response = await api.get("/mcp-servers", {
      params: projectId ? { project_id: projectId } : {},
    });
    return response;
  },

  register: async (payload) => {
    const response = await api.post("/mcp-servers", payload);
    return response;
  },

  update: async (serverId, payload) => {
    const response = await api.put(`/mcp-servers/${serverId}`, payload);
    return response;
  },

  remove: async (serverId) => {
    const response = await api.delete(`/mcp-servers/${serverId}`);
    return response;
  },

  checkHealth: async (serverId) => {
    const response = await api.post(`/mcp-servers/${serverId}/health-check`);
    return response;
  },
};

export default mcpRegistryService;
