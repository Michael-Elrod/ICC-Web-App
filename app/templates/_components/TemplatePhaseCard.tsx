// TemplatePhaseCard.tsx

"use client";

import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import CardFrame from "@/components/CardFrame";
import CollapsibleSection from "@/components/CollapsibleSection";
import ContactSearchSelect from "@/components/ContactSearchSelect";
import { UserView } from "@/app/types/views";
import { computePreviewDate } from "@/app/utils";

export interface TemplateContact {
  user_id: number;
  first_name: string;
  last_name: string;
  user_email: string;
  user_phone: string;
}

export interface TemplateTask {
  tempId: string;
  title: string;
  duration: number;
  offset: number;
  description: string;
  contacts: TemplateContact[];
}

export interface TemplateMaterial {
  tempId: string;
  title: string;
  offset: number;
  description: string;
  contacts: TemplateContact[];
}

export interface TemplatePhaseData {
  tempId: string;
  title: string;
  description: string;
  tasks: TemplateTask[];
  materials: TemplateMaterial[];
}

interface TemplatePhaseCardProps {
  phase: TemplatePhaseData;
  onUpdate: (phase: TemplatePhaseData) => void;
  onDelete: () => void;
  onAddPhaseAfter: (phaseId: string) => void;
  contacts: UserView[];
  phaseIndex?: number;
  previewStartDate?: string | null;
}

const TemplatePhaseCard: React.FC<TemplatePhaseCardProps> = ({
  phase,
  onUpdate,
  onDelete,
  onAddPhaseAfter,
  contacts,
  phaseIndex,
  previewStartDate,
}) => {
  const [isPhaseCollapsed, setIsPhaseCollapsed] = useState(true);
  const [isTasksExpanded, setIsTasksExpanded] = useState(false);
  const [isMaterialsExpanded, setIsMaterialsExpanded] = useState(false);
  const [showAddButton, setShowAddButton] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(
    null,
  );
  const [showDeletePhaseConfirm, setShowDeletePhaseConfirm] = useState(false);

  const addTask = () => {
    const newTask: TemplateTask = {
      tempId: `task-${Date.now()}`,
      title: "",
      duration: 1,
      offset: 0,
      description: "",
      contacts: [],
    };
    onUpdate({
      ...phase,
      tasks: [...phase.tasks, newTask],
    });
    setEditingTaskId(newTask.tempId);
    setIsTasksExpanded(true);
  };

  const updateTask = (updatedTask: TemplateTask) => {
    onUpdate({
      ...phase,
      tasks: phase.tasks.map((t) =>
        t.tempId === updatedTask.tempId ? updatedTask : t,
      ),
    });
  };

  const deleteTask = (taskId: string) => {
    onUpdate({
      ...phase,
      tasks: phase.tasks.filter((t) => t.tempId !== taskId),
    });
  };

  const addMaterial = () => {
    const newMaterial: TemplateMaterial = {
      tempId: `material-${Date.now()}`,
      title: "",
      offset: 0,
      description: "",
      contacts: [],
    };
    onUpdate({
      ...phase,
      materials: [...phase.materials, newMaterial],
    });
    setEditingMaterialId(newMaterial.tempId);
    setIsMaterialsExpanded(true);
  };

  const updateMaterial = (updatedMaterial: TemplateMaterial) => {
    onUpdate({
      ...phase,
      materials: phase.materials.map((m) =>
        m.tempId === updatedMaterial.tempId ? updatedMaterial : m,
      ),
    });
  };

  const deleteMaterial = (materialId: string) => {
    onUpdate({
      ...phase,
      materials: phase.materials.filter((m) => m.tempId !== materialId),
    });
  };

  return (
    <div className="relative">
      <div className="relative">
        <CardFrame
          className={
            isPhaseCollapsed
              ? "cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              : ""
          }
          onClick={
            isPhaseCollapsed ? () => setIsPhaseCollapsed(false) : undefined
          }
        >
          {/* Header */}
          <div
            className={`flex justify-between items-center${!isPhaseCollapsed ? " mb-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/50 -mx-4 px-4 -mt-5 pt-5 pb-2 sm:-mx-6 sm:px-6 sm:-mt-6 sm:pt-6 transition-colors" : ""}`}
            onClick={
              !isPhaseCollapsed
                ? (e) => {
                    if (!(e.target as HTMLElement).closest("button, input")) {
                      setIsPhaseCollapsed(true);
                    }
                  }
                : undefined
            }
          >
            <div className="grid grid-cols-2 items-center w-full">
              <div className="flex-1 col-span-1 pr-2">
                {!isPhaseCollapsed ? (
                  <input
                    type="text"
                    value={phase.title}
                    onChange={(e) =>
                      onUpdate({ ...phase, title: e.target.value })
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="text-md sm:text-2xl font-bold w-full bg-transparent border-b border-zinc-300 dark:border-zinc-600 focus:outline-none focus:border-blue-500 dark:text-white"
                    placeholder="Phase Title"
                  />
                ) : (
                  <h2 className="text-md sm:text-2xl font-bold truncate">
                    {phase.title || "Untitled Phase"}
                  </h2>
                )}
              </div>
              <span className="text-md text-right justify-self-end col-span-1 text-zinc-500 dark:text-zinc-400">
                {(() => {
                  if (previewStartDate == null || phaseIndex == null)
                    return null;
                  const allOffsets = [
                    ...phase.tasks.map((t) => t.offset),
                    ...phase.materials.map((m) => m.offset),
                  ];
                  if (allOffsets.length === 0) return null;
                  const earliest = Math.min(...allOffsets);
                  const previewDate = computePreviewDate(
                    previewStartDate,
                    earliest,
                    phaseIndex,
                  );
                  return previewDate ? `Starts ~${previewDate}` : null;
                })()}
              </span>
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
                    onUpdate({ ...phase, description: e.target.value })
                  }
                  className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded dark:bg-zinc-800 dark:text-white"
                  rows={2}
                  placeholder="Phase description..."
                />
              </div>

              <div className="space-y-4 mt-4">
                {/* Tasks Section */}
                <CollapsibleSection
                  title="Tasks"
                  itemCount={phase.tasks.length}
                  isExpanded={isTasksExpanded}
                  onToggle={() => setIsTasksExpanded(!isTasksExpanded)}
                >
                  <div className="space-y-2">
                    {phase.tasks.map((task) => (
                      <TemplateTaskRow
                        key={task.tempId}
                        task={task}
                        isEditing={editingTaskId === task.tempId}
                        onEdit={() => setEditingTaskId(task.tempId)}
                        onDone={() => setEditingTaskId(null)}
                        onUpdate={updateTask}
                        onDelete={() => deleteTask(task.tempId)}
                        availableContacts={contacts}
                        previewStartDate={previewStartDate}
                        phaseIndex={phaseIndex}
                      />
                    ))}
                    <div className="flex justify-center mt-4">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
                        onClick={addTask}
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
                </CollapsibleSection>

                {/* Materials Section */}
                <CollapsibleSection
                  title="Materials"
                  itemCount={phase.materials.length}
                  isExpanded={isMaterialsExpanded}
                  onToggle={() => setIsMaterialsExpanded(!isMaterialsExpanded)}
                >
                  <div className="space-y-2">
                    {phase.materials.map((material) => (
                      <TemplateMaterialRow
                        key={material.tempId}
                        material={material}
                        isEditing={editingMaterialId === material.tempId}
                        onEdit={() => setEditingMaterialId(material.tempId)}
                        onDone={() => setEditingMaterialId(null)}
                        onUpdate={updateMaterial}
                        onDelete={() => deleteMaterial(material.tempId)}
                        availableContacts={contacts}
                        previewStartDate={previewStartDate}
                        phaseIndex={phaseIndex}
                      />
                    ))}
                    <div className="flex justify-center mt-4">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
                        onClick={addMaterial}
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
                </CollapsibleSection>
              </div>

              <button
                onClick={() => setShowDeletePhaseConfirm(true)}
                className="w-full mt-6 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors font-medium"
              >
                Delete Phase
              </button>
            </>
          )}
        </CardFrame>

        {/* Add Phase After button */}
        <div
          className={`absolute left-0 right-0 -bottom-4 h-8 flex justify-center items-center transition-opacity duration-200 ${
            showAddButton ? "opacity-100" : "opacity-0"
          }`}
          onMouseEnter={() => setShowAddButton(true)}
          onMouseLeave={() => setShowAddButton(false)}
        >
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
            onClick={() => onAddPhaseAfter(phase.tempId)}
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

      {showDeletePhaseConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-xl max-w-sm">
            <p className="text-lg font-medium dark:text-white mb-4">
              Delete &quot;{phase.title || "this phase"}&quot;? This will remove
              all tasks and materials in this phase.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeletePhaseConfirm(false)}
                className="px-4 py-2 text-zinc-600 dark:text-zinc-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeletePhaseConfirm(false);
                  onDelete();
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Contact pills display ---
function ContactPills({
  selectedContacts,
  onRemove,
}: {
  selectedContacts: TemplateContact[];
  onRemove: (userId: number) => void;
}) {
  if (selectedContacts.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {selectedContacts.map((c) => (
        <span
          key={c.user_id}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs"
        >
          {c.first_name} {c.last_name}
          <button
            onClick={() => onRemove(c.user_id)}
            className="hover:text-red-500"
          >
            <FaTimes size={10} />
          </button>
        </span>
      ))}
    </div>
  );
}

// --- Task Row Component ---
function TemplateTaskRow({
  task,
  isEditing,
  onEdit,
  onDone,
  onUpdate,
  onDelete,
  availableContacts,
  previewStartDate,
  phaseIndex,
}: {
  task: TemplateTask;
  isEditing: boolean;
  onEdit: () => void;
  onDone: () => void;
  onUpdate: (task: TemplateTask) => void;
  onDelete: () => void;
  availableContacts: UserView[];
  previewStartDate?: string | null;
  phaseIndex?: number;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleContactSelect = (contact: UserView) => {
    if (!task.contacts.some((c) => c.user_id === contact.user_id)) {
      onUpdate({
        ...task,
        contacts: [
          ...task.contacts,
          {
            user_id: contact.user_id,
            first_name: contact.first_name,
            last_name: contact.last_name,
            user_email: contact.user_email,
            user_phone: contact.user_phone || "",
          },
        ],
      });
    }
  };

  const handleContactRemove = (userId: number) => {
    onUpdate({
      ...task,
      contacts: task.contacts.filter((c) => c.user_id !== userId),
    });
  };

  if (!isEditing) {
    return (
      <div
        className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-600"
        onClick={onEdit}
      >
        <div className="flex-1 min-w-0">
          <span className="font-medium dark:text-white truncate block">
            {task.title || "Untitled Task"}
          </span>
          {task.contacts.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {task.contacts.map((c) => (
                <span
                  key={c.user_id}
                  className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                >
                  {c.first_name} {c.last_name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 shrink-0 ml-4">
          <span>{task.duration}d duration</span>
          <span>
            Starts Day {task.offset}
            {previewStartDate != null && phaseIndex != null && (
              <span className="text-blue-500">
                {" "}
                ({computePreviewDate(previewStartDate, task.offset, phaseIndex)}
                )
              </span>
            )}
          </span>
        </div>
      </div>
    );
  }

  const taskPreviewDate =
    previewStartDate != null && phaseIndex != null
      ? computePreviewDate(previewStartDate, task.offset, phaseIndex)
      : null;

  // Convert TemplateContact[] to UserView[] for ContactSearchSelect
  const selectedAsUserView: UserView[] = task.contacts.map((c) => ({
    user_id: c.user_id,
    first_name: c.first_name,
    last_name: c.last_name,
    user_email: c.user_email,
    user_phone: c.user_phone,
  }));

  return (
    <div className="p-4 bg-zinc-50 dark:bg-zinc-700 rounded-lg space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <label className="block text-sm font-medium text-zinc-700 dark:text-white">
            Title
          </label>
          <input
            type="text"
            value={task.title}
            onChange={(e) => onUpdate({ ...task, title: e.target.value })}
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded dark:bg-zinc-800 dark:text-white"
            placeholder="Task title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-white">
            Duration (days)
          </label>
          <input
            type="number"
            min="1"
            value={task.duration}
            onChange={(e) =>
              onUpdate({
                ...task,
                duration: Math.max(1, parseInt(e.target.value) || 1),
              })
            }
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded dark:bg-zinc-800 dark:text-white"
          />
          <p className="text-xs text-zinc-400 mt-1">
            How many business days this task takes
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-white">
            Start Day (days from start)
          </label>
          <input
            type="number"
            value={task.offset}
            onChange={(e) =>
              onUpdate({ ...task, offset: parseInt(e.target.value) || 0 })
            }
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded dark:bg-zinc-800 dark:text-white"
          />
          <p className="text-xs text-zinc-400 mt-1">
            When the task begins. Business days from job start. Negative =
            before start.
            {taskPreviewDate && (
              <span className="text-blue-500"> Example: {taskPreviewDate}</span>
            )}
          </p>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-white">
          Description
        </label>
        <textarea
          value={task.description}
          onChange={(e) => onUpdate({ ...task, description: e.target.value })}
          className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded dark:bg-zinc-800 dark:text-white"
          rows={2}
          placeholder="Task description..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-white mb-1">
          Assigned People
        </label>
        <ContactSearchSelect
          contacts={availableContacts}
          selectedContacts={selectedAsUserView}
          onSelect={handleContactSelect}
        />
        <ContactPills
          selectedContacts={task.contacts}
          onRemove={handleContactRemove}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-3 py-1 text-red-600 hover:text-red-800 text-sm"
        >
          Delete
        </button>
        <button
          onClick={onDone}
          className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
        >
          Done
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-xl max-w-sm">
            <p className="text-lg font-medium dark:text-white mb-4">
              Delete &quot;{task.title || "this task"}&quot;?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-zinc-600 dark:text-zinc-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete();
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Material Row Component ---
function TemplateMaterialRow({
  material,
  isEditing,
  onEdit,
  onDone,
  onUpdate,
  onDelete,
  availableContacts,
  previewStartDate,
  phaseIndex,
}: {
  material: TemplateMaterial;
  isEditing: boolean;
  onEdit: () => void;
  onDone: () => void;
  onUpdate: (material: TemplateMaterial) => void;
  onDelete: () => void;
  availableContacts: UserView[];
  previewStartDate?: string | null;
  phaseIndex?: number;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleContactSelect = (contact: UserView) => {
    if (!material.contacts.some((c) => c.user_id === contact.user_id)) {
      onUpdate({
        ...material,
        contacts: [
          ...material.contacts,
          {
            user_id: contact.user_id,
            first_name: contact.first_name,
            last_name: contact.last_name,
            user_email: contact.user_email,
            user_phone: contact.user_phone || "",
          },
        ],
      });
    }
  };

  const handleContactRemove = (userId: number) => {
    onUpdate({
      ...material,
      contacts: material.contacts.filter((c) => c.user_id !== userId),
    });
  };

  if (!isEditing) {
    return (
      <div
        className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-600"
        onClick={onEdit}
      >
        <div className="flex-1 min-w-0">
          <span className="font-medium dark:text-white truncate block">
            {material.title || "Untitled Material"}
          </span>
          {material.contacts.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {material.contacts.map((c) => (
                <span
                  key={c.user_id}
                  className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                >
                  {c.first_name} {c.last_name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 shrink-0 ml-4">
          <span>
            Due Day {material.offset}
            {previewStartDate != null && phaseIndex != null && (
              <span className="text-blue-500">
                {" "}
                (
                {computePreviewDate(
                  previewStartDate,
                  material.offset,
                  phaseIndex,
                )}
                )
              </span>
            )}
          </span>
        </div>
      </div>
    );
  }

  const materialPreviewDate =
    previewStartDate != null && phaseIndex != null
      ? computePreviewDate(previewStartDate, material.offset, phaseIndex)
      : null;

  const selectedAsUserView: UserView[] = material.contacts.map((c) => ({
    user_id: c.user_id,
    first_name: c.first_name,
    last_name: c.last_name,
    user_email: c.user_email,
    user_phone: c.user_phone,
  }));

  return (
    <div className="p-4 bg-zinc-50 dark:bg-zinc-700 rounded-lg space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-white">
            Title
          </label>
          <input
            type="text"
            value={material.title}
            onChange={(e) => onUpdate({ ...material, title: e.target.value })}
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded dark:bg-zinc-800 dark:text-white"
            placeholder="Material title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-white">
            Due Day (days from start)
          </label>
          <input
            type="number"
            value={material.offset}
            onChange={(e) =>
              onUpdate({
                ...material,
                offset: parseInt(e.target.value) || 0,
              })
            }
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded dark:bg-zinc-800 dark:text-white"
          />
          <p className="text-xs text-zinc-400 mt-1">
            When the material is due. Business days from job start. Negative =
            before start.
            {materialPreviewDate && (
              <span className="text-blue-500">
                {" "}
                Example: {materialPreviewDate}
              </span>
            )}
          </p>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-white">
          Description
        </label>
        <textarea
          value={material.description}
          onChange={(e) =>
            onUpdate({ ...material, description: e.target.value })
          }
          className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded dark:bg-zinc-800 dark:text-white"
          rows={2}
          placeholder="Material description..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-white mb-1">
          Assigned People
        </label>
        <ContactSearchSelect
          contacts={availableContacts}
          selectedContacts={selectedAsUserView}
          onSelect={handleContactSelect}
        />
        <ContactPills
          selectedContacts={material.contacts}
          onRemove={handleContactRemove}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-3 py-1 text-red-600 hover:text-red-800 text-sm"
        >
          Delete
        </button>
        <button
          onClick={onDone}
          className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
        >
          Done
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-xl max-w-sm">
            <p className="text-lg font-medium dark:text-white mb-4">
              Delete &quot;{material.title || "this material"}&quot;?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-zinc-600 dark:text-zinc-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete();
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TemplatePhaseCard;
