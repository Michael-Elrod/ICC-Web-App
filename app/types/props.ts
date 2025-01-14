// types/props.ts
import { ReactNode } from "react";
import { FormPhase, FormMaterial, FormTask } from "./database";
import { UserView, PhaseView, NoteView } from "./views";

export interface DetailPhaseCardProps {
  phase: {
    phase_id: number;
    name: string;
    startDate: string;
    endDate: string;
    tasks: {
      task_id: number;
      task_title: string;
      task_startdate: string;
      task_duration: number;
      task_status: string;
      task_description: string;
      users: {
        user_id: number;
        first_name: string;
        last_name: string;
        user_email: string;
        user_phone: string;
      }[];
    }[];
    materials: {
      material_id: number;
      material_title: string;
      material_duedate: string;
      material_status: string;
      material_description: string;
      users: {
        user_id: number;
        first_name: string;
        last_name: string;
        user_email: string;
        user_phone: string;
      }[];
    }[];
    notes: any[];
  };
  phaseNumber: number;
  showTasks: boolean;
  showMaterials: boolean;
  contacts: UserView[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onStatusUpdate: (
    id: number,
    type: "task" | "material",
    newStatus: string
  ) => void;
  onTaskDelete: (taskId: number) => Promise<void>;
  onMaterialDelete: (materialId: number) => Promise<void>;
  onTaskCreate: (phaseId: number, task: FormTask) => Promise<any>;
  onMaterialCreate: (phaseId: number, material: FormMaterial) => Promise<any>;
  onNoteDelete: (phaseId: number, noteTimestamp: string) => Promise<void>;
  jobStartDate: string;
  onPhaseUpdate: (
    phaseId: number, 
    updates: {
      title: string;
      startDate: string;
      extend: number;
      extendFuturePhases: boolean;
      adjustItems?: boolean;
      daysDiff?: number;
      tasks?: Array<{
        task_id: number;
        task_title: string;
        task_startdate: string;
        task_duration: number;
        task_status: string;
        task_description: string;
        users: Array<{
          user_id: number;
          first_name: string;
          last_name: string;
          user_email: string;
          user_phone: string;
        }>;
      }>;
      materials?: Array<{
        material_id: number;
        material_title: string;
        material_duedate: string;
        material_status: string;
        material_description: string;
        users: Array<{
          user_id: number;
          first_name: string;
          last_name: string;
          user_email: string;
          user_phone: string;
        }>;
      }>;
    }
  ) => Promise<void>;
}

export interface PhaseCardProps {
  phase: FormPhase;
  onDelete: () => void;
  jobStartDate: string;
  onUpdate: (phase: FormPhase, extend?: number, extendFuturePhases?: boolean) => void;
  onAddPhaseAfter: (phaseId: string) => void;
  onMovePhase: (direction: "up" | "down" | "future", amount?: number) => void;
  contacts: UserView[];
  onPhaseUpdate?: (phaseId: number, updates: {
    title: string;
    startDate: string;
    extend: number;
    extendFuturePhases: boolean;
    adjustItems?: boolean;
    daysDiff?: number;
  }) => void;
}

export interface TaskCardProps {
  task: FormTask;
  onUpdate: (updatedTask: FormTask) => void;
  onDelete: () => void;
  phaseStartDate: string;
  contacts: UserView[];
  phase: FormPhase; 
  onPhaseUpdate: (phase: FormPhase) => void;
}

export interface MaterialCardProps {
  material: FormMaterial;
  onUpdate: (updatedMaterial: FormMaterial) => void;
  onDelete: () => void;
  phaseStartDate: string;
  contacts: UserView[];
  phase: FormPhase;
  onPhaseUpdate: (phase: FormPhase) => void;
}

export interface ContactCardProps {
  user_id?: number;
  user_first_name: string;
  user_last_name: string;
  user_email: string;
  user_phone?: string;
  showCheckbox?: boolean;
}

export interface TimelineProps {
  phases: PhaseView[];
  currentWeek: number;
  startDate: string;
  endDate: string;
  onStatusUpdate: (
    itemId: number,
    type: "task" | "material",
    newStatus: "Complete" | "Incomplete" | "In Progress"
  ) => void;
}

export interface CardFrameProps {
  children: ReactNode;
  className?: string;
}

export interface NoteProps extends NoteView {
  onClick: () => void;
  isExpanded: boolean;
  onAddNote?: () => void;
  newNote?: string;
  onNewNoteChange?: (value: string) => void;
}

export interface InvalidItemProp {
  type: "task" | "material" | "note";
  phaseIndex: number;
  itemIndex: number;
  elementId: string;
}
