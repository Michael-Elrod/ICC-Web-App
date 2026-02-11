// use-templates.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/app/lib/api-fetch";
import { queryKeys } from "@/app/lib/query-keys";

interface Template {
  template_id: number;
  template_name: string;
}

export function useTemplates() {
  return useQuery({
    queryKey: queryKeys.templates.list(),
    queryFn: () => apiFetch<Template[]>("/api/templates"),
    staleTime: 60_000,
  });
}

export function useTemplate(id: string | number | null) {
  return useQuery({
    queryKey: queryKeys.templates.detail(id!),
    queryFn: () => apiFetch<any>(`/api/templates/${id}`),
    enabled: id !== null && id !== undefined,
    staleTime: 60_000,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) =>
      apiFetch<any>("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
    },
  });
}

export function useUpdateTemplate(id: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) =>
      apiFetch<any>(`/api/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/api/templates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
    },
  });
}
