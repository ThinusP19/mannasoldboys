import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api";

export const useProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.getAll(),
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });
};

export const useProjectById = (id: string) => {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => projectsApi.getById(id),
    enabled: !!id,
  });
};

export const useDonateToProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      projectsApi.donate(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

