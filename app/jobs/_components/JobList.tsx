// JobList.tsx

"use client";

import React, { Suspense } from "react";
import LargeJobFrame from "./LargeJobFrame";
import JobListSkeleton from "./JobListSkeleton";
import { useSearchParams } from "next/navigation";
import { useJobList } from "@/app/hooks/use-jobs";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/query-keys";
import { useState } from "react";

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
    searchParams?.get("search") || "",
  );
  const { data: jobs = [], isLoading } = useJobList(status);
  const queryClient = useQueryClient();

  const searchTerms = searchQuery
    .split(",")
    .map((term) => term.trim().toLowerCase());

  const filteredJobs = jobs
    .filter(
      (job) =>
        searchTerms.length === 0 ||
        searchTerms.some((term) => job.jobName.toLowerCase().includes(term)),
    )
    .sort((a, b) => {
      const cmp = String(a.job_startdate).localeCompare(
        String(b.job_startdate),
      );
      return status === "closed" ? -cmp : cmp;
    });

  const handleStatusUpdate = async (
    jobId: number,
    itemId: number,
    type: "task" | "material",
    newStatus: "Complete" | "Incomplete" | "In Progress",
  ): Promise<void> => {
    try {
      await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, type, newStatus }),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.list(status) });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  if (isLoading) return <JobListSkeleton />;

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
      <div className="overflow-hidden sm:overflow-visible">
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
