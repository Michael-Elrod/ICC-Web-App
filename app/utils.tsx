// utils.tsx

import { TaskView, MaterialView } from "./types/views";

export const isEmailValid = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const formatPhoneNumber = (phone: string | undefined): string => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");

  switch (cleaned.length) {
    case 7:
      return cleaned.replace(/(\d{3})(\d{4})/, "$1-$2");

    case 10:
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");

    case 11:
      return cleaned.replace(/1(\d{3})(\d{3})(\d{4})/, "+1 ($1) $2-$3");

    default:
      return phone;
  }
};

export const formatPhoneNumberInput = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  if (!numbers) return "";
  if (numbers.length <= 3) return `(${numbers}`;
  if (numbers.length <= 6)
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
  return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
};

export const formatCardDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const calculateEndDate = (
  start: string,
  durationDays: number,
): string => {
  const date = new Date(start);
  date.setDate(date.getDate() + durationDays);
  return date.toISOString().split("T")[0];
};

export function formatDate(dateString: string): string {
  if (!dateString) {
    throw new Error("Invalid date string");
  }

  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(dateString)
      ? `${dateString}T00:00:00`
      : dateString,
  );

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date format");
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear().toString().slice(-2);

  return `${month}/${day}/${year}`;
}

export const createLocalDate = (dateString: string): Date => {
  if (dateString.includes("T")) {
    const date = new Date(dateString);
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0,
      0,
    );
  }

  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

export const formatToDateString = (date: Date): string => {
  return date.toLocaleDateString("en-CA");
};

export const getCurrentBusinessDate = (currentDate: Date): Date => {
  const [year, month, day] = formatToDateString(currentDate)
    .split("-")
    .map(Number);
  const result = new Date(
    year,
    month - 1,
    day,
    currentDate.getHours(),
    currentDate.getMinutes(),
    currentDate.getSeconds(),
    currentDate.getMilliseconds(),
  );

  const dayOfWeek = result.getDay();

  if (dayOfWeek === 0) {
    // Sunday
    result.setDate(result.getDate() + 1);
  } else if (dayOfWeek === 6) {
    // Saturday
    result.setDate(result.getDate() + 2);
  }

  return result;
};

export const addBusinessDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  const day = result.getDay();

  if (day === 0) {
    result.setDate(result.getDate() + 1);
  } else if (day === 6) {
    result.setDate(result.getDate() + 2);
  }
  if (days === 0) {
    return result;
  }

  let remaining = Math.abs(days);
  const direction = days < 0 ? -1 : 1;

  while (remaining > 0) {
    result.setDate(result.getDate() + direction);
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      remaining--;
    }
  }
  return result;
};

export function getBusinessDaysBetween(startDate: Date, endDate: Date): number {
  let count = 0;
  const curDate = new Date(startDate.getTime());
  curDate.setDate(curDate.getDate() + 1);

  while (curDate <= endDate) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
    curDate.setDate(curDate.getDate() + 1);
  }

  return count;
}

export const computePreviewDate = (
  previewStartDate: string | null,
  offset: number,
  phaseIndex: number,
): string | null => {
  if (!previewStartDate) return null;

  if (phaseIndex === 0 && offset === 0) {
    const today = getCurrentBusinessDate(new Date());
    return today.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  const date = addBusinessDays(createLocalDate(previewStartDate), offset);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const calculatePhaseDates = (
  tasks: TaskView[],
  materials: MaterialView[],
) => {
  let phaseStart = new Date(8640000000000000); // Max date
  let phaseEnd = new Date(-8640000000000000); // Min date

  tasks.forEach((task) => {
    const taskStart = createLocalDate(task.task_startdate);
    const taskEnd = addBusinessDays(taskStart, task.task_duration);

    if (taskStart < phaseStart) phaseStart = taskStart;
    if (taskEnd > phaseEnd) phaseEnd = taskEnd;
  });

  materials.forEach((material) => {
    const materialDate = createLocalDate(material.material_duedate);
    if (materialDate < phaseStart) phaseStart = materialDate;
    if (materialDate > phaseEnd) phaseEnd = materialDate;
  });

  return {
    startDate: formatToDateString(phaseStart),
    endDate: formatToDateString(phaseEnd),
  };
};
