// components/PhaseCard.tsx

import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import CardFrame from "../util/CardFrame";
import TaskCard from "./NewTaskCard";
import MaterialCard from "./NewMaterialCard";
import NoteCard from "./NewNoteCard";
import EditPhaseModal from "../util/EditPhaseModal";
import { PhaseCardProps } from "../../app/types/props";
import { FormTask, FormMaterial, FormNote } from "@/app/types/database";
import { formatDate } from "@/app/utils";
import {
  createLocalDate,
  formatToDateString,
  addBusinessDays,
} from "@/app/utils";
import {
  handleInputChange,
  deleteTask,
  deleteMaterial,
  updateNote,
  deleteNote,
} from "../../handlers/new/phases";

const NewPhaseCard: React.FC<PhaseCardProps> = ({
  phase,
  onDelete,
  jobStartDate,
  onUpdate,
  onAddPhaseAfter,
  onMovePhase,
  contacts,
}) => {
  const [isPhaseCollapsed, setIsPhaseCollapsed] = useState(true);
  const [isTasksExpanded, setIsTasksExpanded] = useState(false);
  const [isMaterialsExpanded, setIsMaterialsExpanded] = useState(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showAddButton, setShowAddButton] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handlePhaseModalUpdate = (updates: {
    title: string;
    startDate: string;
    extend: number;
    extendFuturePhases: boolean;
    adjustItems?: boolean;
    daysDiff?: number;
  }) => {
    let updatedTasks = [...phase.tasks];
    let updatedMaterials = [...phase.materials];

    if (updates.adjustItems && typeof updates.daysDiff === "number") {
      if (updates.extend > 0) {
        // Update current phase
        updatedTasks = phase.tasks.map((task) => ({
          ...task,
          duration: (parseInt(task.duration) + updates.extend).toString(),
        }));

        updatedMaterials = phase.materials.map((material) => {
          const materialDate = createLocalDate(material.dueDate);
          return {
            ...material,
            dueDate: formatToDateString(
              addBusinessDays(materialDate, updates.extend)
            ),
          };
        });

        if (updates.extendFuturePhases) {
          onUpdate(
            {
              ...phase,
              title: updates.title,
              startDate: updates.startDate,
              tasks: updatedTasks,
              materials: updatedMaterials,
            },
            updates.extend,
            true
          );
          return;
        }
      } else {
        updatedTasks = phase.tasks.map((task) => ({
          ...task,
          startDate: formatToDateString(
            addBusinessDays(createLocalDate(task.startDate), updates.daysDiff!)
          ),
        }));

        updatedMaterials = phase.materials.map((material) => ({
          ...material,
          dueDate: formatToDateString(
            addBusinessDays(
              createLocalDate(material.dueDate),
              updates.daysDiff!
            )
          ),
        }));
      }
    }

    onUpdate(
      {
        ...phase,
        title: updates.title,
        startDate: updates.startDate,
        tasks: updatedTasks,
        materials: updatedMaterials,
      },
      updates.extend,
      false
    );
  };

  return (
    <div className="relative group">
      {/* Movement controls */}
      <div className="absolute left-[-40px] top-1/2 transform -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-colors
            ${
              phase.isFirst
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          onClick={() => !phase.isFirst && onMovePhase("up")}
          disabled={phase.isFirst}
          title={phase.isFirst ? "Can't move up" : "Move phase up"}
        >
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
        <button
          className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-colors
            ${
              phase.isLast
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          onClick={() => !phase.isLast && onMovePhase("down")}
          disabled={phase.isLast}
          title={phase.isLast ? "Can't move down" : "Move phase down"}
        >
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      <div className="relative">
        <CardFrame>
          {/* Title and Description Section */}
          <div className="flex justify-between items-center mb-4">
            <div className="grid grid-cols-3 items-center w-full">
              <div className="flex-1 col-span-1 pr-2">
                <h2 className="text-md sm:text-2xl font-bold truncate">
                  {phase.title}
                </h2>
              </div>
              <span className="text-md text-center col-span-1">
                {(() => {
                  return formatDate(phase.startDate);
                })()}
              </span>
              <div className="flex items-center justify-end gap-4 col-span-1">
                <button
                  onClick={() => setIsEditModalOpen(true)}
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
                <button
                  onClick={() => setIsPhaseCollapsed(!isPhaseCollapsed)}
                  className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                  {isPhaseCollapsed ? (
                    <FaChevronUp size={20} />
                  ) : (
                    <FaChevronDown size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {!isPhaseCollapsed && (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-white">
                  Description
                </label>
                <textarea
                  value={phase.description}
                  onChange={(e) =>
                    handleInputChange(
                      "description",
                      e.target.value,
                      phase,
                      onUpdate
                    )
                  }
                  className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded dark:bg-zinc-800 dark:text-white"
                  rows={3}
                />
              </div>

              {/* Tasks Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                    Tasks
                  </h3>
                  <button
                    onClick={() => setIsTasksExpanded(!isTasksExpanded)}
                    className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  >
                    {isTasksExpanded ? (
                      <FaChevronDown size={20} />
                    ) : (
                      <FaChevronUp size={20} />
                    )}
                  </button>
                </div>
                {isTasksExpanded && (
                  <div className="space-y-2">
                    {phase.tasks
                      .sort(
                        (a, b) =>
                          new Date(a.startDate).getTime() -
                          new Date(b.startDate).getTime()
                      )
                      .map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onUpdate={(updatedTask) => {
                            const updatedTasks = phase.tasks
                              .map((t) =>
                                t.id === updatedTask.id ? updatedTask : t
                              )
                              .sort(
                                (a, b) =>
                                  new Date(a.startDate).getTime() -
                                  new Date(b.startDate).getTime()
                              );
                            onUpdate({
                              ...phase,
                              tasks: updatedTasks,
                            });
                          }}
                          onDelete={() =>
                            deleteTask(
                              task.id,
                              phase,
                              onUpdate,
                              setIsAddingTask
                            )
                          }
                          phaseStartDate={phase.startDate}
                          contacts={contacts}
                          phase={phase}
                          onPhaseUpdate={onUpdate}
                        />
                      ))}

                    {/* Add new task button */}
                    <div className="flex justify-center mt-4">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
                        onClick={() => {
                          const newTask: FormTask = {
                            id: `task-${Date.now()}`,
                            title: "",
                            startDate: phase.startDate,
                            duration: "1",
                            details: "",
                            selectedContacts: [],
                            isExpanded: true,
                            offset: 0,
                          };
                          const updatedTasks = [...phase.tasks, newTask].sort(
                            (a, b) =>
                              new Date(a.startDate).getTime() -
                              new Date(b.startDate).getTime()
                          );
                          onUpdate({
                            ...phase,
                            tasks: updatedTasks,
                          });
                          setTimeout(() => {
                            const element = document.getElementById(
                              `task-${newTask.id}`
                            );
                            if (element) {
                              element.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                            }
                          }, 100);
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
                )}
              </div>

              {/* Materials Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                    Materials
                  </h3>
                  <button
                    onClick={() => setIsMaterialsExpanded(!isMaterialsExpanded)}
                    className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  >
                    {isMaterialsExpanded ? (
                      <FaChevronDown size={20} />
                    ) : (
                      <FaChevronUp size={20} />
                    )}
                  </button>
                </div>
                {isMaterialsExpanded && (
                  <div className="space-y-2">
                    {phase.materials
                      .sort(
                        (a, b) =>
                          new Date(a.dueDate).getTime() -
                          new Date(b.dueDate).getTime()
                      )
                      .map((material) => (
                        <MaterialCard
                          key={material.id}
                          material={material}
                          onUpdate={(updatedMaterial) => {
                            const updatedMaterials = phase.materials
                              .map((m) =>
                                m.id === updatedMaterial.id
                                  ? updatedMaterial
                                  : m
                              )
                              .sort(
                                (a, b) =>
                                  new Date(a.dueDate).getTime() -
                                  new Date(b.dueDate).getTime()
                              );
                            onUpdate({
                              ...phase,
                              materials: updatedMaterials,
                            });
                          }}
                          onDelete={() =>
                            deleteMaterial(
                              material.id,
                              phase,
                              onUpdate,
                              setIsAddingMaterial
                            )
                          }
                          phaseStartDate={phase.startDate}
                          contacts={contacts}
                          phase={phase}
                          onPhaseUpdate={onUpdate}
                        />
                      ))}

                    {/* Add new material button */}
                    <div className="flex justify-center mt-4">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
                        onClick={() => {
                          const newMaterial: FormMaterial = {
                            id: `material-${Date.now()}`,
                            title: "",
                            dueDate: phase.startDate,
                            offset: 0,
                            details: "",
                            selectedContacts: [],
                            isExpanded: true,
                          };
                          const updatedMaterials = [
                            ...phase.materials,
                            newMaterial,
                          ].sort(
                            (a, b) =>
                              new Date(a.dueDate).getTime() -
                              new Date(b.dueDate).getTime()
                          );
                          onUpdate({
                            ...phase,
                            materials: updatedMaterials,
                          });
                          setTimeout(() => {
                            const element = document.getElementById(
                              `material-${newMaterial.id}`
                            );
                            if (element) {
                              element.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                            }
                          }, 100);
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
                )}
              </div>

              {/* Notes Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                    Notes
                  </h3>
                  <button
                    onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                    className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  >
                    {isNotesExpanded ? (
                      <FaChevronDown size={20} />
                    ) : (
                      <FaChevronUp size={20} />
                    )}
                  </button>
                </div>
                {isNotesExpanded && (
                  <div className="space-y-2">
                    {phase.notes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onUpdate={(updatedNote) =>
                          updateNote(updatedNote, phase, onUpdate)
                        }
                        onDelete={() =>
                          deleteNote(note.id, phase, onUpdate, setIsAddingNote)
                        }
                      />
                    ))}

                    {/* Add new note button */}
                    <div className="flex justify-center mt-4">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
                        onClick={() => {
                          const newNote: FormNote = {
                            id: `note-${Date.now()}`,
                            content: "",
                            isExpanded: true,
                          };
                          const updatedNotes = [...phase.notes, newNote];
                          onUpdate({
                            ...phase,
                            notes: updatedNotes,
                          });
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
                )}
              </div>
            </>
          )}
        </CardFrame>

        {/* Add a Phase Button */}
        <div
          className={`absolute left-0 right-0 -bottom-4 h-8 flex justify-center items-center transition-opacity duration-200 ${
            showAddButton ? "opacity-100" : "opacity-0"
          }`}
          onMouseEnter={() => setShowAddButton(true)}
          onMouseLeave={() => setShowAddButton(false)}
        >
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
            onClick={() => onAddPhaseAfter?.(phase.tempId)}
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

      <EditPhaseModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialTitle={phase.title}
        initialStartDate={phase.startDate}
        jobStartDate={jobStartDate}
        onUpdate={handlePhaseModalUpdate}
      />
    </div>
  );
};

export default NewPhaseCard;
