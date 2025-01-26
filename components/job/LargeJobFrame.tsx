"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Timeline from "../util/Timeline";
import { formatDate } from "@/app/utils";
import StatusBar from "../util/StatusBar";
import FloorplanViewer from "@/components/job/FloorplanViewer";
import { PhaseView, TaskView, MaterialView } from "../../app/types/views";

interface LargeJobFrameProps {
  id: number;
  jobName: string;
  job_startdate: string;
  dateRange: string;
  currentWeek: string;
  phases: PhaseView[];
  overdue: number;
  sevenDaysPlus: number;
  nextSevenDays: number;
  tasks: TaskView[];
  materials: MaterialView[];
  contacts: string[];
  floorplans: { url: string; name: string }[];
  onStatusUpdate: (
    itemId: number,
    type: "task" | "material",
    newStatus: "Complete" | "Incomplete" | "In Progress"
  ) => void;
}

const LargeJobFrame: React.FC<LargeJobFrameProps> = ({
  id,
  jobName,
  job_startdate,
  dateRange,
  currentWeek,
  phases,
  overdue,
  sevenDaysPlus,
  nextSevenDays,
  tasks: initialTasks,
  materials: initialMaterials,
  contacts,
  floorplans,
  onStatusUpdate,
}) => {
  const [showFloorplanModal, setShowFloorplanModal] = useState(false);
  const [tasks, setTasks] = useState<TaskView[]>(initialTasks);
  const [materials, setMaterials] = useState<MaterialView[]>(initialMaterials);

  useEffect(() => {
    setTasks(initialTasks);
    setMaterials(initialMaterials);
  }, [initialTasks, initialMaterials]);

  const handleStatusUpdate = (
    itemId: number,
    type: "task" | "material",
    newStatus: "Complete" | "Incomplete" | "In Progress"
  ): void => {
    onStatusUpdate(itemId, type, newStatus);
  };

  return (
    <div className="bg-white dark:bg-zinc-800 shadow-md overflow-x-hidden sm:overflow-visible sm:rounded-lg mb-4 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
          <h2 className="text-2xl font-bold">{jobName}</h2>
          <p className="text-lg text-zinc-600 dark:text-white/70">
            {dateRange}
          </p>
        </div>
        <Link
          href={`/jobs/${id}`}
          className="px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 transition-colors w-full sm:w-auto text-center"
        >
          View
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <select
          className="flex-1 appearance-none bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline dark:text-white text-center sm:text-left"
          onChange={() => {}}
          value=""
        >
          <option value="" disabled>
            Contacts
          </option>
          {contacts.map((name, index) => (
            <option key={`contact-${index}`} value={name}>
              {name}
            </option>
          ))}
        </select>

        <button
          onClick={() => floorplans.length > 0 && setShowFloorplanModal(true)}
          className={`flex items-center justify-center gap-2 px-4 py-2 w-full sm:w-64 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded shadow leading-tight focus:outline-none focus:shadow-outline dark:text-white ${
            !floorplans.length
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-zinc-400 dark:hover:border-zinc-500"
          }`}
          disabled={!floorplans.length}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          Floorplans
          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-blue-100 bg-blue-500 rounded-full">
            {floorplans.length}
          </span>
        </button>
      </div>
      <div className="space-y-5 mb-6">
        <StatusBar
          label="Items Due"
          items={[]}
          isDueBar={true}
          dueItems={{
            overdue,
            nextSevenDays,
            sevenDaysPlus,
          }}
        />
        <StatusBar label="Tasks" items={tasks} withLegend={true} />
        <StatusBar label="Materials" items={materials} />
      </div>

      <div className="border-b border-gray-200 dark:border-zinc-700 mb-6"></div>

      <div className="mt-4">
        <div
          className="w-full"
          style={{ height: `${20 + phases.length * 28}px` }}
        >
          <Timeline
            phases={phases}
            startDate={formatDate(phases[0].startDate)}
            endDate={formatDate(phases[phases.length - 1].endDate)}
            currentWeek={parseInt(currentWeek)}
            onStatusUpdate={handleStatusUpdate}
          />
        </div>
      </div>

      {showFloorplanModal && (
        <FloorplanViewer
          floorplans={floorplans}
          onClose={() => setShowFloorplanModal(false)}
          mode="modal"
        />
      )}
    </div>
  );
};

export default LargeJobFrame;
