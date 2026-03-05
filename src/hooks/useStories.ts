import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storiesApi } from "@/lib/api";

export const useStories = () => {
  return useQuery({
    queryKey: ["stories"],
    queryFn: () => storiesApi.getAll(),
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });
};

export const useStoryById = (id: string) => {
  return useQuery({
    queryKey: ["stories", id],
    queryFn: () => storiesApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; content: string; images?: string[] }) =>
      storiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
};

export const useUpdateStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      storiesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
};

export const useDeleteStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
};

