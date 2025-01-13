"use client";

import React, { useState, useEffect } from "react";
import JobFrame from "../../components/job/JobFrame";
import { useRouter } from "next/navigation";
import { JobCardView } from "../types/views";

export default function JobsPage() {
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [jobs, setJobs] = useState<JobCardView[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch("/api/jobs?view=overview");
        const data = await response.json();
        setJobs(data.jobs);
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      }
    };

    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((job) =>
    job.job_title.toLowerCase().includes(localSearchQuery.toLowerCase())
  );

  const handleJobSelect = (jobId: string) => {
    setSelectedJobs((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleViewSelected = () => {
    if (selectedJobs.length > 0) {
      const selectedJobNames = selectedJobs
        .map(
          (id) => jobs.find((job) => job.job_id.toString() === id)?.job_title
        )
        .filter(Boolean);
      router.push(
        `/jobs/active?search=${encodeURIComponent(selectedJobNames.join(", "))}`
      );
    }
  };

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
          View Selected Jobs ({selectedJobs.length})
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
