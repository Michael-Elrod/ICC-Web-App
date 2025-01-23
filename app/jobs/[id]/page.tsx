"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Timeline from "@/components/util/Timeline";
import ContentTabs from "@/components/tabs/ContentTabs";
import CardFrame from "@/components/util/CardFrame";
import PhaseCard from "@/components/job/PhaseCard";
import ContactCard from "@/components/contact/ContactCard";
import StatusBar from "@/components/util/StatusBar";
import CopyJobModal from "@/components/job/CopyJobModal";
import TerminateJobModal from "@/components/job/TerminateJobModal";
import FloorplanViewer from "@/components/job/FloorplanViewer";
import Image from "next/image";
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
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [activeModal, setActiveModal] = useState<"edit" | "floorplan" | null>(
    null
  );
  const [contacts, setContacts] = useState<UserView[]>([]);
  const [collapsedPhases, setCollapsedPhases] = useState<Set<number>>(
    new Set()
  );
  const hasAdminAccess =
    session?.user?.type === "Owner" || session?.user?.type === "Admin";

  const handleJobTerminate = async () => {
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

  const handleJobCopy = (newStartDate: Date) => {
    if (!job) return;

    const jobDataForCopy = {
      originalJobId: job.id,
      jobDetails: {
        originalStartDate: job.phases[1].startDate.split("T")[0],
      },
      originalJobName: job.jobName,
      phases: job.phases,
      newStartDate: newStartDate.toISOString().split("T")[0],
    };

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

      // Add page reload after successful update
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

  // Helper function to calculate status counts
  const calculateStatusCounts = (phases: PhaseView[]) => {
    let overdue = 0;
    let nextSevenDays = 0;
    let sevenDaysPlus = 0;
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    phases.forEach((phase) => {
      // Count tasks
      phase.tasks.forEach((task) => {
        if (task.task_status != "Complete") {
          const dueDate = new Date(task.task_startdate);
          dueDate.setDate(dueDate.getDate() + task.task_duration);

          if (dueDate < today) overdue++;
          else if (dueDate <= sevenDaysFromNow) nextSevenDays++;
          else sevenDaysPlus++;
        }
      });

      // Count materials
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

        // First transform tasks and materials with proper typing
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

        // Transform floor plans
        const transformedFloorplans = data.job.floorplans?.map(
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
          currentWeek: data.job.current_week,
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
      // When on Tasks tab, only return phases with tasks
      if (activeTab === "Tasks") {
        return job.phases.filter((phase) => phase.tasks.length > 0);
      }
      // When on Materials tab, only return phases with materials
      if (activeTab === "Materials") {
        return job.phases.filter((phase) => phase.materials.length > 0);
      }
      // For Overview tab or other tabs, return all phases
      return job.phases;
    }

    // For My Items tab - create a deep copy of phases with only filtered items
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

    // Return only phases that have either tasks or materials after filtering
    return filteredPhases.filter(
      (phase) => phase.tasks.length > 0 || phase.materials.length > 0
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!job) return <div>Job not found</div>;

  const tabs: Tab[] = [
    { name: "Overview" },
    { name: "My Items" },
    { name: "Tasks" },
    { name: "Materials" },
    { name: "Floor Plan" },
    { name: "Contacts" },
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
            No floor plans available for this job.
          </div>
        </CardFrame>
      );
    }
    return (
      <CardFrame>
        <FloorplanViewer floorplans={job.floorplans} mode="embedded" />
      </CardFrame>
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
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">{job.jobName}</h1>
            <span className="text-lg text-gray-600">{job.dateRange}</span>
          </div>
          {hasAdminAccess && (
            <div className="flex gap-3">
              <button
                onClick={() => setActiveModal("edit")}
                className="px-4 py-2 bg-gray-500 text-white rounded font-bold hover:bg-gray-600 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => setShowCopyModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded font-bold hover:bg-blue-600 transition-colors"
              >
                Copy Job
              </button>
              <button
                onClick={() => setShowTerminateModal(true)}
                className="px-4 py-2 bg-red-500 text-white rounded font-bold hover:bg-red-600 transition-colors"
              >
                Terminate Job
              </button>
            </div>
          )}
        </div>
      </header>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Job Status</h2>
        <CardFrame>
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
        </CardFrame>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Timeline</h2>
        <CardFrame>
          <Timeline
            phases={job.phases}
            currentWeek={job.currentWeek}
            startDate={job.phases[0]?.startDate}
            endDate={job.phases[job.phases.length - 1]?.endDate}
            onStatusUpdate={handleStatusUpdate}
          />
        </CardFrame>
      </section>

      <section className="mb-8">
        <ContentTabs
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <div className="mt-4">
          {activeTab === "Contacts"
            ? renderContacts()
            : activeTab === "Floor Plan"
            ? renderFloorPlan()
            : renderPhaseCards()}
        </div>
      </section>

      {activeModal === "floorplan" && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveModal(null);
            }
          }}
        >
          <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
            <div className="p-4 flex justify-between items-center border-b">
              <h3 className="text-lg font-semibold">Floor Plan</h3>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                  Download
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="relative h-[80vh] w-full">
              <Image
                src="/placeholder-floorplan.jpg"
                alt="Floor Plan"
                fill
                className="object-contain p-4"
              />
            </div>
          </div>
        </div>
      )}

      {activeModal === "edit" && (
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
                <h3 className="text-xl font-semibold">Edit Job</h3>
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
                    Job Title
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:border-zinc-600"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:border-zinc-600"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                  />
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
                  onClick={handleSaveJobChanges}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
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
        onCopyJob={handleJobCopy}
      />
      <TerminateJobModal
        isOpen={showTerminateModal}
        onClose={() => setShowTerminateModal(false)}
        onTerminate={handleJobTerminate}
      />
    </>
  );
}
