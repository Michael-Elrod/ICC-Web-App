// page.tsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventContentArg } from "@fullcalendar/core";
import { Job } from "../types/database";
import {
  CalendarEvent,
  SelectedEventInfo,
  EventPopup,
} from "./_components/EventPopup";
import { createLocalDate, formatToDateString } from "@/app/utils";
import { Legend, LegendToggle } from "./_components/Legend";

const phaseColors = [
  "#B8DEFF", // soft blue
  "#D4D6FF", // soft periwinkle
  "#FFB3B3", // soft pink
  "#D7C0E8", // soft purple
  "#C3D7FF", // soft steel blue
  "#B4E6E0", // soft turquoise
  "#FFD1B3", // soft orange
  "#BBC7D4", // soft navy
];

const jobColors = [
  "#FFD6D6", // soft salmon
  "#C2ECE8", // soft teal
  "#BDE5F2", // soft sky blue
  "#D6EBE0", // soft sage
  "#FFF3D1", // soft cream
  "#F2D6D6", // soft rose
  "#E1D2E8", // soft lavender
  "#CCE5FF", // soft powder blue
];

export default function CalendarPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SelectedEventInfo | null>(
    null,
  );
  const [legendItems, setLegendItems] = useState<
    Array<{ label: string; color: string }>
  >([]);
  const calendarRef = useRef<FullCalendar>(null);
  const [currentTitle, setCurrentTitle] = useState(() =>
    new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  );

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch("/api/calendar");
        const data = await response.json();
        setJobs(Array.isArray(data) ? data : []);
        if (data.length > 0) {
          setSelectedJobId(null);
        }
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
        setJobs([]);
      }
    };
    fetchJobs();
  }, []);

  const updateEventStatus = (
    itemId: number,
    type: "task" | "material",
    newStatus: "Complete" | "Incomplete" | "In Progress",
  ) => {
    setEvents((currentEvents) =>
      currentEvents.map((event) => {
        if (event.id === `${type}-${itemId}` && event.extendedProps) {
          return {
            ...event,
            extendedProps: {
              ...event.extendedProps,
              type: event.extendedProps.type,
              itemId: event.extendedProps.itemId,
              status: newStatus,
            },
          };
        }
        return event;
      }),
    );
  };

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .fc-more-popover {
        background-color: white !important;
      }
  
      .dark .fc-more-popover {
        background-color: rgb(17, 24, 39) !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        if (selectedJobId) {
          const response = await fetch(`/api/calendar?jobId=${selectedJobId}`);
          const data = await response.json();

          const phaseLegendItems =
            data.phases?.map((phase: any, index: number) => ({
              label: phase.phase_title,
              color: phaseColors[index % phaseColors.length],
            })) || [];

          setLegendItems(phaseLegendItems);

          const calendarEvents: CalendarEvent[] = [];

          data.phases?.forEach((phase: any, phaseIndex: number) => {
            const phaseColor = phaseColors[phaseIndex % phaseColors.length];

            phase.tasks?.forEach((task: any) => {
              const startDate = createLocalDate(
                String(task.task_startdate).split("T")[0],
              );
              const endDate = new Date(startDate);
              let daysToAdd = task.task_duration;
              let currentDay = 0;

              while (currentDay < daysToAdd) {
                endDate.setDate(endDate.getDate() + 1);
                if (endDate.getDay() !== 0 && endDate.getDay() !== 6) {
                  currentDay++;
                }
              }

              calendarEvents.push({
                id: `task-${task.task_id}`,
                title: task.task_title,
                start: String(task.task_startdate).split("T")[0],
                end: formatToDateString(endDate),
                color: phaseColor,
                order: 1,
                allDay: true,
                display: "block",
                extendedProps: {
                  phaseId: phase.phase_id,
                  type: "task",
                  duration: task.task_duration,
                  status: task.task_status,
                  itemId: task.task_id,
                  description: task.task_description,
                  contacts: task.assigned_users,
                },
              });
            });

            phase.materials?.forEach((material: any) => {
              calendarEvents.push({
                id: `material-${material.material_id}`,
                title: material.material_title,
                start: material.material_duedate.toString().split("T")[0],
                color: phaseColor,
                order: 2,
                allDay: true,
                display: "list-item",
                extendedProps: {
                  type: "material",
                  status: material.material_status,
                  itemId: material.material_id,
                  description: material.material_description,
                  contacts: material.assigned_users,
                },
              });
            });
          });

          setEvents(calendarEvents);
        } else {
          const responses = await Promise.all(
            jobs.map((job) => fetch(`/api/calendar?jobId=${job.job_id}`)),
          );
          const jobsData = await Promise.all(responses.map((r) => r.json()));

          const jobLegendItems = jobs.map((job, index) => ({
            label: job.job_title,
            color: jobColors[index % jobColors.length],
          }));
          setLegendItems(jobLegendItems);

          const allEvents: CalendarEvent[] = [];
          jobsData.forEach((jobData, jobIndex) => {
            const jobColor = jobColors[jobIndex % jobColors.length];

            jobData.phases?.forEach((phase: any) => {
              phase.tasks?.forEach((task: any) => {
                const startDate = createLocalDate(
                  String(task.task_startdate).split("T")[0],
                );
                const endDate = new Date(startDate);
                let daysToAdd = task.task_duration;
                let currentDay = 0;

                while (currentDay < daysToAdd) {
                  endDate.setDate(endDate.getDate() + 1);
                  if (endDate.getDay() !== 0 && endDate.getDay() !== 6) {
                    currentDay++;
                  }
                }

                allEvents.push({
                  id: `task-${task.task_id}`,
                  title: `${jobData.job_title}: ${task.task_title}`,
                  start: String(task.task_startdate).split("T")[0],
                  end: formatToDateString(endDate),
                  color: jobColor,
                  order: 1,
                  display: "block",
                  extendedProps: {
                    type: "task",
                    duration: task.task_duration,
                    status: task.task_status,
                    itemId: task.task_id,
                    description: task.task_description,
                    contacts: task.assigned_users,
                  },
                });
              });

              phase.materials?.forEach((material: any) => {
                allEvents.push({
                  id: `material-${material.material_id}`,
                  title: `${jobData.job_title}: ${material.material_title}`,
                  start: material.material_duedate.toString().split("T")[0],
                  color: jobColor,
                  order: 2,
                  allDay: true,
                  display: "list-item",
                  extendedProps: {
                    type: "material",
                    status: material.material_status,
                    itemId: material.material_id,
                    description: material.material_description,
                    contacts: material.assigned_users,
                  },
                });
              });
            });
          });

          setEvents(allEvents);
        }
      } catch (error) {
        console.error("Failed to fetch job details:", error);
      }
    };

    fetchJobDetails();
  }, [selectedJobId, jobs]);

  const renderEventContent = (eventInfo: EventContentArg) => {
    const isComplete = eventInfo.event.extendedProps.status === "Complete";

    return (
      <div
        style={{
          padding: "2px",
          overflow: "hidden",
          cursor: "pointer",
          textDecoration: isComplete ? "line-through" : "none",
          opacity: isComplete ? 0.5 : 1,
          color: "inherit",
        }}
        className="hover:opacity-75 transition-opacity flex items-center gap-2 text-gray-900 dark:text-gray-100"
      >
        {/* Status dot */}
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            eventInfo.event.extendedProps.status === "Complete"
              ? "bg-green-500"
              : eventInfo.event.extendedProps.status === "In Progress"
                ? "bg-yellow-500"
                : "bg-red-500"
          }`}
        />
        <div className="min-w-0">
          <div
            style={{
              fontWeight: "bold",
              fontSize: "0.85em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {eventInfo.event.title}
          </div>
          {!eventInfo.event.allDay && eventInfo.timeText && (
            <div style={{ fontSize: "0.75em", opacity: 0.7 }}>
              {eventInfo.timeText}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1">
      <div className="px-4 sm:px-6 pt-8 pb-3 sm:py-4">
        <div className="flex items-center gap-3 sm:block">
          <h1 className="text-xl sm:text-3xl font-bold sm:mb-4">Calendar</h1>
          <select
            value={selectedJobId || ""}
            onChange={(e) =>
              setSelectedJobId(e.target.value ? Number(e.target.value) : null)
            }
            className="flex-1 sm:flex-none sm:w-64 sm:mb-4 px-3 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Jobs</option>
            {jobs.map((job) => (
              <option key={job.job_id} value={job.job_id}>
                {job.job_title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile: Legend toggle + month/year on one row */}
      <div className="sm:hidden flex items-center justify-between px-4 mb-2">
        <LegendToggle items={legendItems} />
        <span className="text-base font-semibold">{currentTitle}</span>
      </div>

      {/* Desktop: full legend */}
      <div className="hidden sm:block">
        <Legend items={legendItems} />
      </div>

      <div
        style={{ height: "calc(100vh - 200px)" }}
        className="px-2 sm:px-4 pt-2 sm:pt-4
                [&_.fc-toolbar]:flex [&_.fc-toolbar]:items-center [&_.fc-toolbar]:gap-2
                [&_.fc-toolbar-chunk]:flex [&_.fc-toolbar-chunk]:items-center [&_.fc-toolbar-chunk]:gap-1
                [&_.fc-toolbar-chunk:nth-child(2)]:hidden
                sm:[&_.fc-toolbar-chunk:nth-child(2)]:flex"
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          datesSet={(dateInfo) => setCurrentTitle(dateInfo.view.title)}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,customWeek,customDay",
          }}
          views={{
            dayGridMonth: {
              displayEventTime: false,
            },
            customWeek: {
              type: "dayGrid",
              duration: { weeks: 1 },
              buttonText: "week",
              dayHeaderFormat: {
                weekday: "short",
                month: "numeric",
                day: "numeric",
              },
            },
            customDay: {
              type: "dayGrid",
              duration: { days: 1 },
              buttonText: "day",
              dayHeaderFormat: {
                weekday: "long",
                month: "long",
                day: "numeric",
              },
            },
          }}
          weekends={false}
          eventDisplay="block"
          events={events}
          eventContent={renderEventContent}
          displayEventEnd={false}
          displayEventTime={false}
          dayMaxEvents={5}
          eventOrder="order,title"
          eventOrderStrict={true}
          eventClick={(info) => {
            setSelectedEvent({
              title: info.event.title,
              start: info.event.startStr,
              type: info.event.extendedProps.type,
              duration: info.event.extendedProps.duration,
              phaseId: info.event.extendedProps.phaseId,
              status: info.event.extendedProps.status,
              itemId: info.event.extendedProps.itemId,
              description: info.event.extendedProps.description,
              contacts: info.event.extendedProps.contacts,
            });
            setShowPopup(true);
          }}
          height="100%"
        />
      </div>

      {showPopup && selectedEvent && (
        <EventPopup
          event={selectedEvent}
          onClose={() => {
            setShowPopup(false);
            setSelectedEvent(null);
          }}
          onStatusUpdate={updateEventStatus}
        />
      )}
    </div>
  );
}
