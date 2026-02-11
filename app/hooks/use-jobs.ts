// use-jobs.ts

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/app/lib/api-fetch";
import { queryKeys } from "@/app/lib/query-keys";
import {
  JobCardView,
  JobDetailView,
  TaskView,
  MaterialView,
  PhaseView,
  FloorPlan,
} from "@/app/types/views";

// --- Transformers ---

function transformJobDetailResponse(data: any): JobDetailView {
  const transformedTasks: TaskView[] = data.job.tasks.map(
    (task: any): TaskView => ({
      task_id: task.task_id,
      phase_id: task.phase_id,
      task_title: task.task_title,
      task_startdate: String(task.task_startdate).split("T")[0],
      task_duration: task.task_duration,
      task_status: task.task_status,
      task_description: task.task_description,
      users: task.users.map((user: any) => ({
        user_id: user.user_id,
        first_name: user.user_first_name,
        last_name: user.user_last_name,
        user_email: user.user_email,
        user_phone: user.user_phone || "",
      })),
    }),
  );

  const transformedMaterials: MaterialView[] = data.job.materials.map(
    (material: any): MaterialView => ({
      material_id: material.material_id,
      phase_id: material.phase_id,
      material_title: material.material_title,
      material_duedate: String(material.material_duedate).split("T")[0],
      material_status: material.material_status,
      material_description: material.material_description,
      users: material.users.map((user: any) => ({
        user_id: user.user_id,
        first_name: user.user_first_name,
        last_name: user.user_last_name,
        user_email: user.user_email,
        user_phone: user.user_phone || "",
      })),
    }),
  );

  const transformedFloorplans: FloorPlan[] =
    data.job.floorplans?.map(
      (floorplan: any): FloorPlan => ({
        url: floorplan.floorplan_url,
        name: `Floor Plan ${floorplan.floorplan_id}`,
      }),
    ) || [];

  return {
    id: data.job.job_id,
    jobName: data.job.job_title,
    job_startdate: data.job.job_startdate,
    dateRange: data.job.date_range,
    tasks: transformedTasks,
    materials: transformedMaterials,
    floorplans: transformedFloorplans,
    phases: data.job.phases.map(
      (phase: any): PhaseView => ({
        id: phase.id,
        name: phase.name,
        startDate: phase.startDate,
        endDate: phase.endDate,
        color: phase.color,
        description: phase.description,
        tasks: transformedTasks.filter(
          (task: TaskView) => task.phase_id === phase.id,
        ),
        materials: transformedMaterials.filter(
          (material: MaterialView) => material.phase_id === phase.id,
        ),
        notes: phase.notes || [],
      }),
    ),
    overdue: data.job.overdue,
    nextSevenDays: data.job.nextSevenDays,
    sevenDaysPlus: data.job.sevenDaysPlus,
    contacts: data.job.contacts || [],
    status: data.job.job_status,
    location: data.job.job_location || null,
    description: data.job.job_description || null,
    client: data.job.client || null,
  };
}

function transformJobListResponse(data: any): JobDetailView[] {
  return data.jobs.map((job: any): JobDetailView => {
    const transformedTasks = job.tasks.map((task: any) => ({
      task_id: task.task_id,
      phase_id: task.phase_id,
      task_title: task.task_title,
      task_startdate: task.task_startdate || "",
      task_duration: task.task_duration || 0,
      task_status: task.task_status,
      task_description: task.task_description || "",
      users: (task.users || []).map((user: any) => ({
        user_id: user.user_id,
        first_name: user.user_first_name,
        last_name: user.user_last_name,
        user_email: user.user_email,
        user_phone: user.user_phone || "",
      })),
    }));

    const transformedMaterials = job.materials.map((material: any) => ({
      material_id: material.material_id,
      phase_id: material.phase_id,
      material_title: material.material_title,
      material_duedate: material.material_duedate || "",
      material_status: material.material_status,
      material_description: material.material_description || "",
      users: (material.users || []).map((user: any) => ({
        user_id: user.user_id,
        first_name: user.user_first_name,
        last_name: user.user_last_name,
        user_email: user.user_email,
        user_phone: user.user_phone || "",
      })),
    }));

    const transformedFloorplans =
      job.floorplans?.map((floorplan: any) => ({
        url: floorplan.url,
        name: floorplan.name,
      })) || [];

    return {
      id: job.job_id,
      jobName: job.job_title,
      job_startdate: job.job_startdate,
      dateRange: job.date_range,
      tasks: transformedTasks,
      materials: transformedMaterials,
      floorplans: transformedFloorplans,
      phases: job.phases.map((phase: any) => ({
        id: phase.id,
        name: phase.name,
        startDate: phase.startDate,
        endDate: phase.endDate,
        color: phase.color,
        tasks: transformedTasks.filter(
          (task: TaskView) => task.phase_id === phase.id,
        ),
        materials: transformedMaterials.filter(
          (material: MaterialView) => material.phase_id === phase.id,
        ),
        notes: phase.notes || [],
      })),
      overdue: job.overdue,
      nextSevenDays: job.nextSevenDays,
      sevenDaysPlus: job.sevenDaysPlus,
      contacts: (job.workers || []).map((w: any) => ({
        user_id: w.user_id,
        first_name: w.user_first_name,
        last_name: w.user_last_name,
        user_email: w.user_email,
        user_phone: w.user_phone || "",
      })),
    };
  });
}

// --- Query Hooks ---

export function useJobsOverview() {
  return useQuery({
    queryKey: queryKeys.jobs.overview(),
    queryFn: () => apiFetch<{ jobs: JobCardView[] }>("/api/jobs?view=overview"),
    select: (data) => data.jobs,
    refetchInterval: 5_000,
  });
}

export function useJobList(status: "active" | "closed") {
  return useQuery({
    queryKey: queryKeys.jobs.list(status),
    queryFn: () => apiFetch<any>(`/api/jobs?view=detailed&status=${status}`),
    select: transformJobListResponse,
    refetchInterval: 5_000,
  });
}

export function useJobDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.jobs.detail(id),
    queryFn: () => apiFetch<any>(`/api/jobs/${id}`),
    select: transformJobDetailResponse,
    refetchInterval: 5_000,
    enabled: !!id,
  });
}
