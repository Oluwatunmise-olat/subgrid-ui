import api from "./api";

const catalogService = {
  list: async () => {
    const response = await api.get("/catalog");

    return response;
  },
};

export default catalogService;
