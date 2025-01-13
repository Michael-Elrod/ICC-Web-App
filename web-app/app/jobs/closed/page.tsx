"use client";

import React, { useState, useEffect } from "react";
import LargeJobFrame from "../../../components/job/LargeJobFrame";
import { useSearchParams } from "next/navigation";
import { JobDetailView, TaskView, MaterialView } from "../../types/views";

export default function ClosedJobsPage() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams?.get("search") || ""
  );
  const [jobs, setJobs] = useState<JobDetailView[]>([]);
  const defaultFloorplans = Array(5)
  .fill({
    url: "/placeholder-floorplan.jpg",
    name: "Sample Floorplan",
  })
  .map((plan, index) => ({
    ...plan,
    name: `Sample Floorplan ${index + 1}`,
  }));

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch("/api/jobs?view=detailed&status=closed");
        const data = await response.json();

        const transformedJobs = data.jobs.map((job: any): JobDetailView => {
          // First transform tasks and materials once
          const transformedTasks = job.tasks.map((task: any) => ({
            task_id: task.task_id,
            phase_id: task.phase_id,
            task_title: task.task_title,
            task_startdate: task.task_startdate || "",
            task_duration: task.task_duration || 0,
            task_status: task.task_status,
            task_description: task.task_description || "",
            users: task.users || [],
          }));

          const transformedMaterials = job.materials.map((material: any) => ({
            material_id: material.material_id,
            phase_id: material.phase_id,
            material_title: material.material_title,
            material_duedate: material.material_duedate || "",
            material_status: material.material_status,
            material_description: material.material_description || "",
            users: material.users || [],
          }));

          return {
            id: job.job_id,
            jobName: job.job_title,
            job_startdate: job.job_startdate,
            dateRange: job.date_range,
            currentWeek: job.current_week,
            // Store transformed tasks and materials at job level
            tasks: transformedTasks,
            materials: transformedMaterials,
            phases: job.phases.map((phase: any) => ({
              id: phase.id,
              name: phase.name,
              startDate: phase.startDate,
              endDate: phase.endDate,
              color: phase.color,
              // Filter the already transformed tasks and materials
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
            contacts: job.workers || [],
          };
        });

        setJobs(transformedJobs);
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      }
    };

    fetchJobs();
  }, []);

  const searchTerms = searchQuery
    .split(",")
    .map((term) => term.trim().toLowerCase());
  const filteredJobs = jobs.filter(
    (job) =>
      searchTerms.length === 0 ||
      searchTerms.some((term) => job.jobName.toLowerCase().includes(term))
  );

  const handleStatusUpdate = (
    jobId: number,
    itemId: number,
    type: "task" | "material",
    newStatus: "Complete" | "Incomplete" | "In Progress"
  ): void => {
    setJobs((prevJobs) =>
      prevJobs.map((job) => {
        if (job.id !== jobId) return job;
  
        const updatedTasks = type === "task" 
          ? job.tasks.map((task) =>
              task.task_id === itemId
                ? { ...task, task_status: newStatus }
                : task
            )
          : job.tasks;
  
        const updatedMaterials = type === "material"
          ? job.materials.map((material) =>
              material.material_id === itemId
                ? { ...material, material_status: newStatus }
                : material
            )
          : job.materials;
  
        const updatedPhases = job.phases.map((phase) => ({
          ...phase,
          tasks: type === "task"
            ? phase.tasks.map((task) =>
                task.task_id === itemId
                  ? { ...task, task_status: newStatus }
                  : task
              )
            : phase.tasks,
          materials: type === "material"
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

  return (
    <>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search jobs (comma-separated for multiple)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {filteredJobs.map((job) => (
        <LargeJobFrame
          key={job.id}
          id={job.id}
          jobName={job.jobName}
          job_startdate={job.job_startdate}
          dateRange={job.dateRange}
          currentWeek={job.currentWeek.toString()}
          phases={job.phases}
          overdue={job.overdue}
          sevenDaysPlus={job.sevenDaysPlus}
          nextSevenDays={job.nextSevenDays}
          tasks={job.tasks}
          materials={job.materials}
          contacts={job.contacts}
          floorplans={defaultFloorplans}
          onStatusUpdate={(itemId, type, newStatus) =>
            handleStatusUpdate(job.id, itemId, type, newStatus)
          }
        />
      ))}
    </>
  );
}
