// PhaseCard.tsx

import React, { useState } from "react";
import { useParams } from "next/navigation";
import CardFrame from "./CardFrame";
import Note from "./NoteCard";
import TasksCard from "./TasksCard";
import MaterialsCard from "./MaterialsCard";
import SmallCardFrame from "./SmallCardFrame";
import CollapsibleSection from "./CollapsibleSection";
import NewTaskCard from "./NewTaskCard";
import NewMaterialCard from "./NewMaterialCard";
import EditPhaseModal from "./EditPhaseModal";
import { DetailPhaseCardProps } from "@/app/types/props";
import { createLocalDate } from "@/app/utils";

const PhaseCard: React.FC<DetailPhaseCardProps> = ({
  phase,
  phaseNumber,
  showTasks = true,
  showMaterials = true,
  contacts,
  isCollapsed,
  onToggleCollapse,
  onStatusUpdate,
  onTaskDelete,
  onMaterialDelete,
  onTaskCreate,
  onMaterialCreate,
  onNoteDelete,
  onTaskEdit,
  onMaterialEdit,
  jobStartDate,
  onPhaseUpdate,
  userType,
}) => {
  const params = useParams();
  const jobId = params?.id as string;
  const [notes, setNotes] = useState(phase.notes);
  const [newNote, setNewNote] = useState("");
  const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [activeNoteModal, setActiveNoteModal] = useState<string | null>(null);
  const [editNoteDetails, setEditNoteDetails] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const hasAdminAccess = userType === "Owner" || userType === "Admin";
  const startDate = createLocalDate(phase.startDate).toLocaleDateString(
    "en-US",
    {
      month: "numeric",
      day: "numeric",
      year: "2-digit",
    },
  );
  const endDate = createLocalDate(phase.endDate).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  });

  const handlePhaseModalUpdate = (updates: {
    title: string;
    startDate: string;
    extend: number;
    extendFuturePhases: boolean;
    adjustItems?: boolean;
    daysDiff?: number;
  }) => {
    onPhaseUpdate(phase.phase_id, updates);
  };

  const handleEditNote = async (noteTimestamp: string, newDetails: string) => {
    try {
      const response = await fetch(
        `/api/jobs/${jobId}/phases/${phase.phase_id}/notes`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            created_at: noteTimestamp,
            note_details: newDetails,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update note");
      }

      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.created_at === noteTimestamp
            ? { ...note, note_details: newDetails }
            : note,
        ),
      );
      setActiveNoteModal(null);
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const handleDeleteNote = async (noteTimestamp: string) => {
    try {
      await onNoteDelete(phase.phase_id, noteTimestamp);
      setNotes(notes.filter((note) => note.created_at !== noteTimestamp));
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const handleAddNote = async () => {
    if (newNote.trim()) {
      try {
        const response = await fetch(`/api/jobs/${jobId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phase_id: phase.phase_id,
            note_details: newNote.trim(),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to add note");
        }

        const data = await response.json();
        setNotes([...notes, data.note]);
        setNewNote("");
      } catch (error) {
        console.error("Failed to add note:", error);
      }
    }
  };

  return (
    <CardFrame
      className={
        isCollapsed
          ? "cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          : ""
      }
      onClick={isCollapsed ? () => onToggleCollapse() : undefined}
    >
      <div
        className={`relative${!isCollapsed ? " mb-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/50 -mx-4 px-4 -mt-5 pt-5 pb-2 sm:-mx-6 sm:px-6 sm:-mt-6 sm:pt-6 transition-colors" : ""}`}
        onClick={
          !isCollapsed
            ? (e) => {
                if (!(e.target as HTMLElement).closest("button")) {
                  onToggleCollapse();
                }
              }
            : undefined
        }
      >
        {/* Mobile Layout */}
        <div className="flex flex-col sm:hidden">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold">
                Phase {phaseNumber} - {phase.name}
              </h3>
              <span className="text-sm text-gray-600 mt-1">
                {startDate} - {endDate}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {hasAdminAccess && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditModalOpen(true);
                  }}
                  className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:grid sm:grid-cols-3 sm:items-center">
          <h3 className="text-lg font-semibold min-w-0 truncate pr-4">
            Phase {phaseNumber} - {phase.name}
          </h3>

          <span className="text-md text-center">
            {startDate} - {endDate}
          </span>

          <div className="flex items-center gap-4 justify-end">
            {hasAdminAccess && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditModalOpen(true);
                }}
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {phase.description && (
            <div className="mb-4">
              <span className="text-sm font-medium break-words">
                {phase.description}
              </span>
            </div>
          )}

          <div className="space-y-4">
            {showTasks && (
              <TasksCard
                tasks={phase.tasks.map((task) => ({
                  ...task,
                  phase_id: phase.phase_id,
                }))}
                contacts={contacts}
                onStatusUpdate={onStatusUpdate}
                onDelete={onTaskDelete}
                onEdit={onTaskEdit}
                userType={userType}
                renderAddingForm={
                  isAddingTask
                    ? () => (
                        <NewTaskCard
                          phase={{
                            tempId: phase.phase_id.toString(),
                            title: phase.name,
                            description: "",
                            startDate: phase.startDate,
                            tasks: phase.tasks.map((task) => ({
                              id: task.task_id.toString(),
                              title: task.task_title,
                              startDate: task.task_startdate,
                              duration: task.task_duration.toString(),
                              offset: 0,
                              details: task.task_description,
                              selectedContacts: task.users.map((user) => ({
                                id: user.user_id.toString(),
                              })),
                              isExpanded: false,
                            })),
                            materials: phase.materials.map((material) => ({
                              id: material.material_id.toString(),
                              title: material.material_title,
                              dueDate: material.material_duedate,
                              offset: 0,
                              details: material.material_description,
                              selectedContacts: material.users.map((user) => ({
                                id: user.user_id.toString(),
                              })),
                              isExpanded: false,
                            })),
                            notes: [],
                          }}
                          task={{
                            id: `new-task-${Date.now()}`,
                            title: "",
                            startDate: "",
                            duration: "1",
                            details: "",
                            selectedContacts: [],
                            isExpanded: true,
                            offset: 0,
                          }}
                          phaseStartDate={phase.startDate}
                          contacts={contacts}
                          onUpdate={async (updatedTask) => {
                            try {
                              await onTaskCreate(phase.phase_id, updatedTask);
                              setIsAddingTask(false);
                            } catch (error) {
                              console.error("Error creating task:", error);
                            }
                          }}
                          onDelete={() => setIsAddingTask(false)}
                          onPhaseUpdate={() => {}}
                        />
                      )
                    : undefined
                }
                renderAddButton={
                  hasAdminAccess
                    ? () => (
                        <div className="flex justify-center mt-4">
                          <button
                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
                            onClick={() => setIsAddingTask(true)}
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
                      )
                    : undefined
                }
              />
            )}

            {showMaterials && (
              <MaterialsCard
                materials={phase.materials.map((material) => ({
                  ...material,
                  phase_id: phase.phase_id,
                }))}
                contacts={contacts}
                onStatusUpdate={onStatusUpdate}
                onDelete={onMaterialDelete}
                onEdit={onMaterialEdit}
                userType={userType}
                renderAddingForm={
                  isAddingMaterial
                    ? () => (
                        <NewMaterialCard
                          phase={{
                            tempId: phase.phase_id.toString(),
                            title: phase.name,
                            description: "",
                            startDate: phase.startDate,
                            tasks: phase.tasks.map((task) => ({
                              id: task.task_id.toString(),
                              title: task.task_title,
                              startDate: task.task_startdate,
                              duration: task.task_duration.toString(),
                              offset: 0,
                              details: task.task_description,
                              selectedContacts: task.users.map((user) => ({
                                id: user.user_id.toString(),
                              })),
                              isExpanded: false,
                            })),
                            materials: phase.materials.map((material) => ({
                              id: material.material_id.toString(),
                              title: material.material_title,
                              dueDate: material.material_duedate,
                              offset: 0,
                              details: material.material_description,
                              selectedContacts: material.users.map((user) => ({
                                id: user.user_id.toString(),
                              })),
                              isExpanded: false,
                            })),
                            notes: [],
                          }}
                          material={{
                            id: `new-material-${Date.now()}`,
                            title: "",
                            dueDate: "",
                            details: "",
                            selectedContacts: [],
                            isExpanded: true,
                            offset: 0,
                          }}
                          phaseStartDate={phase.startDate}
                          contacts={contacts}
                          onUpdate={async (updatedMaterial) => {
                            try {
                              await onMaterialCreate(
                                phase.phase_id,
                                updatedMaterial,
                              );
                              setIsAddingMaterial(false);
                            } catch (error) {
                              console.error("Error creating material:", error);
                            }
                          }}
                          onDelete={() => setIsAddingMaterial(false)}
                          onPhaseUpdate={() => {}}
                        />
                      )
                    : undefined
                }
                renderAddButton={
                  hasAdminAccess
                    ? () => (
                        <div className="flex justify-center mt-4">
                          <button
                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
                            onClick={() => setIsAddingMaterial(true)}
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
                      )
                    : undefined
                }
              />
            )}

            <CollapsibleSection title="Notes" itemCount={notes.length}>
              <div className="space-y-2 mb-4">
                {notes.map((note, index) => (
                  <SmallCardFrame key={note.created_at}>
                    <Note
                      {...note}
                      onClick={() =>
                        setExpandedNoteId(
                          expandedNoteId === index ? null : index,
                        )
                      }
                      isExpanded={expandedNoteId === index}
                    />
                    {expandedNoteId === index && hasAdminAccess && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveNoteModal(note.created_at);
                            setEditNoteDetails(note.note_details);
                          }}
                          className="px-4 py-2 bg-gray-500 text-white rounded font-bold hover:bg-gray-600 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </SmallCardFrame>
                ))}
              </div>

              {/* Only render the Add New Note section for admin users */}
              {hasAdminAccess && (
                <SmallCardFrame>
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Add New Note</h5>
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Type your note here..."
                      className="w-full p-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-600 shadow-sm"
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                        className="px-4 py-2 bg-green-500 text-white font-bold rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Note
                      </button>
                    </div>
                  </div>
                </SmallCardFrame>
              )}
            </CollapsibleSection>
          </div>
        </>
      )}

      {/* Edit Note Modal */}
      {activeNoteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveNoteModal(null);
            }
          }}
        >
          <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-2xl w-full overflow-hidden relative">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Edit Note</h3>
                <button
                  onClick={() => setActiveNoteModal(null)}
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
                    Note Details
                  </label>
                  <textarea
                    value={editNoteDetails}
                    onChange={(e) => setEditNoteDetails(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:border-zinc-600"
                    rows={3}
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-4">
                <button
                  onClick={() => setActiveNoteModal(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await handleDeleteNote(activeNoteModal);
                      setActiveNoteModal(null);
                    } catch (error) {
                      console.error("Error deleting note:", error);
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() =>
                    handleEditNote(activeNoteModal, editNoteDetails)
                  }
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <EditPhaseModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handlePhaseModalUpdate}
        initialTitle={phase.name}
        initialStartDate={phase.startDate}
        jobStartDate={jobStartDate}
      />
    </CardFrame>
  );
};

export default PhaseCard;
