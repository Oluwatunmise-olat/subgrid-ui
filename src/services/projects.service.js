import api from "./api";

import { API_ROUTES } from "../lib/constants";

const projectsService = {
  list: async () => {
    const response = await api.get(API_ROUTES.projects);

    return response;
  },

  create: async (payload) => {
    const response = await api.post(API_ROUTES.projects, payload);

    return response;
  },

  remove: async (projectId) => {
    const response = await api.delete(API_ROUTES.project(projectId));

    return response;
  },
};

export default projectsService;
