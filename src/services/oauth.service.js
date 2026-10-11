import api from "./api";

const oauthService = {
  authorize: async (serverId) => {
    const response = await api.post(`/mcp-servers/${serverId}/oauth/authorize`);
    return response;
  },

  status: async (serverId) => {
    const response = await api.get(`/mcp-servers/${serverId}/oauth/status`);
    return response;
  },

  disconnect: async (serverId) => {
    const response = await api.delete(`/mcp-servers/${serverId}/oauth`);
    return response;
  },
};

export default oauthService;
