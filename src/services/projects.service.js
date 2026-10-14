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

  update: async (projectId, payload) => {
    const response = await api.put(API_ROUTES.project(projectId), payload);

    return response;
  },

  suggest: async (projectId, description) => {
    const response = await api.post(API_ROUTES.projectSuggest(projectId), {
      description,
    });

    return response;
  },
};

export default projectsService;
