import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alumniApi } from "@/lib/api";

export const useAlumni = (filters?: { year?: number; search?: string }) => {
  return useQuery({
    queryKey: ["alumni", filters],
    queryFn: () => alumniApi.getAll(filters),
  });
};

export const useAlumniById = (id: string) => {
  return useQuery({
    queryKey: ["alumni", id],
    queryFn: () => alumniApi.getById(id),
    enabled: !!id,
  });
};

export const useMyProfile = () => {
  return useQuery({
    queryKey: ["alumni", "me"],
    queryFn: () => alumniApi.getMyProfile(),
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => alumniApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alumni", "me"] });
      queryClient.invalidateQueries({ queryKey: ["alumni"] });
    },
  });
};

export const useCreateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => alumniApi.createOrUpdateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alumni", "me"] });
    },
  });
};

