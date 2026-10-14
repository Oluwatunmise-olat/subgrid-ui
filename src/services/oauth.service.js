import api from "./api";

import { API_ROUTES } from "../lib/constants";

const oauthService = {
  authorize: async (serverId) => {
    const response = await api.post(API_ROUTES.mcpServerOauthAuthorize(serverId));

    return response;
  },

  status: async (serverId) => {
    const response = await api.get(API_ROUTES.mcpServerOauthStatus(serverId));

    return response;
  },

  disconnect: async (serverId) => {
    const response = await api.delete(API_ROUTES.mcpServerOauth(serverId));

    return response;
  },
};

export default oauthService;
