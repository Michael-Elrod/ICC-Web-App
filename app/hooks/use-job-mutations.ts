// use-job-mutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/app/lib/api-fetch";
import { queryKeys } from "@/app/lib/query-keys";
import { FormTask, FormMaterial, JobUpdatePayload } from "@/app/types/database";

export function useCloseJob(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<void>(`/api/jobs/${jobId}/close`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}

export function useDeleteJob(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<void>(`/api/jobs/${jobId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}

export function useUploadFloorplan(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      apiFetch<any>(`/api/jobs/${jobId}/floorplan`, {
        method: "POST",
        body: formData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
    },
  });
}

export function useDeleteFloorplan(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (floorplanId?: number) => {
      const url = floorplanId
        ? `/api/jobs/${jobId}/floorplan?floorplanId=${floorplanId}`
        : `/api/jobs/${jobId}/floorplan`;
      return apiFetch<void>(url, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
    },
  });
}

export function useUpdateJob(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: JobUpdatePayload) =>
      apiFetch<any>(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.overview() });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}

export function useUpdatePhase(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      phaseId,
      updates,
    }: {
      phaseId: number;
      updates: {
        title?: string;
        startDate?: string;
        extend?: number;
        extendFuturePhases?: boolean;
        daysDiff?: number;
      };
    }) =>
      apiFetch<any>(`/api/jobs/${jobId}/phases/${phaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}

export function useUpdateItemStatus(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      type,
      newStatus,
    }: {
      id: number;
      type: "task" | "material";
      newStatus: string;
    }) =>
      apiFetch<any>(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type, newStatus }),
      }),
    onMutate: async ({ id, type, newStatus }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.jobs.detail(jobId),
      });
      const previousData = queryClient.getQueryData(
        queryKeys.jobs.detail(jobId),
      );

      queryClient.setQueryData(queryKeys.jobs.detail(jobId), (old: any) => {
        if (!old) return old;
        const updatedJob = { ...old.job };
        if (type === "task") {
          updatedJob.tasks = updatedJob.tasks.map((task: any) =>
            task.task_id === id ? { ...task, task_status: newStatus } : task,
          );
        } else {
          updatedJob.materials = updatedJob.materials.map((material: any) =>
            material.material_id === id
              ? { ...material, material_status: newStatus }
              : material,
          );
        }
        updatedJob.phases = updatedJob.phases.map((phase: any) => ({
          ...phase,
          notes: phase.notes || [],
        }));
        return { ...old, job: updatedJob };
      });

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.jobs.detail(jobId),
          context.previousData,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
    },
  });
}

export function useCreateTask(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ phaseId, task }: { phaseId: number; task: FormTask }) =>
      apiFetch<any>(`/api/jobs/${jobId}/phases/${phaseId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}

export function useDeleteTask(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, phaseId }: { taskId: number; phaseId?: number }) =>
      apiFetch<void>(`/api/jobs/${jobId}/tasks/${taskId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}

export function useCreateMaterial(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      phaseId,
      material,
    }: {
      phaseId: number;
      material: FormMaterial;
    }) =>
      apiFetch<any>(`/api/jobs/${jobId}/phases/${phaseId}/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(material),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}

export function useDeleteMaterial(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (materialId: number) =>
      apiFetch<void>(`/api/jobs/${jobId}/materials/${materialId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}

export function useUpdateTask(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, updates }: { taskId: number; updates: any }) =>
      apiFetch<any>(`/api/jobs/${jobId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}

export function useUpdateMaterial(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      materialId,
      updates,
    }: {
      materialId: number;
      updates: any;
    }) =>
      apiFetch<any>(`/api/jobs/${jobId}/materials/${materialId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}

export function useCreateNote(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      phaseId,
      note,
    }: {
      phaseId: number;
      note: { content: string };
    }) =>
      apiFetch<any>(`/api/jobs/${jobId}/phases/${phaseId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(note),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
    },
  });
}

export function useDeleteNote(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      phaseId,
      created_at,
    }: {
      phaseId: number;
      created_at: string;
    }) =>
      apiFetch<void>(`/api/jobs/${jobId}/phases/${phaseId}/notes`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ created_at }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
    },
  });
}
