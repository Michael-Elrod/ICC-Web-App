// page.tsx

"use client";

import React, { useState } from "react";
import JobFrame from "./_components/JobFrame";
import Skeleton from "@/components/skeletons/Skeleton";
import { useRouter } from "next/navigation";
import { useJobsOverview } from "@/app/hooks/use-jobs";

export default function JobsPage() {
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const { data: jobs = [], isLoading } = useJobsOverview();
  const router = useRouter();

  const filteredJobs = jobs
    .filter((job) =>
      job.job_title.toLowerCase().includes(localSearchQuery.toLowerCase()),
    )
    .sort((a, b) =>
      String(a.job_startdate).localeCompare(String(b.job_startdate)),
    );

  const handleJobSelect = (jobId: string) => {
    setSelectedJobs((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId],
    );
  };

  const handleViewSelected = () => {
    if (selectedJobs.length > 0) {
      const selectedJobNames = selectedJobs
        .map(
          (id) => jobs.find((job) => job.job_id.toString() === id)?.job_title,
        )
        .filter(Boolean);
      router.push(
        `/jobs/active?search=${encodeURIComponent(selectedJobNames.join(", "))}`,
      );
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="mb-4 flex items-center space-x-4">
          <Skeleton className="flex-grow h-10 rounded-md" />
          <Skeleton className="h-10 w-32 rounded" />
        </div>
        <div className="flex justify-center items-center space-x-6 mb-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="bg-white dark:bg-zinc-800 shadow-md sm:rounded-lg mb-4 px-4 py-5 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0">
              <Skeleton className="h-5 w-6 flex-shrink-0" />
              <Skeleton className="h-6 w-48 sm:ml-4" />
              <div className="flex-1" />
              <Skeleton className="h-4 w-full sm:w-48 rounded-full" />
            </div>
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center space-x-4">
        <div className="flex-grow">
          <input
            type="text"
            placeholder="Search jobs..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleViewSelected}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors whitespace-nowrap"
          disabled={selectedJobs.length === 0}
        >
          <span className="hidden sm:inline">View Selected Jobs</span>
          <span className="sm:hidden">Selected</span> ({selectedJobs.length})
        </button>
      </div>

      <div className="flex justify-center items-center space-x-6 mb-6">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 mr-2 rounded"></div>
          <span>&gt; 7 days</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-500 mr-2 rounded"></div>
          <span>Next 7 days</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 mr-2 rounded"></div>
          <span>Overdue</span>
        </div>
      </div>

      {filteredJobs.map((job) => (
        <JobFrame
          key={job.job_id}
          job_id={job.job_id}
          job_title={job.job_title}
          job_startdate={job.job_startdate}
          overdue_count={job.overdue_count}
          next_week_count={job.next_week_count}
          later_weeks_count={job.later_weeks_count}
          isSelected={selectedJobs.includes(job.job_id.toString())}
          onSelect={handleJobSelect}
        />
      ))}
    </>
  );
}
