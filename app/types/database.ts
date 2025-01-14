// types/database.ts

export type UserType = 'Owner' | 'Admin' | 'User' | 'Client';
export type JobStatus = 'active' | 'closed';
export type ItemStatus = 'Incomplete' | 'Complete';

interface BaseEntity {
  created_at: Date;
  updated_at: Date;
}

export interface User extends BaseEntity {
  user_id: number;
  user_type: UserType;
  user_first_name: string;
  user_last_name: string;
  user_phone: string | null;
  user_email: string;
}

export interface Job extends BaseEntity {
  job_id: number;
  job_title: string;
  job_startdate: Date;
  job_location: string | null;
  job_description: string | null;
  job_floorplan: Buffer | null;
  job_status: JobStatus;
  client_id: number | null;
  created_by: number;
  client?: User;
  creator?: User;
  phases?: Phase[];
}

export interface Phase extends BaseEntity {
  phase_id: number;
  job_id: number;
  phase_title: string;
  phase_startdate: Date;
  phase_description: string | null;
  created_by: number;
  job?: Job;
  creator?: User;
  tasks?: Task[];
  materials?: Material[];
  notes?: Note[];
}

export interface Task extends BaseEntity {
  task_id: number;
  phase_id: number;
  task_title: string;
  task_startdate: Date;
  task_duration: number;
  task_description: string | null;
  task_status: ItemStatus;
  created_by: number;
  phase?: Phase;
  creator?: User;
  assignedUsers?: User[];
}

export interface Material extends BaseEntity {
  material_id: number;
  phase_id: number;
  material_title: string;
  material_duedate: Date;
  material_description: string | null;
  material_status: ItemStatus;
  created_by: number;
  phase?: Phase;
  creator?: User;
  assignedUsers?: User[];
}

export interface Note extends BaseEntity {
  note_id: number;
  phase_id: number;
  note_details: string;
  created_by: number;
  phase?: Phase;
  creator?: User;
}

export interface UserTask {
  user_id: number;
  task_id: number;
  assigned_by: number;
  created_at: Date;
  user?: User;
  task?: Task;
  assigner?: User;
}

export interface UserMaterial {
  user_id: number;
  material_id: number;
  assigned_by: number;
  created_at: Date;
  user?: User;
  material?: Material;
  assigner?: User;
}

export interface NewPhase {
  title: string;
  startDate: string;
  description: string;
  tasks: NewTask[];
  materials: NewMaterial[];
  notes: NewNote[];
}

export interface NewTask {
  title: string;
  startDate: string;
  duration: number;
  description: string;
  status: ItemStatus;
  assigned_users: number[];
}

export interface NewMaterial {
  title: string;
  dueDate: string;
  description: string;
  status: ItemStatus;
  assigned_users: number[];
}

export interface NewNote {
  content: string;
}

export interface NewJob {
  title: string;
  startDate: string;
  location?: string;
  description?: string;
  client?: {
    user_id: number;
  } | null;
  phases?: Array<{
    title: string;
    startDate: string;
    description?: string;
    tasks: {
      title: string;
      startDate: string;
      duration: number;
      details?: string;
      assignedUsers: number[];
    }[];
    materials: {
      title: string;
      dueDate: string;
      details?: string;
      assignedUsers: number[];
    }[];
    notes: {
      content: string;
    }[];
  }>;
}

export interface TaskUpdatePayload {
  task_title?: string;
  task_description?: string;
  extension_days?: number;
  new_users?: number[];
  pushDates?: boolean;
}

export interface MaterialUpdatePayload {
  material_title?: string;
  material_description?: string;
  extension_days?: number;
  new_users?: number[];
}

export interface FormTask {
  id: string;
  title: string;
  startDate: string;
  duration: string;
  offset: number;
  details?: string;
  selectedContacts?: Array<{ id: string }>;
  isExpanded?: boolean;
}

export interface FormMaterial {
  id: string;
  title: string;
  dueDate: string;
  offset: number;
  details?: string;
  selectedContacts?: Array<{ id: string }>;
  isExpanded?: boolean;
}

export interface FormNote {
  id: string;
  content: string;
  isExpanded?: boolean;
}

export interface FormPhase {
  tempId: string;
  title: string;
  startDate: string;
  description: string;
  tasks: FormTask[];
  materials: FormMaterial[];
  notes: FormNote[];
  isFirst?: boolean;
  isLast?: boolean;
}

export interface JobUpdatePayload {
  job_title?: string;
  job_startdate?: string;
  extension_days?: number;
}