import api from "./api";

import { API_ROUTES } from "../lib/constants";

const planningService = {
  plan: async (projectId, message, history) => {
    const response = await api.post(API_ROUTES.projectPlan(projectId), {
      message,
      history,
    });

    return response;
  },
};

export default planningService;
