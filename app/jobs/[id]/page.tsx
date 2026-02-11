// page.tsx

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
  compareDateStrings,
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
import { useJobDetail } from "@/app/hooks/use-jobs";
import { useNonClients } from "@/app/hooks/use-users";
import {
  useCloseJob,
  useDeleteJob,
  useUploadFloorplan,
  useDeleteFloorplan,
  useUpdateJob,
  useUpdatePhase,
  useUpdateItemStatus,
  useCreateTask,
  useDeleteTask,
  useCreateMaterial,
  useDeleteMaterial,
  useCreateNote,
  useDeleteNote,
  useUpdateTask,
  useUpdateMaterial,
} from "@/app/hooks/use-job-mutations";

export default function JobDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showRemoveAllModal, setShowRemoveAllModal] = useState(false);
  const [selectedFloorplanId, setSelectedFloorplanId] = useState<number | null>(
    null,
  );
  const [activeModal, setActiveModal] = useState<"edit" | "floorplan" | null>(
    null,
  );
  const [collapsedPhases, setCollapsedPhases] = useState<Set<number>>(
    new Set(),
  );
  const hasAdminAccess =
    session?.user?.type === "Owner" || session?.user?.type === "Admin";

  // Queries
  const { data: job, isLoading: loading, error: queryError } = useJobDetail(id);
  const { data: contacts = [] } = useNonClients();

  // Mutations
  const closeJob = useCloseJob(id);
  const deleteJob = useDeleteJob(id);
  const uploadFloorplan = useUploadFloorplan(id);
  const deleteFloorplan = useDeleteFloorplan(id);
  const updateJob = useUpdateJob(id);
  const updatePhase = useUpdatePhase(id);
  const updateItemStatus = useUpdateItemStatus(id);
  const createTask = useCreateTask(id);
  const deleteTask = useDeleteTask(id);
  const createMaterial = useCreateMaterial(id);
  const deleteMaterial = useDeleteMaterial(id);
  const createNote = useCreateNote(id);
  const deleteNote = useDeleteNote(id);
  const updateTask = useUpdateTask(id);
  const updateMaterial = useUpdateMaterial(id);

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : "An error occurred"
    : null;

  // Set collapsed phases when job loads
  useEffect(() => {
    if (job) {
      setCollapsedPhases((prev) => {
        if (prev.size === 0) {
          return new Set(job.phases.map((phase) => phase.id));
        }
        return prev;
      });
    }
  }, [job]);

  const handleJobClose = async () => {
    closeJob.mutate(undefined, {
      onSuccess: () => router.push("/jobs"),
      onError: (error) => console.error("Error closing job:", error),
    });
  };

  const handleJobDelete = async () => {
    deleteJob.mutate(undefined, {
      onSuccess: () => router.push("/jobs"),
      onError: (error) => console.error("Error deleting job:", error),
    });
  };

  const FloorplanUploadModal = ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) => {
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleUpload = async () => {
      if (!selectedFiles) return;

      setUploadError(null);
      const formData = new FormData();

      try {
        const filesArray = Array.from(selectedFiles);
        validateFiles(filesArray);

        filesArray.forEach((file) => {
          formData.append("files", file);
        });

        uploadFloorplan.mutate(formData, {
          onSuccess: () => onClose(),
          onError: (error) =>
            setUploadError(
              error instanceof Error ? error.message : "Upload failed",
            ),
        });
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : "Upload failed",
        );
        console.error("Error uploading floorplans:", error);
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
                setUploadError(null);
              }}
              className="w-full p-2 border border-gray-300 rounded"
            />
            <p className="mt-2 text-sm text-gray-500">
              Accepted formats: JPEG, PNG, GIF, PDF (max 5MB per file)
            </p>
            {uploadError && (
              <p className="mt-2 text-sm text-red-500">{uploadError}</p>
            )}
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
              disabled={!selectedFiles || uploadFloorplan.isPending}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-blue-300"
            >
              {uploadFloorplan.isPending ? "Uploading..." : "Upload"}
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
    if (!selectedFloorplanId) {
      console.error("No floorplan ID selected");
      return;
    }

    deleteFloorplan.mutate(selectedFloorplanId, {
      onSuccess: () => setShowRemoveModal(false),
      onError: (error) => console.error("Error removing floorplan:", error),
    });
  };

  const confirmRemoveAll = async () => {
    deleteFloorplan.mutate(undefined, {
      onSuccess: () => setShowRemoveAllModal(false),
      onError: (error) =>
        console.error("Error removing all floorplans:", error),
    });
  };

  const handleJobCopy = (
    newStartDate: string,
    copyOptions: {
      workerAssignments: boolean;
      notes: boolean;
      floorplans: boolean;
    },
  ) => {
    if (!job) return;

    const jobDataForCopy = {
      originalJobId: job.id,
      jobDetails: {
        originalStartDate: job.phases[1].startDate.split("T")[0],
      },
      originalJobName: job.jobName,
      phases: job.phases,
      newStartDate: newStartDate,
      copyOptions: copyOptions,
      floorplans: copyOptions.floorplans ? job.floorplans : [],
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
    },
  ) => {
    try {
      updatePhase.mutate(
        {
          phaseId,
          updates: {
            title: updates.title,
            startDate: updates.startDate,
            extend: updates.extend,
            extendFuturePhases: updates.extendFuturePhases,
            daysDiff: updates.daysDiff,
          },
        },
        {
          onError: (error) => {
            console.error("Error updating phase:", error);
          },
        },
      );
    } catch (error) {
      console.error("Error updating phase:", error);
      throw error;
    }
  };

  const handleTaskDelete = async (taskId: number) => {
    try {
      deleteTask.mutate(
        { taskId },
        {
          onError: (error) => {
            console.error("Error deleting task:", error);
          },
        },
      );
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  };

  const handleMaterialDelete = async (materialId: number) => {
    try {
      deleteMaterial.mutate(materialId, {
        onError: (error) => {
          console.error("Error deleting material:", error);
        },
      });
    } catch (error) {
      console.error("Error deleting material:", error);
      throw error;
    }
  };

  const handleStatusUpdate = async (
    itemId: number,
    type: "task" | "material",
    newStatus: string,
  ) => {
    updateItemStatus.mutate(
      { id: itemId, type, newStatus },
      {
        onError: (error) => {
          console.error("Error updating status:", error);
        },
      },
    );
  };

  const handleNoteDelete = async (phaseId: number, noteTimestamp: string) => {
    try {
      deleteNote.mutate(
        { phaseId, created_at: noteTimestamp },
        {
          onError: (error) => {
            console.error("Error deleting note:", error);
          },
        },
      );
    } catch (error) {
      console.error("Error deleting note:", error);
      throw error;
    }
  };

  const handleTaskCreate = async (phaseId: number, newTask: FormTask) => {
    return new Promise<any>((resolve, reject) => {
      createTask.mutate(
        { phaseId, task: newTask },
        {
          onSuccess: (data) => resolve(data),
          onError: (error) => {
            console.error("Error creating task:", error);
            reject(error);
          },
        },
      );
    });
  };

  const handleMaterialCreate = async (
    phaseId: number,
    newMaterial: FormMaterial,
  ) => {
    return new Promise<any>((resolve, reject) => {
      createMaterial.mutate(
        { phaseId, material: newMaterial },
        {
          onSuccess: (data) => resolve(data),
          onError: (error) => {
            console.error("Error creating material:", error);
            reject(error);
          },
        },
      );
    });
  };

  useEffect(() => {
    if (activeModal === "edit" && job) {
      setEditJobTitle(job.jobName);
      setEditStartDate(job.job_startdate.split("T")[0]);
    }
  }, [activeModal, job]);

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
        task.users.some((user) => user.user_id === parseInt(session.user.id)),
      );
      const filteredMaterials = phase.materials.filter((material) =>
        material.users.some(
          (user) => user.user_id === parseInt(session.user.id),
        ),
      );

      return {
        ...phase,
        tasks: filteredTasks,
        materials: filteredMaterials,
        notes: [...phase.notes],
      };
    });

    return filteredPhases.filter(
      (phase) => phase.tasks.length > 0 || phase.materials.length > 0,
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

    const originalStartDate = job.phases[0].startDate.split("T")[0];
    if (editStartDate !== originalStartDate) {
      changes.job_startdate = editStartDate;
      hasChanges = true;
    }

    if (hasChanges) {
      updateJob.mutate(changes, {
        onSuccess: () => setActiveModal(null),
        onError: (error) => console.error("Error updating job:", error),
      });
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
              onTaskEdit={async (taskId, updates) => {
                await updateTask.mutateAsync({ taskId, updates });
              }}
              onMaterialEdit={async (materialId, updates) => {
                await updateMaterial.mutateAsync({ materialId, updates });
              }}
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
      const fpId = matches ? parseInt(matches[1]) : index;

      return {
        id: fpId,
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
        user.user_phone.includes(searchQuery),
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
