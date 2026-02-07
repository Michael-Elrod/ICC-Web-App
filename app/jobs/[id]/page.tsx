"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Timeline from "@/components/Timeline";
import ContentTabs from "./_components/ContentTabs";
import CardFrame from "@/components/CardFrame";
import PhaseCard from "@/components/PhaseCard";
import ContactCard from "@/components/ContactCard";
import UserInfoRow from "@/components/UserInfoRow";
import StatusBar from "@/components/StatusBar";
import JobDetailSkeleton from "./_components/JobDetailSkeleton";
import CopyJobModal from "./_components/CopyJobModal";
import CloseJobModal from "./_components/CloseJobModal";
import DeleteJobModal from "./_components/DeleteJobModal";
import FloorplanViewer from "@/components/FloorplanViewer";
import Image from "next/image";
import { validateFiles } from "@/app/lib/s3";
import { JobUpdatePayload, FormTask, FormMaterial } from "@/app/types/database";
import { useParams, useRouter } from "next/navigation";
import {
  createLocalDate,
  formatToDateString,
  addBusinessDays,
  calculatePhaseDates,
} from "@/app/utils";
import {
  JobDetailView,
  PhaseView,
  TaskView,
  MaterialView,
  UserView,
  Tab,
  FloorPlan,
} from "../../types/views";

export default function JobDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [job, setJob] = useState<JobDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showRemoveAllModal, setShowRemoveAllModal] = useState(false);
  const [selectedFloorplanId, setSelectedFloorplanId] = useState<number | null>(
    null
  );
  const [activeModal, setActiveModal] = useState<"edit" | "floorplan" | null>(
    null
  );
  const [contacts, setContacts] = useState<UserView[]>([]);
  const [collapsedPhases, setCollapsedPhases] = useState<Set<number>>(
    new Set()
  );
  const hasAdminAccess =
    session?.user?.type === "Owner" || session?.user?.type === "Admin";

  const handleJobClose = async () => {
    try {
      const response = await fetch(`/api/jobs/${id}/close`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to close job");
      }

      router.push("/jobs");
    } catch (error) {
      console.error("Error closing job:", error);
      setError("Failed to close job");
    }
  };

  const handleJobDelete = async () => {
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete job");
      }

      router.push("/jobs");
    } catch (error) {
      console.error("Error deleting job:", error);
      setError("Failed to delete job");
    }
  };

  const FloorplanUploadModal = ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) => {
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = async () => {
      if (!selectedFiles) return;

      setUploading(true);
      setError(null);
      const formData = new FormData();

      try {
        // Validate files before upload
        const filesArray = Array.from(selectedFiles);
        validateFiles(filesArray);

        filesArray.forEach((file) => {
          formData.append("files", file);
        });

        const response = await fetch(`/api/jobs/${id}/floorplan`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Upload failed");
        }

        onClose();
        window.location.reload();
      } catch (error) {
        setError(error instanceof Error ? error.message : "Upload failed");
        console.error("Error uploading floorplans:", error);
      } finally {
        setUploading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Upload Floor Plans</h3>
            <button
              onClick={onClose}
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

          <div className="mb-6">
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,application/pdf"
              multiple
              onChange={(e) => {
                setSelectedFiles(e.target.files);
                setError(null);
              }}
              className="w-full p-2 border border-gray-300 rounded"
            />
            <p className="mt-2 text-sm text-gray-500">
              Accepted formats: JPEG, PNG, GIF, PDF (max 5MB per file)
            </p>
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFiles || uploading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-blue-300"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleRemoveCurrent = async (index: number) => {
    const floorplan = job?.floorplans[index];
    if (!floorplan) return;

    const matches = floorplan.name.match(/Floor Plan (\d+)/);
    const floorplanId = matches ? matches[1] : null;

    if (!floorplanId) {
      console.error("Could not extract floorplan ID");
      return;
    }

    setSelectedFloorplanId(parseInt(floorplanId));
    setShowRemoveModal(true);
  };

  const handleRemoveAll = () => {
    setShowRemoveAllModal(true);
  };

  const confirmRemoveCurrent = async () => {
    try {
      if (!selectedFloorplanId) {
        console.error("No floorplan ID selected");
        return;
      }

      const response = await fetch(
        `/api/jobs/${id}/floorplan?floorplanId=${selectedFloorplanId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove floorplan");
      }

      setShowRemoveModal(false);
      window.location.reload();
    } catch (error) {
      console.error("Error removing floorplan:", error);
    }
  };

  const confirmRemoveAll = async () => {
    try {
      const response = await fetch(`/api/jobs/${id}/floorplan`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove all floorplans");
      }

      setShowRemoveAllModal(false);
      window.location.reload();
    } catch (error) {
      console.error("Error removing all floorplans:", error);
    }
  };

  const handleJobCopy = (
    newStartDate: Date,
    copyOptions: {
      workerAssignments: boolean;
      notes: boolean;
      floorplans: boolean;
    }
  ) => {
    if (!job) return;
  
    const jobDataForCopy = {
      originalJobId: job.id,
      jobDetails: {
        originalStartDate: job.phases[1].startDate.split("T")[0],
      },
      originalJobName: job.jobName,
      phases: job.phases,
      newStartDate: newStartDate.toISOString().split("T")[0],
      copyOptions: copyOptions,
      floorplans: copyOptions.floorplans ? job.floorplans : [],
    };
    
    console.log("Saving job data with floorplans:", jobDataForCopy);
    localStorage.setItem("jobToCopy", JSON.stringify(jobDataForCopy));
    router.push("/jobs/new?copy=true");
  };

  const handlePhaseUpdate = async (
    phaseId: number,
    updates: {
      title: string;
      startDate: string;
      extend: number;
      extendFuturePhases: boolean;
      daysDiff?: number;
    }
  ) => {
    try {
      let updatedPhase: PhaseView | null = null;
      let otherUpdatedPhases: PhaseView[] = [];

      const getLatestDate = (
        tasks: TaskView[],
        materials: MaterialView[]
      ): string => {
        let latestDate = new Date(-8640000000000000);

        tasks.forEach((task) => {
          const taskStart = createLocalDate(task.task_startdate);
          const taskEnd = addBusinessDays(taskStart, task.task_duration - 1);
          if (taskEnd > latestDate) {
            latestDate = taskEnd;
          }
        });

        materials.forEach((material) => {
          const materialDate = createLocalDate(material.material_duedate);
          if (materialDate > latestDate) {
            latestDate = materialDate;
          }
        });

        return formatToDateString(latestDate);
      };

      const getEarliestDate = (
        tasks: TaskView[],
        materials: MaterialView[]
      ): string => {
        let earliestDate = new Date(8640000000000000);

        tasks.forEach((task) => {
          const taskStart = createLocalDate(task.task_startdate);
          if (taskStart < earliestDate) {
            earliestDate = taskStart;
          }
        });

        materials.forEach((material) => {
          const materialDate = createLocalDate(material.material_duedate);
          if (materialDate < earliestDate) {
            earliestDate = materialDate;
          }
        });

        return formatToDateString(earliestDate);
      };

      setJob((prevJob) => {
        if (!prevJob) return null;

        const phaseIndex = prevJob.phases.findIndex((p) => p.id === phaseId);
        if (phaseIndex === -1) return prevJob;

        const updatedPhases = [...prevJob.phases];
        const currentPhase: PhaseView = {
          ...updatedPhases[phaseIndex],
          tasks: [...updatedPhases[phaseIndex].tasks],
          materials: [...updatedPhases[phaseIndex].materials],
          notes: [...updatedPhases[phaseIndex].notes],
        };

        if (updates.title !== currentPhase.name) {
          currentPhase.name = updates.title;
        }

        if (updates.daysDiff) {
          currentPhase.tasks = currentPhase.tasks.map((task) => {
            const newDate = formatToDateString(
              addBusinessDays(
                createLocalDate(task.task_startdate),
                updates.daysDiff!
              )
            );

            return {
              ...task,
              task_startdate: newDate,
            };
          });

          currentPhase.materials = currentPhase.materials.map((material) => {
            const newDate = formatToDateString(
              addBusinessDays(
                createLocalDate(material.material_duedate),
                updates.daysDiff!
              )
            );

            return {
              ...material,
              material_duedate: newDate,
            };
          });
        }

        if (updates.extend > 0) {
          currentPhase.tasks = currentPhase.tasks.map((task) => {
            const newDuration = task.task_duration + (updates.extend - 1);
            return {
              ...task,
              task_duration: newDuration,
            };
          });

          currentPhase.materials = currentPhase.materials.map((material) => {
            const newDate = formatToDateString(
              addBusinessDays(
                createLocalDate(material.material_duedate),
                updates.extend
              )
            );

            return {
              ...material,
              material_duedate: newDate,
            };
          });
        }

        const { startDate, endDate } = calculatePhaseDates(
          currentPhase.tasks,
          currentPhase.materials
        );
        currentPhase.startDate = startDate;
        currentPhase.endDate = endDate;
        updatedPhases[phaseIndex] = currentPhase;

        if (updates.extendFuturePhases && updates.extend > 0) {
          for (let i = phaseIndex + 1; i < updatedPhases.length; i++) {
            const phase: PhaseView = {
              ...updatedPhases[i],
              tasks: [...updatedPhases[i].tasks],
              materials: [...updatedPhases[i].materials],
              notes: [...updatedPhases[i].notes],
            };

            phase.tasks = phase.tasks.map((task) => {
              const newDate = formatToDateString(
                addBusinessDays(
                  createLocalDate(task.task_startdate),
                  updates.extend
                )
              );

              return {
                ...task,
                task_startdate: newDate,
              };
            });

            phase.materials = phase.materials.map((material) => {
              const newDate = formatToDateString(
                addBusinessDays(
                  createLocalDate(material.material_duedate),
                  updates.extend
                )
              );

              return {
                ...material,
                material_duedate: newDate,
              };
            });

            phase.startDate = getEarliestDate(phase.tasks, phase.materials);
            phase.endDate = getLatestDate(phase.tasks, phase.materials);
            updatedPhases[i] = phase;
          }
        }

        updatedPhase = currentPhase;
        otherUpdatedPhases = updates.extendFuturePhases
          ? updatedPhases.slice(phaseIndex + 1)
          : [];

        return {
          ...prevJob,
          phases: updatedPhases,
        };
      });

      if (!updatedPhase) {
        throw new Error("Failed to update phase: Phase data is null");
      }

      const phase = updatedPhase as PhaseView;

      await fetch(`/api/jobs/${params.id}/phases/${phaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: phase.name,
          startDate: phase.startDate,
          extend: updates.extend,
          extendFuturePhases: updates.extendFuturePhases,
          daysDiff: updates.daysDiff,
        }),
      });

      window.location.reload();
    } catch (error) {
      console.error("Error updating phase:", error);
      throw error;
    }
  };

  const handleTaskDelete = async (taskId: number) => {
    try {
      const response = await fetch(`/api/jobs/${id}/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      setJob((prevJob) => {
        if (!prevJob) return null;

        const phaseWithTask = prevJob.phases.find((phase) =>
          phase.tasks.some((task) => task.task_id === taskId)
        );

        if (!phaseWithTask) {
          console.error("Task not found in any phase");
          return prevJob;
        }

        const updatedPhases = prevJob.phases.map((phase) => {
          if (phase.id === phaseWithTask.id) {
            const updatedTasks = phase.tasks.filter(
              (task) => task.task_id !== taskId
            );

            let phaseStart =
              phase.tasks.length > 0
                ? createLocalDate(phase.tasks[0].task_startdate)
                : phase.materials.length > 0
                ? createLocalDate(phase.materials[0].material_duedate)
                : new Date();

            let phaseEnd = new Date(phaseStart);

            updatedTasks.forEach((task) => {
              const taskStart = createLocalDate(task.task_startdate);
              const taskEnd = createLocalDate(task.task_startdate);
              taskEnd.setDate(taskEnd.getDate() + task.task_duration);

              if (taskStart < phaseStart) phaseStart = taskStart;
              if (taskEnd > phaseEnd) phaseEnd = taskEnd;
            });

            phase.materials.forEach((material) => {
              const materialDate = createLocalDate(material.material_duedate);
              if (materialDate < phaseStart) phaseStart = materialDate;
              if (materialDate > phaseEnd) phaseEnd = materialDate;
            });

            const newStartDate = formatToDateString(phaseStart);
            const newEndDate = formatToDateString(phaseEnd);

            if (newStartDate !== phase.startDate) {
              fetch(`/api/jobs/${id}/phases/${phase.id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  startDate: newStartDate,
                }),
              }).catch((error) => {
                console.error("Error updating phase dates:", error);
              });
            }

            return {
              ...phase,
              tasks: updatedTasks,
              startDate: newStartDate,
              endDate: newEndDate,
            };
          }
          return phase;
        });

        const newStatusCounts = calculateStatusCounts(updatedPhases);
        const newDateRange = calculateDateRange(updatedPhases);

        return {
          ...prevJob,
          phases: updatedPhases,
          dateRange: newDateRange,
          ...newStatusCounts,
        };
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  };

  const handleMaterialDelete = async (materialId: number) => {
    try {
      const response = await fetch(`/api/jobs/${id}/materials/${materialId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete material");
      }

      setJob((prevJob) => {
        if (!prevJob) return null;

        const phaseWithMaterial = prevJob.phases.find((phase) =>
          phase.materials.some(
            (material) => material.material_id === materialId
          )
        );

        if (!phaseWithMaterial) {
          console.error("Material not found in any phase");
          return prevJob;
        }

        const updatedPhases = prevJob.phases.map((phase) => {
          if (phase.id === phaseWithMaterial.id) {
            const updatedMaterials = phase.materials.filter(
              (material) => material.material_id !== materialId
            );

            let phaseStart =
              phase.tasks.length > 0
                ? createLocalDate(phase.tasks[0].task_startdate)
                : updatedMaterials.length > 0
                ? createLocalDate(updatedMaterials[0].material_duedate)
                : new Date();

            let phaseEnd = new Date(phaseStart);

            phase.tasks.forEach((task) => {
              const taskStart = createLocalDate(task.task_startdate);
              const taskEnd = createLocalDate(task.task_startdate);
              taskEnd.setDate(taskEnd.getDate() + task.task_duration);

              if (taskStart < phaseStart) phaseStart = taskStart;
              if (taskEnd > phaseEnd) phaseEnd = taskEnd;
            });

            updatedMaterials.forEach((material) => {
              const materialDate = createLocalDate(material.material_duedate);
              if (materialDate < phaseStart) phaseStart = materialDate;
              if (materialDate > phaseEnd) phaseEnd = materialDate;
            });

            const newStartDate = formatToDateString(phaseStart);
            const newEndDate = formatToDateString(phaseEnd);

            if (newStartDate !== phase.startDate) {
              fetch(`/api/jobs/${id}/phases/${phase.id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  startDate: newStartDate,
                }),
              }).catch((error) => {
                console.error("Error updating phase dates:", error);
              });
            }

            return {
              ...phase,
              materials: updatedMaterials,
              startDate: newStartDate,
              endDate: newEndDate,
            };
          }
          return phase;
        });

        const newStatusCounts = calculateStatusCounts(updatedPhases);
        const newDateRange = calculateDateRange(updatedPhases);

        return {
          ...prevJob,
          phases: updatedPhases,
          dateRange: newDateRange,
          ...newStatusCounts,
        };
      });
    } catch (error) {
      console.error("Error deleting material:", error);
      throw error;
    }
  };

  const calculateDateRange = (phases: PhaseView[]): string => {
    if (!phases.length) return "";

    let startDate = new Date();
    let endDate = new Date();
    let isFirst = true;

    phases.forEach((phase) => {
      // Check tasks
      phase.tasks.forEach((task) => {
        const taskStart = new Date(task.task_startdate);
        const taskEnd = new Date(task.task_startdate);
        taskEnd.setDate(taskEnd.getDate() + task.task_duration);

        if (isFirst || taskStart < startDate) {
          startDate = taskStart;
          isFirst = false;
        }
        if (taskEnd > endDate) endDate = taskEnd;
      });

      // Check materials
      phase.materials.forEach((material) => {
        const materialDate = new Date(material.material_duedate);
        if (isFirst || materialDate < startDate) {
          startDate = materialDate;
          isFirst = false;
        }
        if (materialDate > endDate) endDate = materialDate;
      });
    });

    return `${startDate.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "2-digit",
    })} - ${endDate.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "2-digit",
    })}`;
  };

  const handleStatusUpdate = async (
    id: number,
    type: "task" | "material",
    newStatus: string
  ) => {
    try {
      // Make API call
      const response = await fetch(`/api/jobs/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, type, newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Update local state
      setJob((prevJob) => {
        if (!prevJob) return null;

        // Update tasks or materials in all phases
        const updatedPhases = prevJob.phases.map((phase) => ({
          ...phase,
          tasks:
            type === "task"
              ? phase.tasks.map((task) =>
                  task.task_id === id
                    ? { ...task, task_status: newStatus }
                    : task
                )
              : phase.tasks,
          materials:
            type === "material"
              ? phase.materials.map((material) =>
                  material.material_id === id
                    ? { ...material, material_status: newStatus }
                    : material
                )
              : phase.materials,
        }));

        // Update the overall tasks and materials arrays
        const updatedTasks =
          type === "task"
            ? prevJob.tasks.map((task) =>
                task.task_id === id ? { ...task, task_status: newStatus } : task
              )
            : prevJob.tasks;

        const updatedMaterials =
          type === "material"
            ? prevJob.materials.map((material) =>
                material.material_id === id
                  ? { ...material, material_status: newStatus }
                  : material
              )
            : prevJob.materials;

        // Recalculate all status counts
        const newStatusCounts = calculateStatusCounts(updatedPhases);

        return {
          ...prevJob,
          phases: updatedPhases,
          tasks: updatedTasks,
          materials: updatedMaterials,
          ...newStatusCounts,
        };
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleNoteDelete = async (phaseId: number, noteTimestamp: string) => {
    try {
      const response = await fetch(`/api/jobs/${id}/phases/${phaseId}/notes`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ created_at: noteTimestamp }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      // Update local state
      setJob((prevJob) => {
        if (!prevJob) return null;

        const updatedPhases = prevJob.phases.map((phase) => {
          if (phase.id === phaseId) {
            return {
              ...phase,
              notes: phase.notes.filter(
                (note) => note.created_at !== noteTimestamp
              ),
            };
          }
          return phase;
        });

        return {
          ...prevJob,
          phases: updatedPhases,
        };
      });
    } catch (error) {
      console.error("Error deleting note:", error);
      throw error;
    }
  };

  const handleTaskCreate = async (phaseId: number, newTask: FormTask) => {
    try {
      const response = await fetch(`/api/jobs/${id}/phases/${phaseId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      const createdTask = await response.json();

      setJob((prevJob) => {
        if (!prevJob) return null;

        const updatedPhases = prevJob.phases.map((phase) => {
          if (phase.id === phaseId) {
            // Add new task and sort
            const updatedTasks = [...phase.tasks, createdTask].sort(
              (a, b) =>
                new Date(a.task_startdate).getTime() -
                new Date(b.task_startdate).getTime()
            );

            // Calculate new phase end date
            let latestEndDate = new Date(phase.startDate);

            // Check all tasks
            updatedTasks.forEach((task) => {
              const taskStart = new Date(task.task_startdate);
              let taskEnd = new Date(taskStart);
              let daysToAdd = task.task_duration;

              // Skip weekends when calculating task end date
              while (daysToAdd > 0) {
                taskEnd.setDate(taskEnd.getDate() + 1);
                if (taskEnd.getDay() !== 0 && taskEnd.getDay() !== 6) {
                  daysToAdd--;
                }
              }

              if (taskEnd > latestEndDate) {
                latestEndDate = taskEnd;
              }
            });

            // Check all materials
            phase.materials.forEach((material) => {
              const materialDate = new Date(material.material_duedate);
              if (materialDate > latestEndDate) {
                latestEndDate = materialDate;
              }
            });

            return {
              ...phase,
              tasks: updatedTasks,
              endDate: latestEndDate.toISOString().split("T")[0],
            };
          }
          return phase;
        });

        const newStatusCounts = calculateStatusCounts(updatedPhases);
        const newDateRange = calculateDateRange(updatedPhases);

        return {
          ...prevJob,
          phases: updatedPhases,
          dateRange: newDateRange,
          ...newStatusCounts,
        };
      });

      return createdTask;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  };

  const handleMaterialCreate = async (
    phaseId: number,
    newMaterial: FormMaterial
  ) => {
    try {
      const response = await fetch(
        `/api/jobs/${id}/phases/${phaseId}/materials`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newMaterial),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create material");
      }

      const createdMaterial = await response.json();

      setJob((prevJob) => {
        if (!prevJob) return null;

        const updatedPhases = prevJob.phases.map((phase) => {
          if (phase.id === phaseId) {
            // Add new material and sort
            const updatedMaterials = [...phase.materials, createdMaterial].sort(
              (a, b) =>
                new Date(a.material_duedate).getTime() -
                new Date(b.material_duedate).getTime()
            );

            // Calculate new phase end date
            let latestEndDate = new Date(phase.startDate);

            // Check all tasks
            phase.tasks.forEach((task) => {
              const taskStart = new Date(task.task_startdate);
              let taskEnd = new Date(taskStart);
              let daysToAdd = task.task_duration;

              while (daysToAdd > 0) {
                taskEnd.setDate(taskEnd.getDate() + 1);
                if (taskEnd.getDay() !== 0 && taskEnd.getDay() !== 6) {
                  daysToAdd--;
                }
              }

              if (taskEnd > latestEndDate) {
                latestEndDate = taskEnd;
              }
            });

            // Check all materials
            updatedMaterials.forEach((material) => {
              const materialDate = new Date(material.material_duedate);
              if (materialDate > latestEndDate) {
                latestEndDate = materialDate;
              }
            });

            return {
              ...phase,
              materials: updatedMaterials,
              endDate: latestEndDate.toISOString().split("T")[0],
            };
          }
          return phase;
        });

        const newStatusCounts = calculateStatusCounts(updatedPhases);
        const newDateRange = calculateDateRange(updatedPhases);

        return {
          ...prevJob,
          phases: updatedPhases,
          dateRange: newDateRange,
          ...newStatusCounts,
        };
      });

      return createdMaterial;
    } catch (error) {
      console.error("Error creating material:", error);
      throw error;
    }
  };

  const calculateStatusCounts = (phases: PhaseView[]) => {
    let overdue = 0;
    let nextSevenDays = 0;
    let sevenDaysPlus = 0;
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    phases.forEach((phase) => {
      phase.tasks.forEach((task) => {
        if (task.task_status != "Complete") {
          const dueDate = new Date(task.task_startdate);
          dueDate.setDate(dueDate.getDate() + task.task_duration);

          if (dueDate < today) overdue++;
          else if (dueDate <= sevenDaysFromNow) nextSevenDays++;
          else sevenDaysPlus++;
        }
      });

      phase.materials.forEach((material) => {
        if (material.material_status != "Complete") {
          const dueDate = new Date(material.material_duedate);

          if (dueDate < today) overdue++;
          else if (dueDate <= sevenDaysFromNow) nextSevenDays++;
          else sevenDaysPlus++;
        }
      });
    });

    return { overdue, nextSevenDays, sevenDaysPlus };
  };

  useEffect(() => {
    if (activeModal === "edit" && job) {
      setEditJobTitle(job.jobName);
      setEditStartDate(new Date(job.job_startdate).toISOString().split("T")[0]);
    }
  }, [activeModal, job]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users");
        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();

        const transformedUsers: UserView[] = data.map((user: any) => ({
          user_id: user.user_id,
          first_name: user.user_first_name,
          last_name: user.user_last_name,
          user_email: user.user_email,
          user_phone: user.user_phone || "",
        }));

        setContacts(transformedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveModal(null);
      }
    };

    if (activeModal) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeModal]);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/jobs/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch job details");
        }
        const data = await response.json();

        const transformedTasks = data.job.tasks.map(
          (task: any): TaskView => ({
            task_id: task.task_id,
            phase_id: task.phase_id,
            task_title: task.task_title,
            task_startdate: new Date(task.task_startdate)
              .toISOString()
              .split("T")[0],
            task_duration: task.task_duration,
            task_status: task.task_status,
            task_description: task.task_description,
            users: task.users.map((user: any) => ({
              user_id: user.user_id,
              first_name: user.user_first_name,
              last_name: user.user_last_name,
              user_email: user.user_email,
              user_phone: user.user_phone || "",
            })),
          })
        );

        const transformedMaterials = data.job.materials.map(
          (material: any): MaterialView => ({
            material_id: material.material_id,
            phase_id: material.phase_id,
            material_title: material.material_title,
            material_duedate: new Date(material.material_duedate)
              .toISOString()
              .split("T")[0],
            material_status: material.material_status,
            material_description: material.material_description,
            users: material.users.map((user: any) => ({
              user_id: user.user_id,
              first_name: user.user_first_name,
              last_name: user.user_last_name,
              user_email: user.user_email,
              user_phone: user.user_phone || "",
            })),
          })
        );

        const transformedFloorplans =
          data.job.floorplans?.map(
            (floorplan: any): FloorPlan => ({
              url: floorplan.floorplan_url,
              name: `Floor Plan ${floorplan.floorplan_id}`,
            })
          ) || [];

        const transformedJob: JobDetailView = {
          id: data.job.job_id,
          jobName: data.job.job_title,
          job_startdate: data.job.job_startdate,
          dateRange: data.job.date_range,
          tasks: transformedTasks,
          materials: transformedMaterials,
          floorplans: transformedFloorplans,
          phases: data.job.phases.map(
            (phase: any): PhaseView => ({
              id: phase.id,
              name: phase.name,
              startDate: phase.startDate,
              endDate: phase.endDate,
              color: phase.color,
              description: phase.description,
              tasks: transformedTasks.filter(
                (task: TaskView) => task.phase_id === phase.id
              ),
              materials: transformedMaterials.filter(
                (material: MaterialView) => material.phase_id === phase.id
              ),
              notes: phase.notes || [],
            })
          ),
          overdue: data.job.overdue,
          nextSevenDays: data.job.nextSevenDays,
          sevenDaysPlus: data.job.sevenDaysPlus,
          contacts: data.job.contacts || [],
          status: data.job.job_status,
          location: data.job.job_location || null,
          description: data.job.job_description || null,
          client: data.job.client || null,
        };

        setJob(transformedJob);
        setCollapsedPhases(
          new Set(transformedJob.phases.map((phase) => phase.id))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [id]);

  const getFilteredPhases = () => {
    if (!job) return [];

    if (activeTab !== "My Items" || !session?.user?.id) {
      if (activeTab === "Tasks") {
        return job.phases.filter((phase) => phase.tasks.length > 0);
      }
      if (activeTab === "Materials") {
        return job.phases.filter((phase) => phase.materials.length > 0);
      }
      return job.phases;
    }

    const filteredPhases = job.phases.map((phase) => {
      const filteredTasks = phase.tasks.filter((task) =>
        task.users.some((user) => user.user_id === parseInt(session.user.id))
      );
      const filteredMaterials = phase.materials.filter((material) =>
        material.users.some(
          (user) => user.user_id === parseInt(session.user.id)
        )
      );

      return {
        ...phase,
        tasks: filteredTasks,
        materials: filteredMaterials,
        notes: [...phase.notes],
      };
    });

    return filteredPhases.filter(
      (phase) => phase.tasks.length > 0 || phase.materials.length > 0
    );
  };

  if (loading) return <JobDetailSkeleton />;
  if (error) return <div>Error: {error}</div>;
  if (!job) return <div>Job not found</div>;

  const tabs: Tab[] = [
    { name: "Overview" },
    { name: "My Items" },
    { name: "Tasks" },
    { name: "Materials" },
    { name: "Floor Plan" },
    { name: "Contacts" },
    { name: "Details" },
  ];

  const handleSaveJobChanges = async () => {
    if (!job) return;

    const changes: JobUpdatePayload = {};
    let hasChanges = false;

    if (editJobTitle !== job.jobName) {
      changes.job_title = editJobTitle;
      hasChanges = true;
    }

    const originalStartDate = new Date(job.phases[0].startDate)
      .toISOString()
      .split("T")[0];
    if (editStartDate !== originalStartDate) {
      changes.job_startdate = editStartDate;
      hasChanges = true;
    }

    if (hasChanges) {
      try {
        const response = await fetch(`/api/jobs/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(changes),
        });

        if (!response.ok) {
          throw new Error("Failed to update job");
        }

        setActiveModal(null);
        window.location.reload();
      } catch (error) {
        console.error("Error updating job:", error);
      }
    } else {
      setActiveModal(null);
    }
  };

  const togglePhase = (phaseId: number) => {
    const newCollapsed = new Set(collapsedPhases);
    if (newCollapsed.has(phaseId)) {
      newCollapsed.delete(phaseId);
    } else {
      newCollapsed.add(phaseId);
    }
    setCollapsedPhases(newCollapsed);
  };

  const renderPhaseCards = () => {
    const phasesToRender = getFilteredPhases();

    return (
      <>
        {phasesToRender.map((phase: PhaseView, index: number) => {
          const filteredTasks = phase.tasks;
          const filteredMaterials = phase.materials;
          const hasFilteredTasks = filteredTasks.length > 0;
          const hasFilteredMaterials = filteredMaterials.length > 0;

          return (
            <PhaseCard
              key={phase.id}
              phase={{
                phase_id: phase.id,
                name: phase.name,
                startDate: phase.startDate,
                endDate: phase.endDate,
                description: phase.description,
                tasks: filteredTasks,
                materials: filteredMaterials,
                notes: phase.notes,
              }}
              phaseNumber={index + 1}
              showTasks={
                activeTab === "Tasks" ||
                activeTab === "Overview" ||
                (activeTab === "My Items" && hasFilteredTasks)
              }
              showMaterials={
                activeTab === "Materials" ||
                activeTab === "Overview" ||
                (activeTab === "My Items" && hasFilteredMaterials)
              }
              contacts={contacts}
              isCollapsed={collapsedPhases.has(phase.id)}
              onToggleCollapse={() => togglePhase(phase.id)}
              onStatusUpdate={handleStatusUpdate}
              onTaskDelete={handleTaskDelete}
              onMaterialDelete={handleMaterialDelete}
              onTaskCreate={handleTaskCreate}
              onMaterialCreate={handleMaterialCreate}
              onNoteDelete={handleNoteDelete}
              jobStartDate={job.job_startdate}
              onPhaseUpdate={handlePhaseUpdate}
              userType={session?.user?.type}
            />
          );
        })}
      </>
    );
  };

  const renderFloorPlan = () => {
    if (!job.floorplans.length) {
      return (
        <CardFrame>
          <div className="text-center py-8">
            <div className="mb-4">No floor plans available for this job.</div>
            <div className="flex justify-center">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
                onClick={() => setShowUploadModal(true)}
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
        </CardFrame>
      );
    }

    const floorplansWithId = job.floorplans.map((floorplan, index) => {
      const urlParts = floorplan.url.split("/");
      const fileNamePart = urlParts[urlParts.length - 1];
      const matches = fileNamePart.match(/job-\d+-(\d+)/);
      const id = matches ? parseInt(matches[1]) : index;

      return {
        id,
        url: floorplan.url,
        name: floorplan.name,
      };
    });

    return (
      <div className="w-full -mx-4 sm:mx-0">
        <div className="sm:rounded-lg overflow-hidden">
          <FloorplanViewer
            floorplans={floorplansWithId}
            mode="embedded"
            onRemoveCurrent={handleRemoveCurrent}
            onRemoveAll={handleRemoveAll}
            onUpload={() => setShowUploadModal(true)}
            hasAdminAccess={hasAdminAccess}
          />
        </div>
      </div>
    );
  };

  const renderContacts = () => {
    const allUsers = new Map<number, UserView>();

    job.phases.forEach((phase) => {
      phase.tasks.forEach((task) => {
        task.users.forEach((user) => {
          allUsers.set(user.user_id, user);
        });
      });

      phase.materials.forEach((material) => {
        material.users.forEach((user) => {
          allUsers.set(user.user_id, user);
        });
      });
    });

    const uniqueUsers = Array.from(allUsers.values());
    const filteredUsers = uniqueUsers.filter(
      (user) =>
        `${user.first_name} ${user.last_name}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        user.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.user_phone.includes(searchQuery)
    );

    return (
      <>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-2">
          {filteredUsers.map((user) => (
            <ContactCard
              key={user.user_id}
              user_id={user.user_id}
              user_first_name={user.first_name}
              user_last_name={user.last_name}
              user_email={user.user_email}
              user_phone={user.user_phone}
            />
          ))}
        </div>
      </>
    );
  };

  return (
    <>
      <header className="mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-baseline gap-2 sm:gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold">{job.jobName}</h1>
            <span className="text-base sm:text-lg text-zinc-600 dark:text-white/70">
              {job.dateRange}
            </span>
          </div>
          {hasAdminAccess && (
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => setActiveModal("edit")}
                className="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded font-bold hover:bg-gray-600 transition-colors text-sm sm:text-base"
              >
                Edit
              </button>
              <button
                onClick={() => setShowCopyModal(true)}
                className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded font-bold hover:bg-blue-600 transition-colors text-sm sm:text-base"
              >
                Copy Job
              </button>
              {job.status === "closed" ? (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded font-bold hover:bg-red-600 transition-colors text-sm sm:text-base"
                >
                  Delete Job
                </button>
              ) : (
                <button
                  onClick={() => setShowCloseModal(true)}
                  className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded font-bold hover:bg-red-600 transition-colors text-sm sm:text-base"
                >
                  Close Job
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <section className="mb-4 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">
          Job Status
        </h2>
        <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-4 sm:p-6 mx-auto sm:mx-0 w-full sm:w-auto">
          <div className="w-full">
            <StatusBar
              label="Items Due"
              items={[]}
              isDueBar={true}
              dueItems={{
                overdue: job.overdue,
                nextSevenDays: job.nextSevenDays,
                sevenDaysPlus: job.sevenDaysPlus,
              }}
            />
            <StatusBar label="Tasks" items={job.tasks} withLegend={true} />
            <StatusBar label="Materials" items={job.materials} />
          </div>
        </div>
      </section>

      <section className="mb-4 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">
          Timeline
        </h2>
        <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-4 sm:p-6 mx-auto sm:mx-0 w-full sm:w-auto">
          <div className="w-full">
            <Timeline
              phases={job.phases}
              startDate={job.phases[0]?.startDate}
              endDate={job.phases[job.phases.length - 1]?.endDate}
              onStatusUpdate={handleStatusUpdate}
            />
          </div>
        </div>
      </section>

      <section className="mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <ContentTabs
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
        {activeTab === "Details" ? (
          <div className="mt-2 sm:mt-4 mx-auto sm:mx-0 w-full sm:w-auto space-y-3">
            {!job.client && !job.location && !job.description ? (
              <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-4 sm:p-6 text-center text-gray-500">
                No details available for this job.
              </div>
            ) : (
              <>
                {job.client && (
                  <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-4 sm:p-6">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Client Information
                    </h3>
                    <UserInfoRow
                      firstName={job.client.first_name}
                      lastName={job.client.last_name}
                      phone={job.client.phone || ""}
                      email={job.client.email}
                      size="lg"
                    />
                  </div>
                )}
                {job.location && (
                  <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-4 sm:p-6">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Location
                    </h3>
                    <p className="text-gray-900 dark:text-gray-100">
                      {job.location}
                    </p>
                  </div>
                )}
                {job.description && (
                  <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-4 sm:p-6">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {job.description}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="mt-2 sm:mt-4 mx-auto sm:mx-0 w-full sm:w-auto bg-white dark:bg-zinc-800 shadow-md rounded-lg p-1 sm:p-6">
            {activeTab === "Contacts"
              ? renderContacts()
              : activeTab === "Floor Plan"
              ? renderFloorPlan()
              : renderPhaseCards()}
          </div>
        )}
      </section>

      {activeModal === "floorplan" && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveModal(null);
            }
          }}
        >
          <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-4xl w-[95%] sm:w-full max-h-[90vh] overflow-hidden relative">
            <div className="p-3 sm:p-4 flex justify-between items-center border-b">
              <h3 className="text-base sm:text-lg font-semibold">Floor Plan</h3>
              <div className="flex gap-2">
                <button className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm sm:text-base">
                  Download
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="relative h-[50vh] sm:h-[80vh] w-full">
              <Image
                src="/placeholder-floorplan.jpg"
                alt="Floor Plan"
                fill
                className="object-contain p-2 sm:p-4"
              />
            </div>
          </div>
        </div>
      )}

      {activeModal === "edit" && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveModal(null);
            }
          }}
        >
          <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-2xl w-[95%] sm:w-full overflow-hidden relative">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold">Edit Job</h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
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

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:border-zinc-600"
                    value={editJobTitle}
                    onChange={(e) => setEditJobTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:border-zinc-600"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-6 sm:mt-8 flex justify-end gap-3 sm:gap-4">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveJobChanges}
                  className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CopyJobModal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        jobName={job.jobName}
        onCopyJob={(newStartDate, copyOptions) =>
          handleJobCopy(newStartDate, copyOptions)
        }
      />
      <CloseJobModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onCloseJob={handleJobClose}
      />
      <DeleteJobModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDeleteJob={handleJobDelete}
      />
      {/* Single Remove Confirmation Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Confirm Removal</h3>
            <p className="mb-6">
              Are you sure you want to remove this floorplan?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRemoveModal(false)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveCurrent}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove All Confirmation Modal */}
      {showRemoveAllModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Confirm Removal</h3>
            <p className="mb-6">
              Are you sure you want to remove all floorplans? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRemoveAllModal(false)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveAll}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Remove All
              </button>
            </div>
          </div>
        </div>
      )}
      {showUploadModal && (
        <FloorplanUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </>
  );
}
