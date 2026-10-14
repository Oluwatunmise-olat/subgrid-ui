import api from "./api";

const securityService = {
  checkPasskeysExist: async () => {
    const response = await api.get("/security/passkeys/exists");

    return response;
  },

  sessionStatus: async () => {
    const response = await api.get("/security/session");

    return response;
  },

  logout: async () => {
    const response = await api.post("/security/session/logout");

    return response;
  },

  listPasskeys: async () => {
    const response = await api.get("/security/passkeys");

    return response;
  },

  removePasskey: async (passkeyId) => {
    const response = await api.delete(`/security/passkeys/${passkeyId}`);

    return response;
  },

  registrationOptions: async () => {
    const response = await api.post("/security/passkeys/registration/options");

    return response;
  },

  registrationVerify: async (sessionId, assertion, label) => {
    const response = await api.post("/security/passkeys/registration/verify", {
      session_id: sessionId,
      response: assertion,
      label,
    });

    return response;
  },

  approvalOptions: async (action) => {
    const response = await api.post("/security/passkeys/approval/options", { action });

    return response;
  },

  approvalVerify: async (sessionId, assertion) => {
    const response = await api.post("/security/passkeys/approval/verify", {
      session_id: sessionId,
      response: assertion,
    });

    return response;
  },
};

export default securityService;
