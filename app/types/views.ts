// types/views.ts
export interface JobCardView {
  job_id: number;
  job_title: string;
  overdue_count: number;
  next_week_count: number;
  later_weeks_count: number;
}

export interface JobDetailView {
  id: number;
  jobName: string;
  job_startdate: string;
  dateRange: string;
  currentWeek: number;
  phases: PhaseView[];
  overdue: number;
  sevenDaysPlus: number;
  nextSevenDays: number;
  tasks: TaskView[];
  materials: MaterialView[];
  contacts: string[];
}

export interface PhaseView {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  color: string;
  tasks: TaskView[];
  materials: MaterialView[];
  notes: NoteView[];
}

export interface TaskView {
  task_id: number;
  phase_id: number;
  task_title: string;
  task_startdate: string;
  task_duration: number;
  task_status: string;
  task_description: string;
  users: UserView[];
}

export interface MaterialView {
  material_id: number;
  phase_id: number;
  material_title: string;
  material_duedate: string;
  material_status: string;
  material_description: string;
  users: UserView[];
}

export interface NoteView {
  note_details: string;
  created_at: string;
  created_by: {
    user: UserView;
  };
}

export interface UserView {
  user_id: number;
  first_name: string;
  last_name: string;
  user_email: string;
  user_phone: string;
}

export interface Tab {
  name: string;
  href?: string;
}

export interface NavTab {
  name: string;
  href: string;
}