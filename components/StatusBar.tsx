import React from "react";
import { TaskView, MaterialView } from "@/app/types/views";

interface StatusBarProps {
  label: string;
  items: TaskView[] | MaterialView[];
  withLegend?: boolean;
  isDueBar?: boolean;
  dueItems?: {
    overdue: number;
    nextSevenDays: number;
    sevenDaysPlus: number;
  };
}

const StatusBar: React.FC<StatusBarProps> = ({
  label,
  items,
  withLegend = false,
  isDueBar = false,
  dueItems,
}) => {
  if (isDueBar && dueItems) {
    const total =
      dueItems.overdue + dueItems.nextSevenDays + dueItems.sevenDaysPlus;

    return (
      <div className="mb-4">
        <div className="w-full">
          <h3 className="text-lg font-medium text-center sm:text-left">
            {label}
          </h3>
          <div className="relative w-full">
            <div className="absolute top-[-30px] left-0 right-0">
              <div className="flex justify-center space-x-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-sm mr-2"></div>
                  <span>Overdue</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-sm mr-2"></div>
                  <span className="hidden sm:inline">Next 7 Days</span>
                  <span className="sm:hidden">&lt; 7 Days</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-sm mr-2"></div>
                  <span>&gt; 7 days</span>
                </div>
              </div>
            </div>
            <div className="h-6 bg-gray-200 rounded-full overflow-hidden flex mt-8 sm:mt-0">
              {dueItems.overdue > 0 && (
                <div
                  className="bg-red-500 flex items-center justify-center"
                  style={{ width: `${(dueItems.overdue / total) * 100}%` }}
                >
                  <span className="text-xs font-bold text-white">
                    {dueItems.overdue}
                  </span>
                </div>
              )}
              {dueItems.nextSevenDays > 0 && (
                <div
                  className="bg-yellow-500 flex items-center justify-center"
                  style={{
                    width: `${(dueItems.nextSevenDays / total) * 100}%`,
                  }}
                >
                  <span className="text-xs font-bold text-white">
                    {dueItems.nextSevenDays}
                  </span>
                </div>
              )}
              {dueItems.sevenDaysPlus > 0 && (
                <div
                  className="bg-green-500 flex items-center justify-center"
                  style={{
                    width: `${(dueItems.sevenDaysPlus / total) * 100}%`,
                  }}
                >
                  <span className="text-xs font-bold text-white">
                    {dueItems.sevenDaysPlus}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusCounts = {
    incomplete: items.filter((item) => {
      return "task_status" in item
        ? item.task_status === "Incomplete"
        : item.material_status === "Incomplete";
    }).length,
    inProgress: items.filter((item) => {
      return "task_status" in item
        ? item.task_status === "In Progress"
        : item.material_status === "In Progress";
    }).length,
    complete: items.filter((item) => {
      return "task_status" in item
        ? item.task_status === "Complete"
        : item.material_status === "Complete";
    }).length,
  };

  const totalItems = items.length;
  const incompleteWidth =
    totalItems > 0 ? (statusCounts.incomplete / totalItems) * 100 : 0;
  const inProgressWidth =
    totalItems > 0 ? (statusCounts.inProgress / totalItems) * 100 : 0;
  const completeWidth =
    totalItems > 0 ? (statusCounts.complete / totalItems) * 100 : 0;

  return (
    <div className="mb-4">
      <div className="w-full">
        <h3 className="text-lg font-medium text-center sm:text-left">
          {label}
        </h3>
        <div className="relative w-full">
          {withLegend && (
            <div className="absolute top-[-30px] left-0 right-0">
              <div className="flex justify-center space-x-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-sm mr-2"></div>
                  <span>Incomplete</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-sm mr-2"></div>
                  <span className="hidden sm:inline">In Progress</span>
                  <span className="sm:hidden">Progress</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-sm mr-2"></div>
                  <span>Complete</span>
                </div>
              </div>
            </div>
          )}
          <div
            className={`w-full h-6 relative rounded-full bg-gray-200 overflow-hidden flex ${
              withLegend ? "mt-8 sm:mt-0" : "mt-2 sm:mt-0"
            }`}
          >
            {/* Incomplete */}
            <div
              className="bg-red-500 h-full flex items-center justify-center text-white text-sm font-bold"
              style={{ width: `${incompleteWidth}%` }}
            >
              {statusCounts.incomplete > 0 ? statusCounts.incomplete : ""}
            </div>
            {/* In Progress */}
            <div
              className="bg-yellow-500 h-full flex items-center justify-center text-white text-sm font-bold"
              style={{ width: `${inProgressWidth}%` }}
            >
              {statusCounts.inProgress > 0 ? statusCounts.inProgress : ""}
            </div>
            {/* Complete */}
            <div
              className="bg-green-500 h-full flex items-center justify-center text-white text-sm font-bold"
              style={{ width: `${completeWidth}%` }}
            >
              {statusCounts.complete > 0 ? statusCounts.complete : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
