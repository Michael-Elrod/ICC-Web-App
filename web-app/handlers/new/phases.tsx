// handlers/new/phase.ts
import { FormPhase, FormTask, FormMaterial, FormNote } from "../../app/types/database";

// Basic UI handlers
export const handleTitleClick = (
  isMinimized: boolean,
  setIsEditingTitle: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (!isMinimized) {
    setIsEditingTitle(true);
  }
};

export const handleTitleBlur = (setIsEditingTitle: React.Dispatch<React.SetStateAction<boolean>>) => {
  setIsEditingTitle(false);
};

export const handleTitleKeyDown = (
  e: React.KeyboardEvent<HTMLInputElement>,
  setIsEditingTitle: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (e.key === 'Enter') {
    setIsEditingTitle(false);
  }
};

export const handleInputChange = (
  field: 'title' | 'startDate' | 'description',
  value: string,
  phase: FormPhase,
  onUpdate: (phase: FormPhase) => void
) => {
  const updatedPhase = {
    ...phase,
    [field]: value
  };
  onUpdate(updatedPhase);
};

// Task Handlers
export const addNewTask = (setIsAddingTask: React.Dispatch<React.SetStateAction<boolean>>) => {
  setIsAddingTask(true);
};

export const saveTask = (
  newTask: FormTask,
  phase: FormPhase,
  onUpdate: (phase: FormPhase) => void
) => {
  const taskId = newTask.id || `task-${Date.now()}`;
  const taskWithId = { 
    ...newTask, 
    id: taskId,
    isExpanded: false,
    selectedContacts: newTask.selectedContacts || []
  };

  const updatedTasks = newTask.id === ""
    ? [...phase.tasks, taskWithId]
    : phase.tasks.map((task) => (task.id === taskId ? taskWithId : task));

  onUpdate({ ...phase, tasks: updatedTasks });
};

export const updateTask = (
  updatedTask: FormTask,
  phase: FormPhase,
  onUpdate: (phase: FormPhase) => void
) => {
  const updatedTasks = phase.tasks.map((task) =>
    task.id === updatedTask.id ? { ...updatedTask, isExpanded: task.isExpanded } : task
  );
  onUpdate({ ...phase, tasks: updatedTasks });
};

export const deleteTask = (
  taskId: string,
  phase: FormPhase,
  onUpdate: (phase: FormPhase) => void,
  setIsAddingTask: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (taskId) {
    const updatedTasks = phase.tasks.filter((task) => task.id !== taskId);
    onUpdate({ ...phase, tasks: updatedTasks });
  }
  setIsAddingTask(false);
};

// Material Handlers
export const addNewMaterial = (setIsAddingMaterial: React.Dispatch<React.SetStateAction<boolean>>) => {
  setIsAddingMaterial(true);
};

export const saveMaterial = (
  newMaterial: FormMaterial,
  phase: FormPhase,
  onUpdate: (phase: FormPhase) => void
) => {
  const materialId = newMaterial.id || `material-${Date.now()}`;
  const materialWithId = { 
    ...newMaterial, 
    id: materialId,
    isExpanded: false,
    selectedContacts: newMaterial.selectedContacts || []
  };

  const updatedMaterials = newMaterial.id === ""
    ? [...phase.materials, materialWithId]
    : phase.materials.map((material) => 
        material.id === materialId ? materialWithId : material
      );

  onUpdate({ ...phase, materials: updatedMaterials });
};

export const updateMaterial = (
  updatedMaterial: FormMaterial,
  phase: FormPhase,
  onUpdate: (phase: FormPhase) => void
) => {
  const updatedMaterials = phase.materials.map((material) =>
    material.id === updatedMaterial.id ? { ...updatedMaterial, isExpanded: material.isExpanded } : material
  );
  onUpdate({ ...phase, materials: updatedMaterials });
};

export const deleteMaterial = (
  materialId: string,
  phase: FormPhase,
  onUpdate: (phase: FormPhase) => void,
  setIsAddingMaterial: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (materialId) {
    const updatedMaterials = phase.materials.filter(
      (material) => material.id !== materialId
    );
    onUpdate({ ...phase, materials: updatedMaterials });
  }
  setIsAddingMaterial(false);
};

// Note Handlers
export const addNewNote = (setIsAddingNote: React.Dispatch<React.SetStateAction<boolean>>) => {
  setIsAddingNote(true);
};

export const saveNote = (
  newNote: FormNote,
  phase: FormPhase,
  onUpdate: (phase: FormPhase) => void
) => {
  const noteId = newNote.id || `note-${Date.now()}`;
  const noteWithId = { 
    ...newNote, 
    id: noteId,
    isExpanded: false
  };

  const updatedNotes = newNote.id === ""
    ? [...(phase.notes || []), noteWithId]
    : phase.notes?.map((note) => (note.id === noteId ? noteWithId : note)) || [];

  onUpdate({ ...phase, notes: updatedNotes });
};

export const updateNote = (
  updatedNote: FormNote,
  phase: FormPhase,
  onUpdate: (phase: FormPhase) => void
) => {
  const updatedNotes = phase.notes?.map((note) =>
    note.id === updatedNote.id ? { ...updatedNote, isExpanded: note.isExpanded } : note
  ) || [];
  onUpdate({ ...phase, notes: updatedNotes });
};

export const deleteNote = (
  noteId: string,
  phase: FormPhase,
  onUpdate: (phase: FormPhase) => void,
  setIsAddingNote: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (noteId) {
    const updatedNotes = phase.notes?.filter((note) => note.id !== noteId) || [];
    onUpdate({ ...phase, notes: updatedNotes });
  }
  setIsAddingNote(false);
};