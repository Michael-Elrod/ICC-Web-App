// handlers/new/materials.ts
import { FormMaterial,FormPhase } from "../../app/types/database";
import { UserView } from "../../app/types/views";
import { createLocalDate } from "@/app/utils";
import { handleConfirmDelete } from "./jobs";

export const updateMaterial = (updatedMaterial: FormMaterial, phase: FormPhase, onUpdate: (phase: FormPhase) => void) => {
  const updatedMaterials = phase.materials.map(m => 
    m.id === updatedMaterial.id ? updatedMaterial : m
  ).sort((a, b) => 
    createLocalDate(a.dueDate).getTime() - createLocalDate(b.dueDate).getTime()
  );
  
  onUpdate({
    ...phase,
    materials: updatedMaterials
  });
};

export const handleDeleteConfirm = (
  materialId: string,
  onDelete: () => void,
  setShowDeleteConfirm: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  onDelete();
  setShowDeleteConfirm(false);
};

export const handleDeleteClick = (
  setShowDeleteConfirm: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setShowDeleteConfirm(true);
};

export const handleDueDateChange = (
  field: string,
  value: string,
  phaseStartDate: string,
  setLocalMaterial: React.Dispatch<React.SetStateAction<FormMaterial>>,
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>
) => {
  if (field === "dueDate") {
    // Create Date objects for comparison, setting time to midnight
    const selectedDate = value ? new Date(new Date(value).setHours(0,0,0,0)) : null;
    const phaseStart = new Date(phaseStartDate);
    phaseStart.setHours(0,0,0,0);

    if (selectedDate && selectedDate >= phaseStart) {
      setLocalMaterial((prev) => ({
        ...prev,
        [field]: value,
      }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
    } else {
      setErrors((prev) => ({
        ...prev,
        [field]: "Due date cannot be before phase start date",
      }));
    }
  } else {
    setLocalMaterial((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }
};

export const handleContactSelect = (
  contact: UserView,
  selectedContacts: UserView[],
  setSelectedContacts: React.Dispatch<React.SetStateAction<UserView[]>>
) => {
  setSelectedContacts([...selectedContacts, contact]);
};

export const handleContactRemove = (
  userId: string,
  selectedContacts: UserView[],
  setSelectedContacts: React.Dispatch<React.SetStateAction<UserView[]>>
) => {
  setSelectedContacts(
    selectedContacts.filter((contact) => contact.user_id.toString() !== userId)
  );
};

export const validateMaterial = (
  localMaterial: FormMaterial,
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>,
  phaseStartDate: string
): boolean => {
  const newErrors: { [key: string]: string } = {};
  
  if (!localMaterial.title.trim()) {
    newErrors.title = "Title is required";
  }
  
  if (!localMaterial.dueDate) {
    newErrors.dueDate = "Due date is required";
  } else if (localMaterial.dueDate < phaseStartDate) {
    newErrors.dueDate = "Due date cannot be before phase start date";
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

export const handleDone = (
  localMaterial: FormMaterial,
  selectedContacts: UserView[],
  setLocalMaterial: React.Dispatch<React.SetStateAction<FormMaterial>>,
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>,
  onUpdate: (material: FormMaterial) => void,
  phaseStartDate: string
) => {
  if (validateMaterial(localMaterial, setErrors, phaseStartDate)) {
    const updatedMaterial = {
      ...localMaterial,
      selectedContacts: selectedContacts.map((contact) => ({
        id: contact.user_id.toString(),
      })),
      isExpanded: false,
    };
    onUpdate(updatedMaterial);
    setLocalMaterial(updatedMaterial);
  }
};