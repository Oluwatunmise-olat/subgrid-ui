import api from "./api";
import { API_ROUTES } from "../lib/constants";

const llmSettingsService = {
  status: async () => {
    const response = await api.get(API_ROUTES.llmSettings);

    return response;
  },

  set: async (provider, apiKey, approvalToken) => {
    const response = await api.put(API_ROUTES.llmSettings, {
      provider,
      api_key: apiKey,
      ...(approvalToken ? { approval_token: approvalToken } : {}),
    });

    return response;
  },

  clear: async (approvalToken) => {
    const response = await api.delete(API_ROUTES.llmSettings, {
      params: approvalToken ? { approval_token: approvalToken } : {},
    });

    return response;
  },
};

export default llmSettingsService;
