"use client";

import React, { useEffect, useState, Suspense } from "react";
import LargeJobFrame from "./LargeJobFrame";
import JobListSkeleton from "./JobListSkeleton";
import { useSearchParams } from "next/navigation";
import { JobDetailView, TaskView, MaterialView } from "../../types/views";

interface JobListProps {
  status: "active" | "closed";
}

export default function JobList({ status }: JobListProps) {
  return (
    <Suspense fallback={<JobListSkeleton />}>
      <JobListContent status={status} />
    </Suspense>
  );
}

function JobListContent({ status }: JobListProps) {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams?.get("search") || ""
  );
  const [jobs, setJobs] = useState<JobDetailView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch(`/api/jobs?view=detailed&status=${status}`);
        const data = await response.json();

        const transformedJobs = data.jobs.map((job: any): JobDetailView => {
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
                (task: TaskView) => task.phase_id === phase.id
              ),
              materials: transformedMaterials.filter(
                (material: MaterialView) => material.phase_id === phase.id
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
              user_phone: w.user_phone || '',
            })),
          };
        });

        setJobs(transformedJobs);
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [status]);

  const searchTerms = searchQuery
    .split(",")
    .map((term) => term.trim().toLowerCase());

  const filteredJobs = jobs
    .filter(
      (job) =>
        searchTerms.length === 0 ||
        searchTerms.some((term) => job.jobName.toLowerCase().includes(term))
    )
    .sort((a, b) => {
      const dateA = new Date(a.job_startdate).getTime();
      const dateB = new Date(b.job_startdate).getTime();
      return status === "closed" ? dateB - dateA : dateA - dateB;
    });

  const handleStatusUpdate = (
    jobId: number,
    itemId: number,
    type: "task" | "material",
    newStatus: "Complete" | "Incomplete" | "In Progress"
  ): void => {
    setJobs((prevJobs) =>
      prevJobs.map((job) => {
        if (job.id !== jobId) return job;

        const updatedTasks =
          type === "task"
            ? job.tasks.map((task) =>
                task.task_id === itemId
                  ? { ...task, task_status: newStatus }
                  : task
              )
            : job.tasks;

        const updatedMaterials =
          type === "material"
            ? job.materials.map((material) =>
                material.material_id === itemId
                  ? { ...material, material_status: newStatus }
                  : material
              )
            : job.materials;

        const updatedPhases = job.phases.map((phase) => ({
          ...phase,
          tasks:
            type === "task"
              ? phase.tasks.map((task) =>
                  task.task_id === itemId
                    ? { ...task, task_status: newStatus }
                    : task
                )
              : phase.tasks,
          materials:
            type === "material"
              ? phase.materials.map((material) =>
                  material.material_id === itemId
                    ? { ...material, material_status: newStatus }
                    : material
                )
              : phase.materials,
        }));

        return {
          ...job,
          tasks: updatedTasks,
          materials: updatedMaterials,
          phases: updatedPhases,
        };
      })
    );
  };

  if (loading) return <JobListSkeleton />;

  return (
    <div className="px-0 sm:px-4 md:px-0">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search jobs.."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="overflow-x-hidden sm:overflow-visible">
        {filteredJobs.map((job) => (
          <LargeJobFrame
            key={job.id}
            id={job.id}
            jobName={job.jobName}
            dateRange={job.dateRange}
            phases={job.phases}
            overdue={job.overdue}
            sevenDaysPlus={job.sevenDaysPlus}
            nextSevenDays={job.nextSevenDays}
            tasks={job.tasks}
            materials={job.materials}
            contacts={job.contacts}
            floorplans={job.floorplans}
            onStatusUpdate={(itemId, type, newStatus) =>
              handleStatusUpdate(job.id, itemId, type, newStatus)
            }
          />
        ))}
      </div>
    </div>
  );
}
