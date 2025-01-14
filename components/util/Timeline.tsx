"use client";

import React, { useState } from "react";
import { UserView, PhaseView } from "@/app/types/views";
import { TimelineProps } from "../../app/types/props";

// Type for a single task or material item
interface TimelineItem {
  id: number;
  title: string;
  type: "task" | "material";
  status: "Complete" | "Incomplete" | "In Progress";
  description: string;
  startDate?: string;
  dueDate?: string;
  duration?: number;
  users: UserView[];
}

const convertStatus = (
  status: string
): "Complete" | "Incomplete" | "In Progress" => {
  switch (status) {
    case "Complete":
      return "Complete";
    case "In Progress":
      return "In Progress";
    default:
      return "Incomplete";
  }
};

const PhaseItemsPopup = ({
  phase,
  onClose,
  onItemClick,
}: {
  phase: PhaseView;
  onClose: () => void;
  onItemClick: (item: TimelineItem) => void;
}) => (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]"
    onClick={onClose}
  >
    <div
      className="bg-white dark:bg-zinc-800 rounded-lg p-6 max-w-md w-full m-4 max-h-[80vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-xl font-bold mb-4">{phase.name}</h2>

      <div className="space-y-4">
        {phase.tasks?.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Tasks</h3>
            <div className="space-y-2">
              {phase.tasks.map((task) => (
                <div
                  key={task.task_id}
                  onClick={() =>
                    onItemClick({
                      id: task.task_id,
                      title: task.task_title,
                      type: "task",
                      status: convertStatus(task.task_status),
                      description: task.task_description,
                      startDate: task.task_startdate,
                      duration: task.task_duration,
                      users: task.users,
                    })
                  }
                  className={`flex justify-between items-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 p-2 rounded ${
                    task.task_status === "Complete"
                      ? "line-through opacity-50"
                      : ""
                  }`}
                >
                  <span>{task.task_title}</span>
                  <span
                    className={`w-3 h-3 rounded-full ${
                      task.task_status === "Complete"
                        ? "bg-green-500"
                        : task.task_status === "In Progress"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  ></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase.materials?.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Materials</h3>
            <div className="space-y-2">
              {phase.materials.map((material) => (
                <div
                  key={material.material_id}
                  onClick={() =>
                    onItemClick({
                      id: material.material_id,
                      title: material.material_title,
                      type: "material",
                      status: convertStatus(material.material_status),
                      description: material.material_description,
                      dueDate: material.material_duedate,
                      users: material.users,
                    })
                  }
                  className={`flex justify-between items-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 p-2 rounded ${
                    material.material_status === "Complete"
                      ? "line-through opacity-50"
                      : ""
                  }`}
                >
                  <span>{material.material_title}</span>
                  <span
                    className={`w-3 h-3 rounded-full ${
                      material.material_status === "Complete"
                        ? "bg-green-500"
                        : material.material_status === "In Progress"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  ></span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Popup for individual item details
const ItemDetailPopup = ({
  item,
  onClose,
  onStatusUpdate,
}: {
  item: TimelineItem;
  onClose: () => void;
  onStatusUpdate: (
    itemId: number,
    type: "task" | "material",
    newStatus: "Complete" | "Incomplete" | "In Progress"
  ) => void;
}) => {
  const [selectedStatus, setSelectedStatus] = useState<
    "Complete" | "Incomplete" | "In Progress" | null
  >(null);

  const availableStatuses = ["Complete", "Incomplete", "In Progress"].filter(
    (status) => status !== item.status
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-800 rounded-lg p-6 max-w-md w-full m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <h2 className="text-xl font-bold">{item.title}</h2>

          {item.startDate && (
            <div>
              <h3 className="font-semibold mb-2">Date Range</h3>
              <p>{new Date(item.startDate).toLocaleDateString()}</p>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">Status</h3>
            <p>{item.status}</p>
          </div>

          {item.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p>{item.description}</p>
            </div>
          )}

          {item.users && item.users.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Contacts</h3>
              {item.users.map((user: UserView, index: number) => (
                <div key={index}>
                  <p>
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-sm">{user.user_email}</p>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 flex justify-between items-center">
            {/* Dropdown for status change */}
            <select
              className="border border-gray-300 dark:border-zinc-600 rounded px-4 py-2 bg-white dark:bg-zinc-700"
              value={selectedStatus || ""}
              onChange={(e) =>
                setSelectedStatus(
                  e.target.value as "Complete" | "Incomplete" | "In Progress"
                )
              }
            >
              <option value="" disabled>
                Change Status
              </option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            {/* Save button */}
            <button
              onClick={() => {
                if (selectedStatus) {
                  onStatusUpdate(item.id, item.type, selectedStatus);
                  onClose();
                }
              }}
              className="px-4 py-2 text-white font-bold bg-blue-500 hover:bg-blue-700 rounded-md"
              disabled={!selectedStatus}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Timeline: React.FC<TimelineProps> = ({
  phases,
  startDate,
  endDate,
  currentWeek,
  onStatusUpdate
}) => {
  const [selectedPhase, setSelectedPhase] = useState<any | null>(null);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);

  const phaseHeight = 28;
  const topMargin = 20;
  const requiredHeight = topMargin + phases.length * phaseHeight;

  const parseDate = (dateStr: string) => {
    if (dateStr.includes("-")) {
      return new Date(dateStr);
    }
    const [month, day] = dateStr.split("/");
    return new Date(
      new Date().getFullYear(),
      parseInt(month) - 1,
      parseInt(day)
    );
  };

  const startDateObj = parseDate(startDate);
  const endDateObj = parseDate(endDate);
  const totalDays = Math.ceil(
    (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)
  );

  const getPositionPercentage = (date: string) => {
    const dateObj = new Date(date);
    const daysDiff = Math.ceil(
      (dateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)
    );
    const percentage = (daysDiff / totalDays) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  const getPhaseWidth = (phaseStartDate: string, phaseEndDate: string) => {
    const startObj = new Date(phaseStartDate);
    const endObj = new Date(phaseEndDate);
    const phaseDays = Math.ceil(
      (endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)
    );
    const percentage = (phaseDays / totalDays) * 100;
    return Math.max(1, Math.min(100, percentage));
  };

  const dateIntervals = 5;
  const dayInterval = Math.ceil(totalDays / (dateIntervals - 1));
  const getDateString = (daysToAdd: number) => {
    const date = new Date(
      startDateObj.getTime() + daysToAdd * 24 * 60 * 60 * 1000
    );
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getCurrentWeekPosition = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (today < startDateObj || today > endDateObj) {
      return null;
    }

    const daysSinceStart = Math.ceil(
      (today.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.min(100, Math.max(0, (daysSinceStart / totalDays) * 100));
  };

  const handleStatusUpdate = async (
    itemId: number,
    type: "task" | "material",
    newStatus: "Complete" | "Incomplete" | "In Progress"
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/calendar?type=${type}&id=${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
  
      if (!response.ok) {
        console.error("Failed to update status:", await response.text());
        return;
      }

      onStatusUpdate(itemId, type, newStatus);
  
      setSelectedPhase((prevPhase: PhaseView | null) =>
        prevPhase
          ? {
              ...prevPhase,
              tasks: prevPhase.tasks.map((task) =>
                task.task_id === itemId && type === "task"
                  ? { ...task, task_status: newStatus }
                  : task
              ),
              materials: prevPhase.materials.map((material) =>
                material.material_id === itemId && type === "material"
                  ? { ...material, material_status: newStatus }
                  : material
              ),
            }
          : null
      );
  
      onStatusUpdate(itemId, type, newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };  

  return (
    <>
      <div
        className="relative w-full rounded overflow-hidden"
        style={{ height: `${requiredHeight}px` }}
      >
        {/* Date indicators */}
        <div className="absolute top-0 left-0 w-full flex justify-between text-xs text-zinc-600 dark:text-white/70 px-2">
          {Array.from({ length: dateIntervals }, (_, i) => (
            <span key={i}>{getDateString(i * dayInterval)}</span>
          ))}
        </div>

        {/* Phase bars */}
        {phases.map((phase, index) => (
          <div
            key={phase.id}
            className="absolute h-6 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
            style={{
              left: `${getPositionPercentage(phase.startDate)}%`,
              width: `${getPhaseWidth(phase.startDate, phase.endDate)}%`,
              top: `${topMargin + index * phaseHeight}px`,
              backgroundColor: phase.color,
            }}
            onClick={() => setSelectedPhase(phase)}
          >
            <div className="w-full h-full px-2 flex items-center">
              <span className="text-xs font-semibold text-white truncate">
                {phase.name}
              </span>
            </div>
          </div>
        ))}

        {/* Current week indicator */}
        {getCurrentWeekPosition() !== null && (
          <div
            className="absolute bg-zinc-600 dark:bg-white/70 rounded-full"
            style={{
              left: `${getCurrentWeekPosition()}%`,
              top: `${topMargin}px`,
              bottom: "0",
              width: "4px",
              transform: "translateX(-50%)",
            }}
          />
        )}
      </div>

      {/* Phase Items Popup */}
      {selectedPhase && !selectedItem && (
        <PhaseItemsPopup
          phase={selectedPhase}
          onClose={() => setSelectedPhase(null)}
          onItemClick={(item) => setSelectedItem(item)}
        />
      )}

      {/* Item Detail Popup */}
      {selectedItem && (
        <ItemDetailPopup
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </>
  );
};

export default Timeline;
