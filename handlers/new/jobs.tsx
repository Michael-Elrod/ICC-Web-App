// jobs.tsx

import { FormPhase } from "@/app/types/database";
import {
  createLocalDate,
  formatToDateString,
  getCurrentBusinessDate,
  addBusinessDays,
} from "@/app/utils";

export const getJobTypes = async (): Promise<
  { template_id: number; template_name: string }[]
> => {
  const res = await fetch("/api/templates");
  if (!res.ok) return [];
  return res.json();
};

const calculatePhaseStartDate = (
  phase: FormPhase | Partial<FormPhase>,
  isPreplanningPhase = false,
  currentBusinessDate = "",
  jobStartDate = "",
): string => {
  const allDates = [
    ...(phase.tasks?.map((task) => task.startDate) || []),
    ...(phase.materials?.map((material) => material.dueDate) || []),
  ];

  return allDates.length > 0
    ? allDates.reduce((earliest, current) =>
        current < earliest ? current : earliest,
      )
    : isPreplanningPhase
      ? currentBusinessDate
      : jobStartDate;
};

export const handleConfirmDelete = (
  onDelete: () => void,
  setShowDeleteConfirm: React.Dispatch<React.SetStateAction<boolean>>,
  phase: FormPhase,
  onPhaseUpdate: (phase: FormPhase) => void,
) => {
  onDelete();

  const updatedPhase = {
    ...phase,
    tasks: [...phase.tasks],
    materials: [...phase.materials],
  };

  setShowDeleteConfirm(false);
  onPhaseUpdate(updatedPhase);
};

export const handleCreateJob = async (
  templateId: number,
  startDate: string,
  setShowNewJobCard: (show: boolean) => void,
  setPhases: (phases: FormPhase[]) => void,
) => {
  try {
    const res = await fetch(`/api/templates/${templateId}`);
    if (!res.ok) throw new Error("Failed to load template");
    const template = await res.json();
    const phases = template.phases;

    if (!Array.isArray(phases) || phases.length === 0) {
      throw new Error("No phases found in template");
    }

    const tempId = Date.now().toString();
    const currentDate = new Date();
    const localCurrentBusinessDate = getCurrentBusinessDate(currentDate);

    const processedPhases: FormPhase[] = phases.map(
      (phase: any, phaseIndex: number) => {
        const isPreplanningPhase = phaseIndex === 0;

        const tasks = (phase.tasks || []).map(
          (task: any, taskIndex: number) => {
            let baseDate = isPreplanningPhase
              ? task.task_offset === 0
                ? localCurrentBusinessDate
                : createLocalDate(startDate)
              : createLocalDate(startDate);

            const taskStartDate =
              task.task_offset === 0
                ? baseDate
                : addBusinessDays(baseDate, task.task_offset);

            return {
              id: `task-${tempId}-${phaseIndex}-${taskIndex}`,
              title: task.task_title,
              startDate: formatToDateString(taskStartDate),
              duration: task.task_duration.toString(),
              offset: task.task_offset,
              details: task.task_description || "",
              isExpanded: false,
              selectedContacts: (task.contacts || []).map((c: any) => ({
                id: c.user_id.toString(),
              })),
            };
          },
        );

        const materials = (phase.materials || []).map(
          (material: any, materialIndex: number) => {
            let baseDate = isPreplanningPhase
              ? material.material_offset === 0
                ? localCurrentBusinessDate
                : createLocalDate(startDate)
              : createLocalDate(startDate);

            const materialDueDate =
              material.material_offset === 0
                ? baseDate
                : addBusinessDays(baseDate, material.material_offset);

            return {
              id: `material-${tempId}-${phaseIndex}-${materialIndex}`,
              title: material.material_title,
              dueDate: formatToDateString(materialDueDate),
              offset: material.material_offset,
              details: material.material_description || "",
              isExpanded: false,
              selectedContacts: (material.contacts || []).map((c: any) => ({
                id: c.user_id.toString(),
              })),
            };
          },
        );

        const phaseWithItems = {
          title: phase.phase_title,
          description: phase.phase_description || "",
          tasks,
          materials,
        };

        return {
          ...phaseWithItems,
          tempId: `phase-${tempId}-${(phase.phase_title || "").toLowerCase().replace(/\s+/g, "-")}`,
          startDate: calculatePhaseStartDate(
            phaseWithItems,
            isPreplanningPhase,
            formatToDateString(localCurrentBusinessDate),
            startDate,
          ),
          notes: [],
        };
      },
    );

    setPhases(processedPhases);
    setShowNewJobCard(true);
  } catch (error) {
    console.error("Error loading job template:", error);
  }
};

export const handlePhaseUpdate = (
  updatedPhase: FormPhase,
  setPhases: (fn: (prevPhases: FormPhase[]) => FormPhase[]) => void,
  extend?: number,
  extendFuturePhases?: boolean,
) => {
  setPhases((prevPhases) => {
    const phaseIndex = prevPhases.findIndex(
      (p) => p.tempId === updatedPhase.tempId,
    );
    let newPhases = [...prevPhases];

    // Calculate new phase start date
    const newStartDate = calculatePhaseStartDate(
      updatedPhase,
      false,
      "",
      updatedPhase.startDate,
    );

    // Update the current phase with new start date
    newPhases[phaseIndex] = {
      ...updatedPhase,
      startDate: newStartDate,
    };

    // Handle pushing future phases forward
    if (extend && extendFuturePhases) {
      for (let i = phaseIndex + 1; i < newPhases.length; i++) {
        const phase = newPhases[i];

        // Push the phase start date forward
        const pushedStartDate = formatToDateString(
          addBusinessDays(createLocalDate(phase.startDate), extend),
        );

        // Push all tasks forward without extending their duration
        const pushedTasks = phase.tasks.map((task) => ({
          ...task,
          startDate: formatToDateString(
            addBusinessDays(createLocalDate(task.startDate), extend),
          ),
        }));

        // Push all materials forward
        const pushedMaterials = phase.materials.map((material) => ({
          ...material,
          dueDate: formatToDateString(
            addBusinessDays(createLocalDate(material.dueDate), extend),
          ),
        }));

        newPhases[i] = {
          ...phase,
          startDate: pushedStartDate,
          tasks: pushedTasks,
          materials: pushedMaterials,
        };
      }
    }

    return newPhases;
  });
};
