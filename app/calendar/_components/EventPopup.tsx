// EventPopup.tsx

import React, { useState } from "react";
import { useSession } from "next-auth/react";

export interface CalendarEvent {
  id: string;
  order: number;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  color?: string;
  display?: string;
  extendedProps: {
    phaseId?: number;
    type: "task" | "material";
    duration?: number;
    status: "Complete" | "Incomplete" | "In Progress";
    itemId: number;
    description?: string;
    contacts?: Array<{
      firstName: string;
      lastName: string;
      email: string;
    }>;
  };
}

export interface SelectedEventInfo {
  title: string;
  start: string;
  end?: string;
  phaseId?: number;
  type: "task" | "material";
  duration?: number;
  status: "Complete" | "Incomplete" | "In Progress";
  itemId: number;
  description?: string;
  contacts?: Array<{
    firstName: string;
    lastName: string;
    email: string;
  }>;
}

interface EventPopupProps {
  event: SelectedEventInfo;
  onClose: () => void;
  onStatusUpdate: (
    itemId: number,
    type: "task" | "material",
    newStatus: "Complete" | "Incomplete" | "In Progress",
  ) => void;
}

export const EventPopup = ({
  event,
  onClose,
  onStatusUpdate,
}: EventPopupProps) => {
  const [selectedStatus, setSelectedStatus] = useState<
    "Complete" | "Incomplete" | "In Progress" | null
  >(null);

  const { data: sessionData } = useSession();

  // Check if user has admin access
  const hasAdminAccess =
    sessionData?.user?.type === "Owner" || sessionData?.user?.type === "Admin";

  // Check if current user is assigned to this item
  const isUserAssigned = event.contacts?.some(
    (contact) =>
      `${contact.firstName} ${contact.lastName}`.toLowerCase() ===
        `${sessionData?.user?.name}`.toLowerCase() ||
      contact.email === sessionData?.user?.email,
  );

  // Only allow editing if user is an admin or assigned to the item
  const canEdit = hasAdminAccess || isUserAssigned;

  const handlePopupClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;

    try {
      const response = await fetch(
        `/api/calendar?type=${event.type}&id=${event.itemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: selectedStatus }),
        },
      );

      if (response.ok) {
        onStatusUpdate(event.itemId, event.type, selectedStatus);
        onClose();
      } else {
        console.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getAvailableStatuses = () => {
    return ["Complete", "Incomplete", "In Progress"].filter(
      (status) => status !== event.status,
    );
  };

  const getWeekdayDateRange = (start: Date, durationDays: number) => {
    const dates = [];
    let currentDate = new Date(start);
    let remainingDays = durationDays;

    while (remainingDays > 0) {
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        dates.push(new Date(currentDate));
        remainingDays--;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      start: dates[0],
      end: dates[dates.length - 1],
    };
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-800 rounded-lg p-6 max-w-md w-full m-4"
        onClick={handlePopupClick}
      >
        <div className="space-y-4">
          {/* Title as Header */}
          <h2 className="text-xl font-bold text-zinc-700 dark:text-white">
            {event.title}
          </h2>

          {/* Date Range Section */}
          <div>
            <h3 className="font-semibold text-zinc-700 dark:text-white mb-2">
              Date Range
            </h3>
            <p className="text-zinc-600 dark:text-zinc-300">
              {event.type === "task"
                ? event.start && event.duration
                  ? (() => {
                      const dateRange = getWeekdayDateRange(
                        new Date(event.start),
                        event.duration,
                      );
                      return `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`;
                    })()
                  : "Date range not available"
                : `Due: ${new Date(event.start).toLocaleDateString()}`}
            </p>
          </div>

          {/* Status Section */}
          <div>
            <h3 className="font-semibold text-zinc-700 dark:text-white mb-2">
              Status
            </h3>
            <p className="text-zinc-600 dark:text-zinc-300">{event.status}</p>
          </div>

          {/* Description Section */}
          <div>
            <h3 className="font-semibold text-zinc-700 dark:text-white mb-2">
              Description
            </h3>
            <p className="text-zinc-600 dark:text-zinc-300">
              {event.description || "No description available"}
            </p>
          </div>

          {/* Contacts Section */}
          <div>
            <h3 className="font-semibold text-zinc-700 dark:text-white mb-2">
              Contacts
            </h3>
            <div className="text-zinc-600 dark:text-zinc-300">
              {event.contacts && event.contacts.length > 0 ? (
                event.contacts.map((contact, index) => (
                  <div key={index} className="mb-2">
                    <p>
                      {contact.firstName} {contact.lastName}
                    </p>
                    <p className="text-sm">{contact.email}</p>
                  </div>
                ))
              ) : (
                <p>No contacts assigned</p>
              )}
            </div>
          </div>

          {/* Status Update Section - Only show if user can edit */}
          {canEdit ? (
            <div className="pt-4 flex justify-between items-center">
              <select
                className="border border-gray-300 dark:border-zinc-600 rounded px-4 py-2 bg-white dark:bg-zinc-700"
                value={selectedStatus || ""}
                onChange={(e) =>
                  setSelectedStatus(
                    e.target.value as "Complete" | "Incomplete" | "In Progress",
                  )
                }
              >
                <option value="" disabled>
                  Change Status
                </option>
                {getAvailableStatuses().map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <button
                onClick={handleStatusUpdate}
                className="px-4 py-2 text-white font-bold bg-blue-500 hover:bg-blue-700 rounded-md"
                disabled={!selectedStatus}
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
