import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import mcpRegistryService from "../services/mcp-registry.service";
import orchestratorService from "../services/orchestrator.service";
import projectsService from "../services/projects.service";
import securityService from "../services/security.service";

export const useProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await projectsService.list();
      return response?.data?.projects || [];
    },
    staleTime: 30_000,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => projectsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const useMcpServers = (projectId) => {
  return useQuery({
    queryKey: ["mcp-servers", projectId],
    queryFn: async () => {
      const response = await mcpRegistryService.list(projectId);
      return response?.data?.servers || [];
    },
    enabled: Boolean(projectId),
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
};

export const useRegisterServer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => mcpRegistryService.register(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp-servers"] });
    },
  });
};

export const useRemoveServer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serverId) => mcpRegistryService.remove(serverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp-servers"] });
    },
  });
};

export const useRemoveProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId) => projectsService.remove(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const useCheckServerHealth = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serverId) => mcpRegistryService.checkHealth(serverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp-servers"] });
    },
  });
};

export const useServerTools = (serverId) => {
  return useQuery({
    queryKey: ["mcp-server-tools", serverId],
    queryFn: async () => {
      const response = await orchestratorService.listTools(serverId);
      return response?.data?.tools || [];
    },
    enabled: Boolean(serverId),
    staleTime: 30_000,
  });
};

export const useCallTool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serverId, toolName, input, approved }) =>
      orchestratorService.callTool(serverId, { tool_name: toolName, input, approved }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-history"] });
    },
  });
};

export const useSessionStatus = () => {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const response = await securityService.sessionStatus();
      return Boolean(response?.data?.authenticated);
    },
    staleTime: 60_000,
    retry: false,
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => securityService.logout(),
    onSuccess: () => {
      queryClient.setQueryData(["session"], false);
    },
  });
};

export const usePasskeysExist = () => {
  return useQuery({
    queryKey: ["passkeys-exist"],
    queryFn: async () => {
      const response = await securityService.checkPasskeysExist();
      return Boolean(response?.data?.exists);
    },
    staleTime: 60_000,
  });
};

export const usePasskeys = () => {
  return useQuery({
    queryKey: ["passkeys"],
    queryFn: async () => {
      const response = await securityService.listPasskeys();
      return response?.data?.passkeys || [];
    },
    staleTime: 30_000,
  });
};

export const useRemovePasskey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (passkeyId) => securityService.removePasskey(passkeyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passkeys"] });
    },
  });
};

export const useActionHistory = (serverId) => {
  return useQuery({
    queryKey: ["action-history", serverId],
    queryFn: async () => {
      const response = await orchestratorService.history(serverId);
      return response?.data?.logs || [];
    },
    staleTime: 10_000,
    refetchInterval: 20_000,
    refetchIntervalInBackground: false,
  });
};
