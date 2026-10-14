import { startAuthentication, startRegistration } from "@simplewebauthn/browser";

import securityService from "../services/security.service";

export const registerPasskey = async (label) => {
  const optionsRes = await securityService.registrationOptions();

  const { session_id, options } = optionsRes.data;

  const assertion = await startRegistration({ optionsJSON: options });

  await securityService.registrationVerify(session_id, assertion, label);
};

export const requestApproval = async (action) => {
  const optionsRes = await securityService.approvalOptions(action);

  const { session_id, options } = optionsRes.data;

  const assertion = await startAuthentication({ optionsJSON: options });

  const verifyRes = await securityService.approvalVerify(session_id, assertion);

  return verifyRes.data.approval_token;
};
