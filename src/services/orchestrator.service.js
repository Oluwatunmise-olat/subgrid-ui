import api from "./api";

const orchestratorService = {
  listTools: async (serverId) => {
    const response = await api.get(`/mcp-servers/${serverId}/tools`);
    return response;
  },

  callTool: async (serverId, payload) => {
    const response = await api.post(`/mcp-servers/${serverId}/tools/call`, payload);
    return response;
  },

  history: async (serverId) => {
    const response = await api.get("/mcp-servers/history", {
      params: serverId ? { server_id: serverId } : {},
    });
    return response;
  },
};

export default orchestratorService;
