import api from "./api";

const projectsService = {
  list: async () => {
    const response = await api.get("/projects");
    return response;
  },

  create: async (payload) => {
    const response = await api.post("/projects", payload);
    return response;
  },

  remove: async (projectId) => {
    const response = await api.delete(`/projects/${projectId}`);
    return response;
  },
};

export default projectsService;
