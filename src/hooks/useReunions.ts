import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reunionsApi } from "@/lib/api";

export const useReunions = () => {
  return useQuery({
    queryKey: ["reunions"],
    queryFn: () => reunionsApi.getAll(),
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });
};

export const useReunionById = (id: string) => {
  return useQuery({
    queryKey: ["reunions", id],
    queryFn: () => reunionsApi.getById(id),
    enabled: !!id,
  });
};

export const useRegisterForReunion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reunionsApi.register(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reunions"] });
    },
  });
};

export const useUnregisterFromReunion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reunionsApi.unregister(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reunions"] });
    },
  });
};

