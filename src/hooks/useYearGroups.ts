import { useQuery } from "@tanstack/react-query";
import { yearGroupsApi } from "@/lib/api";

export const useYearGroups = () => {
  return useQuery({
    queryKey: ["yearGroups"],
    queryFn: () => yearGroupsApi.getAll(),
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });
};

export const useYearGroup = (year: number) => {
  return useQuery({
    queryKey: ["yearGroups", year],
    queryFn: () => yearGroupsApi.getByYear(year),
    enabled: !!year,
  });
};

