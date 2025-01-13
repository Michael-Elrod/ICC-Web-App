// components/TasksCard.tsx
import React, { useState, useEffect, useRef } from "react";
import SmallCardFrame from "../util/SmallCardFrame";
import StatusButton from "./StatusButton";
import { formatPhoneNumber, createLocalDate, addBusinessDays } from "../../app/utils";
import { TaskView, UserView } from "../../app/types/views";
import { TaskUpdatePayload } from "@/app/types/database";

interface TasksCardProps {
  tasks: TaskView[];
  contacts: UserView[];
  onStatusUpdate: (
    id: number,
    type: "task" | "material",
    newStatus: string
  ) => void;
  onDelete: (id: number) => Promise<void>;
}

const TasksCard: React.FC<TasksCardProps> = ({
  tasks,
  contacts,
  onStatusUpdate,
  onDelete,
}) => {
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [localTasks, setLocalTasks] = useState(tasks);
  const [activeModal, setActiveModal] = useState<number | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sortedTasks = [...tasks].sort((a, b) => 
    new Date(a.task_startdate).getTime() - new Date(b.task_startdate).getTime()
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (activeModal !== null) {
      const task = localTasks.find((t) => t.task_id === activeModal);
      if (task) {
        setSelectedUsers(new Set(task.users.map((u) => u.user_id)));
      }
    } else {
      setSelectedUsers(new Set());
    }
  }, [activeModal, localTasks]);

  const handleUserSelection = (userId: number) => {
    setSelectedUsers((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(userId)) {
        newSelection.delete(userId);
      } else {
        newSelection.add(userId);
      }
      return newSelection;
    });
  };

  const calculateDateRange = (startDate: string, duration: number): string => {
    try {
      const start = createLocalDate(startDate);
      if (isNaN(start.getTime())) {
        throw new Error("Invalid start date");
      }
      
      // For duration 0 or 1, just show the single date
      if (duration <= 1) {
        return start.toLocaleDateString("en-US", {
          month: "numeric",
          day: "numeric",
        });
      }
    
      // For longer durations, use addBusinessDays from utils
      const end = addBusinessDays(start, duration - 1);
    
      return `${start.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
      })}-${end.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
      })}`;
    } catch (error) {
      console.error("Error calculating date range:", error);
      return "Invalid Date";
    }
  };

  const handleStatusChange = (taskId: number, newStatus: string) => {
    setLocalTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.task_id === taskId ? { ...task, task_status: newStatus } : task
      )
    );
    onStatusUpdate(taskId, "task", newStatus);
  };

  const handleCardClick = (e: React.MouseEvent, taskId: number) => {
    if (!(e.target as HTMLElement).closest(".status-button")) {
      setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
    }
  };

  const setsAreEqual = (a: Set<number>, b: Set<number>) => {
    const arrayA = Array.from(a);
    const arrayB = Array.from(b);
    if (arrayA.length !== arrayB.length) return false;
    return arrayA.every((item) => arrayB.includes(item));
  };

  const handleSaveChanges = async (taskId: number) => {
    const task = localTasks.find((t) => t.task_id === taskId);
    if (!task) return;

    const changes: TaskUpdatePayload = {};
    let hasChanges = false;

    const titleInput = document.getElementById(
      `task-title-${taskId}`
    ) as HTMLInputElement;
    const descriptionInput = document.getElementById(
      `task-description-${taskId}`
    ) as HTMLTextAreaElement;
    const extensionInput = document.getElementById(
      `task-extension-${taskId}`
    ) as HTMLInputElement;

    if (titleInput && titleInput.value !== task.task_title) {
      changes.task_title = titleInput.value;
      hasChanges = true;
    }

    if (descriptionInput && descriptionInput.value !== task.task_description) {
      changes.task_description = descriptionInput.value;
      hasChanges = true;
    }

    const extensionDays = extensionInput ? parseInt(extensionInput.value) : 0;
    if (!isNaN(extensionDays)) {
      changes.extension_days = extensionDays;
      hasChanges = true;
    }

    // Check if user selection has changed
    const currentUserIds = new Set(task.users.map((u) => u.user_id));
    if (!setsAreEqual(currentUserIds, selectedUsers)) {
      changes.new_users = Array.from(selectedUsers);
      hasChanges = true;
    }

    if (hasChanges) {
      try {
        const jobId = window.location.pathname.split("/")[2];
        const response = await fetch(`/api/jobs/${jobId}/tasks/${taskId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(changes),
        });

        if (!response.ok) {
          throw new Error("Failed to update task");
        }

        setActiveModal(null);
        window.location.reload();
      } catch (error) {
        console.error("Error updating task:", error);
      }
    } else {
      setActiveModal(null);
    }
  };

  return (
    <div className="space-y-2">
      <h4 className="text-md font-semibold mb-2">Tasks</h4>
      <div className="space-y-2">
        {sortedTasks.map((task) => {
          const isExpanded = expandedTaskId === task.task_id;

          return (
            <div key={task.task_id}>
              <SmallCardFrame>
                <div
                  onClick={(e) => handleCardClick(e, task.task_id)}
                  className="cursor-pointer"
                >
                  <div className="grid grid-cols-3 items-center">
                    <span className="text-sm font-medium col-span-1">
                      {task.task_title}
                    </span>
                    <span className="text-sm text-center col-span-1">
                      {calculateDateRange(
                        task.task_startdate,
                        task.task_duration
                      )}
                    </span>
                    <div className="flex justify-end col-span-1">
                      <div className="status-button">
                        <StatusButton
                          id={task.task_id}
                          type="task"
                          currentStatus={task.task_status}
                          onStatusChange={(newStatus) =>
                            handleStatusChange(task.task_id, newStatus)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-600">
                      {task.task_description && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium mb-2">
                            Description:
                          </h5>
                          <SmallCardFrame>
                            <p className="text-sm">{task.task_description}</p>
                          </SmallCardFrame>
                        </div>
                      )}

                      {task.users && task.users.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium mb-2">
                            Assigned People:
                          </h5>
                          {task.users.map((user) => (
                            <SmallCardFrame key={user.user_id}>
                              <div className="grid grid-cols-3 items-center">
                                <span className="text-sm">
                                  {`${user.first_name} ${user.last_name}`}
                                </span>
                                <span className="text-sm text-center">
                                  {formatPhoneNumber(user.user_phone)}
                                </span>
                                <span className="text-sm text-right">
                                  {user.user_email}
                                </span>
                              </div>
                            </SmallCardFrame>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveModal(task.task_id);
                          }}
                          className="px-4 py-2 bg-gray-500 text-white rounded font-bold hover:bg-gray-600 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </SmallCardFrame>

              {/* Edit Task Modal */}
              {activeModal === task.task_id && (
                <div
                  className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setActiveModal(null);
                    }
                  }}
                >
                  <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-2xl w-full overflow-hidden relative">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold">Edit Task</h3>
                        <button
                          onClick={() => setActiveModal(null)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Title
                          </label>
                          <input
                            id={`task-title-${task.task_id}`}
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:border-zinc-600"
                            defaultValue={task.task_title}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                          </label>
                          <textarea
                            id={`task-description-${task.task_id}`}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:border-zinc-600"
                            rows={3}
                            defaultValue={task.task_description}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Add Extension (Days)
                          </label>
                          <input
                            id={`task-extension-${task.task_id}`}
                            type="number"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:border-zinc-600"
                            placeholder="Number of days"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Add People
                          </label>
                          <div className="relative" ref={dropdownRef}>
                            <input
                              type="text"
                              placeholder="Search people..."
                              value={userSearchQuery}
                              onChange={(e) =>
                                setUserSearchQuery(e.target.value)
                              }
                              onClick={() => setIsDropdownOpen(true)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:border-zinc-600"
                            />
                            {isDropdownOpen && (
                              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md shadow-lg max-h-60 overflow-auto">
                                {contacts
                                  .filter(
                                    (user) =>
                                      !selectedUsers.has(user.user_id) &&
                                      (`${user.first_name} ${user.last_name}`
                                        .toLowerCase()
                                        .includes(
                                          userSearchQuery.toLowerCase()
                                        ) ||
                                        user.user_email
                                          .toLowerCase()
                                          .includes(
                                            userSearchQuery.toLowerCase()
                                          ))
                                  )
                                  .map((user) => (
                                    <div
                                      key={user.user_id}
                                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700 cursor-pointer"
                                      onClick={() => {
                                        handleUserSelection(user.user_id);
                                        setIsDropdownOpen(false);
                                      }}
                                    >
                                      {`${user.first_name} ${user.last_name} (${user.user_email})`}
                                    </div>
                                  ))}
                              </div>
                            )}

                            {/* Selected Users List */}
                            <div className="flex flex-wrap gap-2 mt-4">
                              {Array.from(selectedUsers).map((userId) => {
                                const user = contacts.find(
                                  (u) => u.user_id === userId
                                );
                                if (!user) return null;

                                return (
                                  <div
                                    key={userId}
                                    className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
                                  >
                                    <span>{`${user.first_name} ${user.last_name}`}</span>
                                    <button
                                      onClick={() =>
                                        handleUserSelection(userId)
                                      }
                                      className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-4">
                          <button
                            onClick={() => setActiveModal(null)}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await onDelete(task.task_id);
                                setActiveModal(null);
                              } catch (error) {
                                console.error("Error deleting task:", error);
                              }
                            }}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handleSaveChanges(task.task_id)}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TasksCard;
