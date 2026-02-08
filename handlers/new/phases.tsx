// phases.tsx

import { FormPhase, FormNote } from "@/app/types/database";

export const handleInputChange = (
  field: "title" | "startDate" | "description",
  value: string,
  phase: FormPhase,
  onUpdate: (phase: FormPhase) => void,
) => {
  const updatedPhase = {
    ...phase,
    [field]: value,
  };
  onUpdate(updatedPhase);
};

export const deleteTask = (
  taskId: string,
  phase: FormPhase,
  onUpdate: (phase: FormPhase) => void,
  setIsAddingTask: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  if (taskId) {
    const updatedTasks = phase.tasks.filter((task) => task.id !== taskId);
    onUpdate({ ...phase, tasks: updatedTasks });
  }
  setIsAddingTask(false);
};

export const deleteMaterial = (
  materialId: string,
  phase: FormPhase,
  onUpdate: (phase: FormPhase) => void,
  setIsAddingMaterial: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  if (materialId) {
    const updatedMaterials = phase.materials.filter(
      (material) => material.id !== materialId,
    );
    onUpdate({ ...phase, materials: updatedMaterials });
  }
  setIsAddingMaterial(false);
};

export const updateNote = (
  updatedNote: FormNote,
  phase: FormPhase,
  onUpdate: (phase: FormPhase) => void,
) => {
  const updatedNotes =
    phase.notes?.map((note) =>
      note.id === updatedNote.id
        ? { ...updatedNote, isExpanded: note.isExpanded }
        : note,
    ) || [];
  onUpdate({ ...phase, notes: updatedNotes });
};

export const deleteNote = (
  noteId: string,
  phase: FormPhase,
  onUpdate: (phase: FormPhase) => void,
  setIsAddingNote: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  if (noteId) {
    const updatedNotes =
      phase.notes?.filter((note) => note.id !== noteId) || [];
    onUpdate({ ...phase, notes: updatedNotes });
  }
  setIsAddingNote(false);
};
