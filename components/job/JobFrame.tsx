// components/JobFrame.tsx

import React from "react";
import Link from "next/link";
import CardFrame from "../util/CardFrame";
import { JobCardView } from "@/app/types/views";

interface JobFrameProps extends JobCardView {
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const JobFrame: React.FC<JobFrameProps> = ({
  job_id,
  job_title,
  overdue_count,
  next_week_count,
  later_weeks_count,
  isSelected,
  onSelect,
}) => {
  const total = overdue_count + next_week_count + later_weeks_count;

  return (
    <CardFrame>
      <div
        className="flex flex-col sm:flex-row items-center cursor-pointer gap-2 sm:gap-0"
        onClick={() => onSelect(job_id.toString())}
      >
        <div className="flex items-center w-full sm:w-1/4">
          <input
            type="checkbox"
            className="mr-4"
            checked={isSelected}
            onChange={() => onSelect(job_id.toString())}
            onClick={(e) => e.stopPropagation()}
          />
          <h3 className="text-lg font-medium truncate">{job_title}</h3>
        </div>
        <div className="w-full sm:flex-1 flex items-center">
          <div className="flex-1 flex mr-4 min-w-[150px]">
            {overdue_count > 0 && (
              <div
                className={`bg-red-500 flex justify-center items-center text-white min-w-[40px] ${
                  overdue_count === total ? "rounded" : "rounded-l"
                }`}
                style={{
                  width: `${(overdue_count / total) * 100}%`,
                  height: "20px",
                }}
              >
                {overdue_count}
              </div>
            )}
            {next_week_count > 0 && (
              <div
                className={`bg-yellow-500 flex justify-center items-center text-white min-w-[40px] ${
                  overdue_count === 0 ? "rounded-l" : ""
                } ${
                  overdue_count + next_week_count === total ? "rounded-r" : ""
                }`}
                style={{
                  width: `${(next_week_count / total) * 100}%`,
                  height: "20px",
                }}
              >
                {next_week_count}
              </div>
            )}
            {later_weeks_count > 0 && (
              <div
                className={`bg-green-500 flex justify-center items-center text-white min-w-[40px] ${
                  overdue_count + next_week_count === 0 ? "rounded-l" : ""
                } rounded-r`}
                style={{
                  width: `${(later_weeks_count / total) * 100}%`,
                  height: "20px",
                }}
              >
                {later_weeks_count}
              </div>
            )}
          </div>
          <Link
            href={`/jobs/${job_id}`}
            className="px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            View
          </Link>
        </div>
      </div>
    </CardFrame>
  );
};

export default JobFrame;
