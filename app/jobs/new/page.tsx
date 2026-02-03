"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import CardFrame from "../../../components/util/CardFrame";
import NewJobCard from "../../../components/new/NewJobCard";
import PhaseCard from "../../../components/new/NewPhaseCard";
import { InvalidItemProp } from "@/app/types/props";
import { FormPhase, User } from "@/app/types/database";
import { PhaseView, TaskView, MaterialView } from "../../types/views";
import {
  createLocalDate,
  formatToDateString,
  getBusinessDaysBetween,
  addBusinessDays,
  getCurrentBusinessDate,
} from "@/app/utils";
import {
  handleCreateJob,
  handlePhaseUpdate,
  getJobTypes,
} from "../../../handlers/new/jobs";

export default function NewJobPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewJobContent />
    </Suspense>
  );
}

function NewJobContent() {
  type JobType = string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobTypes = getJobTypes();
  const [jobType, setJobType] = useState<string>("");
  const [phases, setPhases] = useState<FormPhase[]>([]);
  const [showNewJobCard, setShowNewJobCard] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [contacts, setContacts] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isCreateJobDisabled = !jobType || !startDate;
  const [originalJobName, setOriginalJobName] = useState<string>("");
  const [willCopyFloorplans, setWillCopyFloorplans] = useState(false);
  const [floorplansToCopyCount, setFloorplansToCopyCount] = useState(0);
  const [jobDetailsErrors, setJobDetailsErrors] = useState<{
    [key: string]: string;
  }>({});
  const [jobDetails, setJobDetails] = useState({
    jobTitle: "",
    jobLocation: "",
    description: "",
    selectedClient: null as { user_id: number } | null,
    floorPlans: [] as File[],
  });

  useEffect(() => {
    const isCopyingJob = searchParams.get("copy") === "true";

    if (isCopyingJob) {
      const jobDataString = localStorage.getItem("jobToCopy");
      if (jobDataString) {
        try {
          const jobData = JSON.parse(jobDataString);

          // Get copy options, defaulting to true if not provided (for backward compatibility)
          const copyOptions = jobData.copyOptions || {
            workerAssignments: true,
            notes: true,
            floorplans: true,
          };

          const willCopyFloorplans =
            copyOptions.floorplans &&
            jobData.floorplans &&
            jobData.floorplans.length > 0;

          const floorplansToCopyCount = willCopyFloorplans
            ? jobData.floorplans.length
            : 0;

          setWillCopyFloorplans(willCopyFloorplans);
          setFloorplansToCopyCount(floorplansToCopyCount);

          // Set basic job info
          setJobType("copy");
          setStartDate(jobData.newStartDate);
          setOriginalJobName(jobData.originalJobName);
          setShowNewJobCard(true);
          setContacts(jobData.contacts || []);

          if (
            copyOptions.floorplans &&
            jobData.floorplans &&
            jobData.floorplans.length > 0
          ) {
            // We can't directly copy files, but we can store info about them to copy later
            localStorage.setItem(
              "floorplansToCopy",
              JSON.stringify({
                originalJobId: jobData.originalJobId,
                floorplans: jobData.floorplans,
              })
            );
          }
          console.log("Job data from localStorage:", jobData);
          console.log("Will copy floorplans:", willCopyFloorplans);
          console.log("Floorplans count:", floorplansToCopyCount);
          // Calculate offsets and new dates
          const originalStartDate = createLocalDate(
            jobData.jobDetails.originalStartDate
          );
          const newStartDate = createLocalDate(jobData.newStartDate);

          const copiedPhases = jobData.phases.map(
            (phase: PhaseView, phaseIndex: number) => {
              const isPreplanningPhase = phaseIndex === 0;

              if (isPreplanningPhase) {
                // First create tasks and materials for preplanning
                const newTasks = phase.tasks.map((task: TaskView) => {
                  // Handle worker assignments based on copy options
                  const mappedContacts = copyOptions.workerAssignments
                    ? task.users?.map((user) => ({
                        id: user.user_id.toString(),
                        user_id: user.user_id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        user_email: user.user_email,
                        user_phone: user.user_phone || "",
                      })) || []
                    : [];

                  if (task.task_title === "One Call Lot") {
                    return {
                      id: `task-${Date.now()}-${Math.random()}`,
                      title: task.task_title,
                      startDate: formatToDateString(
                        addBusinessDays(newStartDate, -10)
                      ),
                      duration: task.task_duration,
                      details: task.task_description || "",
                      selectedContacts: mappedContacts,
                      isExpanded: false,
                    };
                  }
                  return {
                    id: `task-${Date.now()}-${Math.random()}`,
                    title: task.task_title,
                    startDate: formatToDateString(
                      getCurrentBusinessDate(new Date())
                    ),
                    duration: task.task_duration,
                    details: task.task_description || "",
                    selectedContacts: mappedContacts,
                    isExpanded: false,
                  };
                });

                const newMaterials = phase.materials.map(
                  (material: MaterialView) => {
                    // Handle worker assignments based on copy options
                    const mappedContacts = copyOptions.workerAssignments
                      ? material.users?.map((user) => ({
                          id: user.user_id.toString(),
                          user_id: user.user_id,
                          first_name: user.first_name,
                          last_name: user.last_name,
                          user_email: user.user_email,
                          user_phone: user.user_phone || "",
                        })) || []
                      : [];

                    if (
                      material.material_title ===
                      "Materials ordered for block work"
                    ) {
                      return {
                        id: `material-${Date.now()}-${Math.random()}`,
                        title: material.material_title,
                        dueDate: formatToDateString(
                          addBusinessDays(newStartDate, -5)
                        ),
                        details: material.material_description || "",
                        selectedContacts: mappedContacts,
                        isExpanded: false,
                      };
                    }
                    return {
                      id: `material-${Date.now()}-${Math.random()}`,
                      title: material.material_title,
                      dueDate: formatToDateString(
                        getCurrentBusinessDate(new Date())
                      ),
                      details: material.material_description || "",
                      selectedContacts: mappedContacts,
                      isExpanded: false,
                    };
                  }
                );

                // Calculate phase start date based on earliest task or material
                const allDates = [
                  ...newTasks.map((task) => task.startDate),
                  ...newMaterials.map((material) => material.dueDate),
                ];

                const phaseStartDate = allDates.reduce((earliest, current) =>
                  current < earliest ? current : earliest
                );

                // Only include notes if they should be copied
                const phaseNotes = copyOptions.notes
                  ? (phase.notes || []).map((note) => ({
                      id: `note-${Date.now()}-${Math.random()}`,
                      content: note.note_details || "",
                      isExpanded: false,
                    }))
                  : [];

                return {
                  tempId: `phase-${Date.now()}-${Math.random()}`,
                  title: phase.name,
                  description: phase.description || "",
                  startDate: phaseStartDate,
                  tasks: newTasks,
                  materials: newMaterials,
                  notes: phaseNotes,
                };
              } else {
                // Create tasks and materials for regular phases
                const newTasks = phase.tasks.map((task: TaskView) => {
                  const taskStartDate = createLocalDate(task.task_startdate);
                  const taskOffset = getBusinessDaysBetween(
                    originalStartDate,
                    taskStartDate
                  );
                  const newTaskStartDate = addBusinessDays(
                    newStartDate,
                    taskOffset
                  );

                  // Handle worker assignments based on copy options
                  const mappedContacts = copyOptions.workerAssignments
                    ? task.users?.map((user) => ({
                        id: user.user_id.toString(),
                      })) || []
                    : [];

                  return {
                    id: `task-${Date.now()}-${Math.random()}`,
                    title: task.task_title,
                    startDate: formatToDateString(newTaskStartDate),
                    duration: task.task_duration,
                    details: task.task_description || "",
                    selectedContacts: mappedContacts,
                    isExpanded: false,
                  };
                });

                const newMaterials = phase.materials.map(
                  (material: MaterialView) => {
                    const materialDueDate = createLocalDate(
                      material.material_duedate
                    );
                    const materialOffset = getBusinessDaysBetween(
                      originalStartDate,
                      materialDueDate
                    );
                    const newMaterialDueDate = addBusinessDays(
                      newStartDate,
                      materialOffset
                    );

                    // Handle worker assignments based on copy options
                    const mappedContacts = copyOptions.workerAssignments
                      ? material.users?.map((user) => ({
                          id: user.user_id.toString(),
                        })) || []
                      : [];

                    return {
                      id: `material-${Date.now()}-${Math.random()}`,
                      title: material.material_title,
                      dueDate: formatToDateString(newMaterialDueDate),
                      details: material.material_description || "",
                      selectedContacts: mappedContacts,
                      isExpanded: false,
                    };
                  }
                );

                // Calculate phase start date based on earliest task or material
                const allDates = [
                  ...newTasks.map((task) => task.startDate),
                  ...newMaterials.map((material) => material.dueDate),
                ];

                const phaseStartDate = allDates.reduce((earliest, current) =>
                  current < earliest ? current : earliest
                );

                // Only include notes if they should be copied
                const phaseNotes = copyOptions.notes
                  ? (phase.notes || []).map((note) => ({
                      id: `note-${Date.now()}-${Math.random()}`,
                      content: note.note_details || "",
                      isExpanded: false,
                    }))
                  : [];

                return {
                  tempId: `phase-${Date.now()}-${Math.random()}`,
                  title: phase.name,
                  description: phase.description || "",
                  startDate: phaseStartDate,
                  tasks: newTasks,
                  materials: newMaterials,
                  notes: phaseNotes,
                };
              }
            }
          );

          setPhases(copiedPhases);
        } catch (error) {
          console.error("Error parsing job data:", error);
        }
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch(`/api/users/non-clients?t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          setContacts(data);
        }
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    };

    fetchContacts();
  }, []);

  const handleMovePhase = (
    index: number,
    direction: "up" | "down" | "future"
  ) => {
    const newPhases = [...phases];
    if (direction === "up" && index > 0) {
      [newPhases[index], newPhases[index - 1]] = [
        newPhases[index - 1],
        newPhases[index],
      ];
    } else if (direction === "down" && index < phases.length - 1) {
      [newPhases[index], newPhases[index + 1]] = [
        newPhases[index + 1],
        newPhases[index],
      ];
    }
    setPhases(newPhases);
  };

  const handleSubmitJob = async () => {
    try {
      setIsSubmitting(true);

      // Check job title first
      if (!jobDetails.jobTitle?.trim()) {
        const jobDetailsElement = document.getElementById(
          "job-details-section"
        );
        if (jobDetailsElement) {
          jobDetailsElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
        setJobDetailsErrors({ jobTitle: "Job title is required" });
        throw new Error("Job title is required");
      }

      // Then check for invalid items in phases
      const invalidItem = findFirstInvalidItem(phases);
      if (invalidItem) {
        const updatedPhases = [...phases];
        const phase = updatedPhases[invalidItem.phaseIndex];

        if (invalidItem.type === "task") {
          phase.tasks[invalidItem.itemIndex].isExpanded = true;
        } else if (invalidItem.type === "material") {
          phase.materials[invalidItem.itemIndex].isExpanded = true;
        } else if (invalidItem.type === "note") {
          phase.notes[invalidItem.itemIndex].isExpanded = true;
        }

        setPhases(updatedPhases);

        setTimeout(() => {
          const element = document.getElementById(invalidItem.elementId);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);

        throw new Error(
          `Please complete all required fields for ${invalidItem.type}`
        );
      }

      if (!startDate) {
        throw new Error("Start date is required");
      }

      // Create job first
      const jobFormData = new FormData();

      // Append basic job details
      jobFormData.append("jobTitle", jobDetails.jobTitle.trim());
      jobFormData.append("startDate", startDate);
      jobFormData.append("jobLocation", jobDetails.jobLocation?.trim() || "");
      jobFormData.append("description", jobDetails.description?.trim() || "");

      // Check if we're copying a job
      const isCopyingJob = jobType === "copy";

      // Handle client information
      if (jobDetails.selectedClient) {
        jobFormData.append("client", JSON.stringify(jobDetails.selectedClient));
      }

      // Handle floorplan copying from original job
      if (isCopyingJob && willCopyFloorplans) {
        const jobDataString = localStorage.getItem("jobToCopy");
        if (jobDataString) {
          const jobData = JSON.parse(jobDataString);
          if (jobData.originalJobId) {
            jobFormData.append(
              "copyFloorplansFromJobId",
              jobData.originalJobId.toString()
            );
          }
        }
      }

      // Add any directly uploaded floor plans
      if (jobDetails.floorPlans && jobDetails.floorPlans.length > 0) {
        jobDetails.floorPlans.forEach((file) => {
          jobFormData.append("floorPlans", file);
        });
      }

      const jobResponse = await fetch("/api/jobs/new", {
        method: "POST",
        body: jobFormData,
      });

      const jobResponseText = await jobResponse.text();

      if (!jobResponse.ok) {
        try {
          const error = JSON.parse(jobResponseText);
          throw new Error(error.message || "Failed to create job");
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          throw new Error(`Server error: ${jobResponseText}`);
        }
      }

      let jobData;
      try {
        jobData = JSON.parse(jobResponseText);
      } catch (parseError) {
        console.error("Failed to parse success response:", parseError);
        throw new Error("Invalid response from server");
      }

      if (!jobData.jobId) {
        throw new Error("Failed to get job ID from server");
      }

      if (isCopyingJob && willCopyFloorplans) {
        try {
          console.log("Attempting to copy floorplans");
          const jobToCopyString = localStorage.getItem("jobToCopy");
          if (jobToCopyString) {
            console.log("Found jobToCopy in localStorage");
            const jobToCopy = JSON.parse(jobToCopyString);
            console.log("Job to copy data:", jobToCopy);
            if (jobToCopy.originalJobId) {
              console.log(
                `Making API call to copy floorplans from job ${jobToCopy.originalJobId} to job ${jobData.jobId}`
              );
              const response = await fetch(
                `/api/jobs/${jobData.jobId}/copy-floorplans`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    originalJobId: jobToCopy.originalJobId,
                  }),
                }
              );
              const copyResult = await response.json();
              console.log("Copy floorplans response:", copyResult);
            } else {
              console.log("No originalJobId found in jobToCopy");
            }
          } else {
            console.log("No jobToCopy found in localStorage");
          }
        } catch (error) {
          console.error("Error copying floorplans:", error);
        }
      } else {
        console.log("Skipping floorplan copy, conditions not met:", {
          isCopyingJob,
          willCopyFloorplans,
          hasFormDataEntry: jobFormData.has("copyFloorplansFromJobId"),
        });
      }

      // Now create phases one at a time
      for (const phase of phases) {
        const transformedPhase = {
          title: phase.title.trim(),
          startDate: phase.startDate,
          description: phase.description?.trim() || "",
          tasks: phase.tasks.map((task) => ({
            title: task.title.trim(),
            startDate: task.startDate,
            duration: task.duration.toString(),
            details: task.details?.trim() || "",
            assignedUsers:
              task.selectedContacts?.map((contact) => parseInt(contact.id)) ||
              [],
          })),
          materials: phase.materials.map((material) => ({
            title: material.title.trim(),
            dueDate: material.dueDate,
            details: material.details?.trim() || "",
            assignedUsers:
              material.selectedContacts?.map((contact) =>
                parseInt(contact.id)
              ) || [],
          })),
          notes: phase.notes.map((note) => ({
            content: note.content.trim(),
          })),
        };

        const phaseFormData = new FormData();
        phaseFormData.append("phase", JSON.stringify(transformedPhase));

        const phaseResponse = await fetch(`/api/jobs/${jobData.jobId}/phases`, {
          method: "POST",
          body: phaseFormData,
        });

        if (!phaseResponse.ok) {
          const phaseErrorText = await phaseResponse.text();
          throw new Error(`Failed to create phase: ${phaseErrorText}`);
        }
      }

      // Clean up any temporary storage
      if (isCopyingJob) {
        localStorage.removeItem("jobToCopy");
      }

      router.push(`/jobs/${jobData.jobId}`);
    } catch (err: unknown) {
      console.error("Error creating job:", {
        error:
          err instanceof Error
            ? {
                message: err.message,
                stack: err.stack,
              }
            : err,
      });
      setIsSubmitting(false);
      if (err instanceof Error) {
        console.error(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPhase = (afterPhaseId: string | null) => {
    const newPhase: FormPhase = {
      tempId: `phase-${Date.now()}`,
      title: "New Phase",
      description: "",
      startDate: startDate,
      tasks: [],
      materials: [],
      notes: [],
    };

    if (afterPhaseId === null) {
      // Add to end
      setPhases([...phases, newPhase]);
    } else {
      // Insert after specified phase
      const index = phases.findIndex((p) => p.tempId === afterPhaseId);
      const newPhases = [
        ...phases.slice(0, index + 1),
        newPhase,
        ...phases.slice(index + 1),
      ];
      setPhases(newPhases);
    }
  };

  const findFirstInvalidItem = (
    phases: FormPhase[]
  ): InvalidItemProp | null => {
    for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
      const phase = phases[phaseIndex];

      // Check tasks
      const invalidTask = phase.tasks.findIndex(
        (task) => !task.title?.trim() || !task.startDate || !task.duration
      );
      if (invalidTask !== -1) {
        return {
          type: "task",
          phaseIndex,
          itemIndex: invalidTask,
          elementId: `task-${phase.tasks[invalidTask].id}`,
        };
      }

      // Check materials
      const invalidMaterial = phase.materials.findIndex(
        (material) => !material.title?.trim() || !material.dueDate
      );
      if (invalidMaterial !== -1) {
        return {
          type: "material",
          phaseIndex,
          itemIndex: invalidMaterial,
          elementId: `material-${phase.materials[invalidMaterial].id}`,
        };
      }

      // Check notes
      const invalidNote = phase.notes.findIndex(
        (note) => !note.content?.trim()
      );
      if (invalidNote !== -1) {
        return {
          type: "note",
          phaseIndex,
          itemIndex: invalidNote,
          elementId: `note-${phase.notes[invalidNote].id}`,
        };
      }
    }
    return null;
  };

  return (
    <div className="mx-auto space-y-4">
      {!showNewJobCard ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-left mb-2">Create Template</h2>
          <CardFrame>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="jobType"
                  className="block text-sm font-medium text-zinc-700 dark:text-white"
                >
                  Job Type
                </label>
                <select
                  id="jobType"
                  className="mt-1 w-full border rounded-md shadow-sm p-2 text-zinc-700 dark:text-white border-zinc-300 dark:border-zinc-600 h-[44px] bg-white dark:bg-zinc-800 appearance-none"
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                >
                  <option value="" disabled>
                    Choose Job Type
                  </option>
                  {jobTypes.map((type: JobType) => (
                    <option key={type} value={type}>
                      {type
                        .split("-")
                        .map(
                          (word: string) =>
                            word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-zinc-700 dark:text-white"
                >
                  Start Date
                </label>
                <DatePicker
                  selected={startDate ? createLocalDate(startDate) : null}
                  onChange={(date: Date | null) => {
                    if (date) {
                      const dateString = formatToDateString(date);
                      setStartDate(dateString);
                    }
                  }}
                  filterDate={(date: Date) => {
                    const day = date.getDay();
                    return day !== 0 && day !== 6;
                  }}
                  minDate={new Date()}
                  dateFormat="MM/dd/yyyy"
                  placeholderText="Choose Start Date"
                  className="mt-1 w-full border rounded-md shadow-sm p-2 text-zinc-700 dark:text-white border-zinc-300 dark:bg-zinc-800 dark:border-zinc-600 h-[44px] appearance-none placeholder:text-zinc-700 dark:placeholder:text-white"
                  required
                  wrapperClassName="w-full"
                />
              </div>
            </div>
          </CardFrame>

          <div className="flex justify-end">
            <button
              className={`px-6 py-2 text-white font-bold rounded-md transition-colors ${
                isCreateJobDisabled
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
              onClick={() =>
                handleCreateJob(
                  jobType,
                  startDate,
                  setShowNewJobCard,
                  setPhases
                )
              }
              disabled={isCreateJobDisabled}
            >
              Create Job
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold">
              {jobType === "copy"
                ? `Copy of ${originalJobName}`
                : `Job Type - ${jobType}`}
            </h2>
            <span className="text-lg text-gray-600">
              {startDate
                ? (() => {
                    const date = createLocalDate(startDate);
                    const month = (date.getMonth() + 1).toString();
                    const day = date.getDate().toString();
                    const year = date.getFullYear();
                    return `${month}/${day}/${year}`;
                  })()
                : ""}
            </span>
          </div>

          <NewJobCard
            jobType={jobType}
            startDate={startDate}
            errors={jobDetailsErrors}
            willCopyFloorplans={willCopyFloorplans}
            floorplansToCopyCount={floorplansToCopyCount}
            onJobDetailsChange={({
              jobTitle,
              jobLocation,
              description,
              selectedClient,
              floorPlans,
            }) => {
              setJobDetails({
                jobTitle,
                jobLocation: jobLocation || "",
                description: description || "",
                selectedClient: selectedClient || null,
                floorPlans: floorPlans || [],
              });
              setJobDetailsErrors({});
            }}
          />

          <div className="mt-8 space-y-4">
            <h2 className="text-2xl font-bold">Phases</h2>
            <div className="relative h-2">
              {/* Container for top insert button */}
              <div className="absolute left-0 right-0 -top-2 h-8 flex justify-center items-center transition-opacity duration-200 opacity-0 hover:opacity-100">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
                  onClick={() => {
                    const newPhase = {
                      tempId: `phase-${Date.now()}`,
                      title: "New Phase",
                      description: "",
                      startDate: startDate,
                      tasks: [],
                      materials: [],
                      notes: [],
                    };
                    setPhases([newPhase, ...phases]);
                  }}
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {phases.map((phase, index) => (
                <PhaseCard
                  key={phase.tempId}
                  phase={{
                    ...phase,
                    isFirst: index === 0,
                    isLast: index === phases.length - 1,
                  }}
                  onDelete={() => {
                    const newPhases = phases.filter((_, i) => i !== index);
                    setPhases(newPhases);
                  }}
                  jobStartDate={startDate}
                  onUpdate={(updatedPhase, extend, extendFuturePhases) =>
                    handlePhaseUpdate(
                      updatedPhase,
                      setPhases,
                      extend,
                      extendFuturePhases
                    )
                  }
                  onAddPhaseAfter={(phaseId) => {
                    const newPhase = {
                      tempId: `phase-${Date.now()}`,
                      title: "New Phase",
                      description: "",
                      startDate: startDate,
                      tasks: [],
                      materials: [],
                      notes: [],
                    };
                    const insertIndex =
                      phases.findIndex((p) => p.tempId === phaseId) + 1;
                    const newPhases = [
                      ...phases.slice(0, insertIndex),
                      newPhase,
                      ...phases.slice(insertIndex),
                    ];
                    setPhases(newPhases);
                  }}
                  onMovePhase={(direction) => handleMovePhase(index, direction)}
                  contacts={contacts.map((user) => ({
                    user_id: user.user_id,
                    first_name: user.user_first_name,
                    last_name: user.user_last_name,
                    user_email: user.user_email,
                    user_phone: user.user_phone || "",
                  }))}
                />
              ))}
              {phases.length === 0 && (
                <div className="flex justify-center py-8">
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                    onClick={() => handleAddPhase(null)}
                  >
                    Add First Phase
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 mb-8 flex justify-end gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 text-white font-bold rounded-md shadow-lg bg-zinc-500 hover:bg-zinc-600 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSubmitJob}
              disabled={isSubmitting}
              className={`px-6 py-3 text-white font-bold rounded-md shadow-lg transition-colors ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600"
              }`}
              title={!jobDetails.jobTitle ? "Job title is required" : ""}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating Job...
                </span>
              ) : (
                "Create Job"
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
