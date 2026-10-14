import api from "./api";

import { API_ROUTES } from "../lib/constants";

const workflowService = {
  get: async (workflowId) => {
    const response = await api.get(API_ROUTES.workflows(workflowId));

    return response;
  },

  update: async (workflowId, payload) => {
    const response = await api.patch(API_ROUTES.workflows(workflowId), payload);

    return response;
  },

  approve: async (workflowId) => {
    const response = await api.post(API_ROUTES.workflowApprove(workflowId));

    return response;
  },

  cancel: async (workflowId) => {
    const response = await api.post(API_ROUTES.workflowCancel(workflowId));

    return response;
  },

  execute: async (workflowId) => {
    const response = await api.post(API_ROUTES.workflowExecute(workflowId));

    return response;
  },

  retryStep: async (workflowId, stepId, allowAlways = false) => {
    const response = await api.post(API_ROUTES.workflowRetryStep(workflowId, stepId), {
      allowAlways,
    });

    return response;
  },
};

export default workflowService;
