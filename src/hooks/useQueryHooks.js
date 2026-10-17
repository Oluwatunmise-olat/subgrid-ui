import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import mcpRegistryService from "../services/mcp-registry.service";
import catalogService from "../services/catalog.service";
import orchestratorService from "../services/orchestrator.service";
import llmSettingsService from "../services/llm-settings.service";
import projectsService from "../services/projects.service";
import securityService from "../services/security.service";
import workflowService from "../services/workflow.service";
import { QUERY_KEYS } from "../lib/constants";

const EMPTY_CATALOG = { categories: {}, integrations: [], presets: [] };

export const useCatalog = () => {
  const query = useQuery({
    queryKey: [QUERY_KEYS.catalog],
    queryFn: async () => {
      const response = await catalogService.list();

      return response?.data || EMPTY_CATALOG;
    },
    staleTime: 5 * 60_000,
  });

  return { ...query, data: query.data || EMPTY_CATALOG };
};

export const useSuggestions = (projectId) => {
  return useQuery({
    queryKey: [QUERY_KEYS.suggestions, projectId],
    queryFn: async () => {
      const response = await projectsService.suggest(projectId);

      return (
        response?.data || { suggestions: [], rankedBy: "none", dismissed: [] }
      );
    },
    enabled: Boolean(projectId),
    staleTime: 5 * 60_000,
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, payload }) =>
      projectsService.update(projectId, payload),
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.projects] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.suggestions, projectId],
      });
    },
  });
};

export const useProjects = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.projects],
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.projects] });
    },
  });
};

export const useMcpServers = (projectId) => {
  return useQuery({
    queryKey: [QUERY_KEYS.mcpServers, projectId],
    queryFn: async () => {
      const response = await mcpRegistryService.list(projectId);

      return response?.data?.servers || [];
    },
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.mcpServers] });
    },
  });
};

export const useUpdateServer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serverId, payload }) =>
      mcpRegistryService.update(serverId, payload),
    onSuccess: (_data, { serverId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.mcpServers] });

      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.serverTools, serverId],
      });
    },
  });
};

export const useRemoveServer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serverId) => mcpRegistryService.remove(serverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.mcpServers] });
    },
  });
};

export const useRemoveProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId) => projectsService.remove(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.projects] });
    },
  });
};

export const useCheckServerHealth = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serverId) => mcpRegistryService.checkHealth(serverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.mcpServers] });
    },
  });
};

export const useServerTools = (serverId) => {
  return useQuery({
    queryKey: [QUERY_KEYS.serverTools, serverId],
    queryFn: async () => {
      const response = await orchestratorService.listTools(serverId);

      return response?.data || { tools: [] };
    },
    enabled: Boolean(serverId),
    staleTime: 30_000,
  });
};

export const useServerToolAccess = (serverId) => {
  const query = useServerTools(serverId);

  return {
    ...query,
    tools: query.data?.tools || [],
    stale: Boolean(query.data?.stale),
    staleSince: query.data?.stale_since ?? null,
    staleError: query.data?.last_error ?? null,
    toolFilter: query.data?.tool_filter ?? null,
    approvalPolicy: query.data?.approval_policy || "prompt",
    approvedTools: query.data?.approved_tools || [],
  };
};

export const useAllServerTools = (servers = []) => {
  const results = useQueries({
    queries: servers.map((server) => ({
      queryKey: [QUERY_KEYS.serverTools, server.id],
      queryFn: async () => {
        try {
          const response = await orchestratorService.listTools(server.id);

          return response?.data || { tools: [] };
        } catch {
          return { tools: [] };
        }
      },
      enabled: Boolean(server.id),
      staleTime: 30_000,
    })),
  });

  return servers.map((server, i) => ({
    server,
    tools: results[i]?.data?.tools || [],
    isLoading: results[i]?.isLoading,
  }));
};

export const useCallTool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serverId, toolName, input, approved }) =>
      orchestratorService.callTool(serverId, {
        tool_name: toolName,
        input,
        approved,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.actionHistory] });
    },
  });
};

export const useSessionStatus = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.session],
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
      queryClient.setQueryData([QUERY_KEYS.session], false);
    },
  });
};

const EMPTY_LLM_SETTINGS = { configured: false, provider: null, source: null };

export const useLlmSettings = () => {
  const query = useQuery({
    queryKey: [QUERY_KEYS.llmSettings],
    queryFn: async () => {
      const response = await llmSettingsService.status();

      return response?.data || EMPTY_LLM_SETTINGS;
    },
    staleTime: 60_000,
  });

  return { ...query, data: query.data || EMPTY_LLM_SETTINGS };
};

export const useSetLlmSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ provider, apiKey, approvalToken }) =>
      llmSettingsService.set(provider, apiKey, approvalToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.llmSettings] });
    },
  });
};

export const useClearLlmSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (approvalToken) => llmSettingsService.clear(approvalToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.llmSettings] });
    },
  });
};

export const usePasskeysExist = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.passkeysExist],
    queryFn: async () => {
      const response = await securityService.checkPasskeysExist();

      return Boolean(response?.data?.exists);
    },
    staleTime: 60_000,
  });
};

export const usePasskeys = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.passkeys],
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.passkeys] });
    },
  });
};

export const useWorkflow = (workflowId) => {
  return useQuery({
    queryKey: [QUERY_KEYS.workflows, workflowId],
    queryFn: async () => {
      const response = await workflowService.get(workflowId);

      return response?.data?.workflow || null;
    },
    enabled: Boolean(workflowId),
    staleTime: 0,
    refetchInterval: (query) =>
      query.state.data?.status === "running" ? 1500 : false,
  });
};

export const useUpdateWorkflow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workflowId, patch }) =>
      workflowService.update(workflowId, patch),
    onSuccess: (_data, { workflowId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.workflows, workflowId],
      });
    },
  });
};

export const useApproveWorkflow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workflowId) => workflowService.approve(workflowId),
    onSuccess: (_data, workflowId) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.workflows, workflowId],
      });
    },
  });
};

export const useCancelWorkflow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workflowId) => workflowService.cancel(workflowId),
    onSuccess: (_data, workflowId) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.workflows, workflowId],
      });
    },
  });
};

export const useExecuteWorkflow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workflowId) => workflowService.execute(workflowId),
    onSuccess: (_data, workflowId) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.workflows, workflowId],
      });
    },
  });
};

export const useRetryWorkflowStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workflowId, stepId, allowAlways }) =>
      workflowService.retryStep(workflowId, stepId, allowAlways),
    onSuccess: (_data, { workflowId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.workflows, workflowId],
      });
    },
  });
};

export const useActionHistory = (serverId, projectId) => {
  return useQuery({
    queryKey: [QUERY_KEYS.actionHistory, serverId, projectId],
    queryFn: async () => {
      const response = await orchestratorService.history(serverId, projectId);

      return response?.data?.logs || [];
    },
    enabled: Boolean(serverId || projectId),
    staleTime: 10_000,
    refetchInterval: 20_000,
    refetchIntervalInBackground: false,
  });
};
