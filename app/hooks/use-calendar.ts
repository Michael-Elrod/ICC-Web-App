// use-calendar.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/app/lib/api-fetch";
import { queryKeys } from "@/app/lib/query-keys";
import { Job } from "@/app/types/database";

export function useCalendarJobs() {
  return useQuery({
    queryKey: queryKeys.calendar.jobs(),
    queryFn: () => apiFetch<Job[]>("/api/calendar"),
    staleTime: 30_000,
    select: (data) => (Array.isArray(data) ? data : []),
  });
}

export function useCalendarJobDetail(jobId: number | null) {
  return useQuery({
    queryKey: queryKeys.calendar.jobDetail(jobId!),
    queryFn: () => apiFetch<any>(`/api/calendar?jobId=${jobId}`),
    enabled: jobId !== null,
    staleTime: 30_000,
  });
}

export function useCalendarStatusUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      type,
      itemId,
      status,
    }: {
      type: "task" | "material";
      itemId: number;
      status: string;
    }) =>
      apiFetch<any>(`/api/calendar?type=${type}&id=${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });
}
