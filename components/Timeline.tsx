// Timeline.tsx

"use client";

import React, { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { UserView, PhaseView } from "@/app/types/views";
import { TimelineProps } from "@/app/types/props";
import { formatPhoneNumber } from "@/app/utils";

const TIMELINE_CONFIG = {
  phaseHeight: 28,
  phaseGap: 0,
  topMargin: 24,
  bottomMargin: 20,
  dateLabels: 5,
  minPhaseWidthPx: 4,
};

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

type StatusType = "Complete" | "Incomplete" | "In Progress";

const parseDate = (dateStr: string): Date => {
  const date = new Date(dateStr);

  if (dateStr.includes("/") && !dateStr.includes("-")) {
    const [month, day] = dateStr.split("/").map(Number);
    const year = new Date().getFullYear();
    return new Date(year, month - 1, day);
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

const getDaysBetween = (start: Date, end: Date): number => {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
};

const formatShortDate = (date: Date): string => {
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const convertStatus = (status: string): StatusType => {
  if (status === "Complete") return "Complete";
  if (status === "In Progress") return "In Progress";
  return "Incomplete";
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
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
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      task.task_status === "Complete"
                        ? "bg-green-500"
                        : task.task_status === "In Progress"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
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
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      material.material_status === "Complete"
                        ? "bg-green-500"
                        : material.material_status === "In Progress"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

const ItemDetailPopup = ({
  item,
  onClose,
  onBack,
  onStatusUpdate,
  hasAdminAccess = false,
}: {
  item: TimelineItem;
  onClose: () => void;
  onBack: () => void;
  onStatusUpdate: (
    itemId: number,
    type: "task" | "material",
    newStatus: StatusType,
  ) => void;
  hasAdminAccess?: boolean;
}) => {
  const [selectedStatus, setSelectedStatus] = useState<StatusType>(item.status);
  const [contactSearch, setContactSearch] = useState("");
  const [contactsExpanded, setContactsExpanded] = useState(false);
  const { data: session } = useSession();

  const allStatuses: StatusType[] = ["Complete", "Incomplete", "In Progress"];

  const currentUserId = session?.user?.id ? parseInt(session.user.id) : null;
  const isUserAssigned = item.users.some(
    (user) => user.user_id === currentUserId,
  );
  const canEdit = hasAdminAccess || isUserAssigned;

  const filteredUsers = item.users.filter((user) => {
    const searchLower = contactSearch.toLowerCase();
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const phone = user.user_phone || "";
    return fullName.includes(searchLower) || phone.includes(contactSearch);
  });

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-800 rounded-lg p-6 max-w-md w-full m-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h2 className="text-xl font-bold">{item.title}</h2>
          </div>

          {item.type === "task" && item.startDate && (
            <div>
              <h3 className="font-semibold mb-2">Date Range</h3>
              <p>
                {(() => {
                  const start = parseDate(item.startDate);
                  if (item.duration && item.duration > 1) {
                    const end = new Date(start);
                    let daysToAdd = item.duration - 1;
                    while (daysToAdd > 0) {
                      end.setDate(end.getDate() + 1);
                      if (end.getDay() !== 0 && end.getDay() !== 6) {
                        daysToAdd--;
                      }
                    }
                    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
                  }
                  return start.toLocaleDateString();
                })()}
              </p>
            </div>
          )}

          {item.type === "material" && item.dueDate && (
            <div>
              <h3 className="font-semibold mb-2">Due Date</h3>
              <p>{parseDate(item.dueDate).toLocaleDateString()}</p>
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
            <div className="bg-zinc-50 dark:bg-zinc-700/50 rounded-lg border border-zinc-200 dark:border-zinc-600 overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                onClick={() => setContactsExpanded(!contactsExpanded)}
              >
                <div className="flex items-center gap-3">
                  <h4 className="text-md font-semibold">Contacts</h4>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    ({item.users.length})
                  </span>
                </div>
                <button className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
                  {contactsExpanded ? (
                    <FaChevronUp size={16} />
                  ) : (
                    <FaChevronDown size={16} />
                  )}
                </button>
              </div>
              {contactsExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-zinc-200 dark:border-zinc-600">
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm mb-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="max-h-48 overflow-y-auto rounded border border-zinc-200 dark:border-zinc-600">
                    {filteredUsers.map((user: UserView, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 border-b border-zinc-200 dark:border-zinc-600 last:border-b-0"
                      >
                        <span className="text-sm">
                          {user.first_name} {user.last_name}
                        </span>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                          {formatPhoneNumber(user.user_phone) || "No phone"}
                        </span>
                      </div>
                    ))}
                    {filteredUsers.length === 0 && (
                      <div className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 italic">
                        No contacts found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {canEdit ? (
            <div className="pt-4 flex justify-between items-center">
              <select
                className="appearance-none border border-zinc-200 dark:border-zinc-600 rounded-lg pl-4 pr-10 py-2 bg-white dark:bg-zinc-700 dark:text-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(e.target.value as StatusType)
                }
              >
                {allStatuses.map((status) => (
                  <option
                    key={status}
                    value={status}
                    className="bg-white dark:bg-zinc-700 dark:text-white"
                  >
                    {status}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  if (selectedStatus && selectedStatus !== item.status) {
                    onStatusUpdate(item.id, item.type, selectedStatus);
                    onClose();
                  }
                }}
                className="px-4 py-2 text-white font-bold bg-blue-500 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedStatus || selectedStatus === item.status}
              >
                Save
              </button>
            </div>
          ) : (
            <div className="pt-4 text-sm text-gray-500 italic">
              You must be assigned to this item to update its status
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Timeline: React.FC<TimelineProps> = ({
  phases,
  startDate,
  endDate,
  onStatusUpdate,
}) => {
  const [selectedPhase, setSelectedPhase] = useState<PhaseView | null>(null);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const { data: session } = useSession();

  const hasAdminAccess =
    session?.user?.type === "Owner" || session?.user?.type === "Admin";

  const timelineData = useMemo(() => {
    const jobStart = parseDate(startDate);
    const jobEnd = parseDate(endDate);
    const totalDays = Math.max(1, getDaysBetween(jobStart, jobEnd));

    return { jobStart, jobEnd, totalDays };
  }, [startDate, endDate]);

  const { jobStart, jobEnd, totalDays } = timelineData;

  // Calculate container height
  const containerHeight =
    TIMELINE_CONFIG.topMargin +
    phases.length * (TIMELINE_CONFIG.phaseHeight + TIMELINE_CONFIG.phaseGap) +
    TIMELINE_CONFIG.bottomMargin;

  const getPosition = (date: Date): number => {
    const days = getDaysBetween(jobStart, date);
    return clamp((days / totalDays) * 100, 0, 100);
  };

  const getPhaseLayout = (phaseStart: string, phaseEnd: string) => {
    const startPos = getPosition(parseDate(phaseStart));
    const endPos = getPosition(parseDate(phaseEnd));

    // Width is the difference, ensuring it doesn't extend past 100%
    const width = Math.max(0, endPos - startPos);

    return { left: startPos, width };
  };

  const dateLabels = useMemo(() => {
    const labels: { date: Date; position: number }[] = [];
    const labelCount = TIMELINE_CONFIG.dateLabels;

    for (let i = 0; i < labelCount; i++) {
      if (i === labelCount - 1) {
        labels.push({ date: jobEnd, position: 100 });
      } else {
        const fraction = i / (labelCount - 1);
        const daysFromStart = Math.round(fraction * totalDays);
        const date = new Date(jobStart);
        date.setDate(date.getDate() + daysFromStart);
        labels.push({ date, position: fraction * 100 });
      }
    }

    return labels;
  }, [jobStart, jobEnd, totalDays]);

  const currentDateData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (today < jobStart || today > jobEnd) {
      return null;
    }

    return {
      position: getPosition(today),
      label: formatShortDate(today),
    };
  }, [jobStart, jobEnd, totalDays]);

  const handleStatusUpdate = async (
    itemId: number,
    type: "task" | "material",
    newStatus: StatusType,
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

      setSelectedPhase((prevPhase) =>
        prevPhase
          ? {
              ...prevPhase,
              tasks: prevPhase.tasks.map((task) =>
                task.task_id === itemId && type === "task"
                  ? { ...task, task_status: newStatus }
                  : task,
              ),
              materials: prevPhase.materials.map((material) =>
                material.material_id === itemId && type === "material"
                  ? { ...material, material_status: newStatus }
                  : material,
              ),
            }
          : null,
      );

      onStatusUpdate(itemId, type, newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <>
      <div
        className="relative w-full"
        style={{ height: `${containerHeight}px` }}
      >
        <div className="absolute top-0 left-0 right-0 flex justify-between text-xs text-zinc-600 dark:text-white/70">
          {dateLabels.map((label, i) => (
            <span
              key={i}
              className={
                i === dateLabels.length - 1
                  ? "text-right"
                  : i === 0
                    ? "text-left"
                    : "text-center"
              }
              style={{
                position:
                  i === 0 || i === dateLabels.length - 1
                    ? "relative"
                    : "absolute",
                left:
                  i === 0 || i === dateLabels.length - 1
                    ? undefined
                    : `${label.position}%`,
                transform:
                  i === 0 || i === dateLabels.length - 1
                    ? undefined
                    : "translateX(-50%)",
              }}
            >
              {formatShortDate(label.date)}
            </span>
          ))}
        </div>

        {phases.map((phase, index) => {
          const layout = getPhaseLayout(phase.startDate, phase.endDate);

          return (
            <div
              key={phase.id}
              className="absolute h-6 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
              style={{
                left: `${layout.left}%`,
                width: `calc(${layout.width}% + ${TIMELINE_CONFIG.minPhaseWidthPx}px)`,
                maxWidth: `${100 - layout.left}%`, // Prevent overflow
                top: `${TIMELINE_CONFIG.topMargin + index * (TIMELINE_CONFIG.phaseHeight + TIMELINE_CONFIG.phaseGap)}px`,
                backgroundColor: phase.color,
                minWidth: `${TIMELINE_CONFIG.minPhaseWidthPx}px`,
              }}
              onClick={() => setSelectedPhase(phase)}
            >
              <div className="w-full h-full px-2 flex items-center overflow-hidden">
                <span className="text-xs font-semibold text-white truncate">
                  {phase.name}
                </span>
              </div>
            </div>
          );
        })}

        {currentDateData !== null && (
          <div
            className="absolute pointer-events-none flex flex-col items-center"
            style={{
              left: `${currentDateData.position}%`,
              top: `${TIMELINE_CONFIG.topMargin}px`,
              bottom: "0",
              transform: "translateX(-50%)",
            }}
          >
            <div
              className="flex-1 w-[3px] bg-zinc-600 dark:bg-white/70 rounded-full"
              style={{ marginBottom: "4px" }}
            />
            <span className="text-xs text-zinc-600 dark:text-white/70 whitespace-nowrap">
              {currentDateData.label}
            </span>
          </div>
        )}
      </div>

      {selectedPhase && !selectedItem && (
        <PhaseItemsPopup
          phase={selectedPhase}
          onClose={() => setSelectedPhase(null)}
          onItemClick={(item) => setSelectedItem(item)}
        />
      )}

      {selectedItem && (
        <ItemDetailPopup
          item={selectedItem}
          onClose={() => {
            setSelectedItem(null);
            setSelectedPhase(null);
          }}
          onBack={() => setSelectedItem(null)}
          onStatusUpdate={handleStatusUpdate}
          hasAdminAccess={hasAdminAccess}
        />
      )}
    </>
  );
};

export default Timeline;
