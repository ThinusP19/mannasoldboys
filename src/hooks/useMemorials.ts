import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { memorialsApi } from "@/lib/api";

export const useMemorials = () => {
  return useQuery({
    queryKey: ["memorials"],
    queryFn: () => memorialsApi.getAll(),
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });
};

export const useMemorialById = (id: string) => {
  return useQuery({
    queryKey: ["memorials", id],
    queryFn: () => memorialsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateMemorial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      year: number;
      photo?: string;
      tribute: string;
      dateOfPassing: string;
    }) => memorialsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memorials"] });
    },
  });
};

