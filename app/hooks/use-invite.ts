// use-invite.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/app/lib/api-fetch";
import { queryKeys } from "@/app/lib/query-keys";

export function useInviteCode(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.invite.code,
    queryFn: () => apiFetch<{ code: string }>("/api/invite"),
    enabled,
    staleTime: Infinity,
  });
}

export function useGenerateInviteCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ code: string }>("/api/invite", { method: "POST" }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.invite.code, data);
    },
  });
}

export function useSendInviteEmail() {
  return useMutation({
    mutationFn: (email: string) =>
      apiFetch<any>("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }),
  });
}
