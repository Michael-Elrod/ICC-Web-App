// handlers/jobs.tsx

import { NewJob, FormPhase, User } from '../app/types/database';


export async function createJob(jobData: NewJob): Promise<{ jobId: number }> {
  try {
    const response = await fetch('/api/jobs/new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create job');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error creating job: ${error.message}`);
    }
    throw new Error('An unexpected error occurred while creating the job');
  }
}

export function transformFormDataToNewJob(formData: {
  jobTitle: string;
  startDate: string;
  jobLocation?: string;
  description?: string;
  selectedClient?: { user_id: number } | null;
  phases: Array<{
    title: string;
    startDate: string;
    description: string;
    tasks: Array<{
      title: string;
      startDate: string;
      duration: string;
      details?: string;
      selectedContacts?: Array<{ id: string }>;
    }>;
    materials: Array<{
      title: string;
      dueDate: string;
      details?: string;
      selectedContacts?: Array<{ id: string }>;
    }>;
    notes: Array<{
      content: string;
    }>;
  }>;
}): NewJob {
  return {
    title: formData.jobTitle,
    startDate: formData.startDate,
    location: formData.jobLocation,
    description: formData.description,
    client: formData.selectedClient || null,
    phases: formData.phases.map(phase => ({
      title: phase.title,
      startDate: phase.startDate,
      description: phase.description,
      tasks: phase.tasks.map(task => ({
        title: task.title,
        startDate: task.startDate,
        duration: parseInt(task.duration),
        details: task.details,
        assignedUsers: task.selectedContacts?.map(contact => parseInt(contact.id)) || [],
      })),
      materials: phase.materials.map(material => ({
        title: material.title,
        dueDate: material.dueDate,
        details: material.details,
        assignedUsers: material.selectedContacts?.map(contact => parseInt(contact.id)) || [],
      })),
      notes: phase.notes.map(note => ({
        content: note.content,
      })),
    })),
  };
}

export const handleAddPhase = (
  phases: FormPhase[], 
  setPhases: React.Dispatch<React.SetStateAction<FormPhase[]>>,
  jobStartDate?: string
) => {
  const newPhase: FormPhase = {
    tempId: `phase-${Date.now()}`,  // Generate temporary ID
    title: '',
    startDate: jobStartDate || '',
    description: '',
    tasks: [],
    materials: [],
    notes: []
  };
  setPhases([...phases, newPhase]);
};

export const handleCancel = (
  setJobTitle: (value: string) => void,
  setFirstName: (value: string) => void,
  setLastName: (value: string) => void,
  setClientPhone: (value: string) => void,
  setClientEmail: (value: string) => void,
  setStartDate: (value: string) => void,
  setJobLocation: (value: string) => void,
  setDescription: (value: string) => void,
  setPhases: (value: FormPhase[]) => void,
  setSelectedClient: (value: User | null) => void,
  setShowNewClientForm: (value: boolean) => void
) => {
  setJobTitle("");
  setFirstName("");
  setLastName("");
  setClientPhone("");
  setClientEmail("");
  setStartDate("");
  setJobLocation("");
  setDescription("");
  setPhases([]);
  setSelectedClient(null);
  setShowNewClientForm(false);
};