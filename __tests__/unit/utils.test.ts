// utils.test.ts

import { describe, it, expect } from "vitest";
import {
  isEmailValid,
  formatPhoneNumber,
  formatPhoneNumberInput,
  formatCardDate,
  calculateEndDate,
  formatDate,
  createLocalDate,
  formatToDateString,
  getCurrentBusinessDate,
  addBusinessDays,
  getBusinessDaysBetween,
  calculatePhaseDates,
} from "@/app/utils";
import { TaskView, MaterialView } from "@/app/types/views";

describe("isEmailValid", () => {
  it("returns true for valid email addresses", () => {
    expect(isEmailValid("test@example.com")).toBe(true);
    expect(isEmailValid("user.name@domain.org")).toBe(true);
    expect(isEmailValid("test+tag@example.co.uk")).toBe(true);
  });

  it("returns false for invalid email addresses", () => {
    expect(isEmailValid("invalid")).toBe(false);
    expect(isEmailValid("missing@domain")).toBe(false);
    expect(isEmailValid("@nodomain.com")).toBe(false);
    expect(isEmailValid("spaces in@email.com")).toBe(false);
    expect(isEmailValid("")).toBe(false);
  });
});

describe("formatPhoneNumber", () => {
  it("returns empty string for undefined or empty input", () => {
    expect(formatPhoneNumber(undefined)).toBe("");
    expect(formatPhoneNumber("")).toBe("");
  });

  it("formats 7-digit phone numbers", () => {
    expect(formatPhoneNumber("5551234")).toBe("555-1234");
  });

  it("formats 10-digit phone numbers", () => {
    expect(formatPhoneNumber("5551234567")).toBe("(555) 123-4567");
    expect(formatPhoneNumber("(555)123-4567")).toBe("(555) 123-4567");
  });

  it("formats 11-digit phone numbers with country code", () => {
    expect(formatPhoneNumber("15551234567")).toBe("+1 (555) 123-4567");
  });

  it("returns original value for non-standard lengths", () => {
    expect(formatPhoneNumber("123")).toBe("123");
    expect(formatPhoneNumber("12345678901234")).toBe("12345678901234");
  });
});

describe("formatPhoneNumberInput", () => {
  it("returns empty string for empty input", () => {
    expect(formatPhoneNumberInput("")).toBe("");
  });

  it("formats partial phone numbers as user types", () => {
    expect(formatPhoneNumberInput("5")).toBe("(5");
    expect(formatPhoneNumberInput("55")).toBe("(55");
    expect(formatPhoneNumberInput("555")).toBe("(555");
    expect(formatPhoneNumberInput("5551")).toBe("(555) 1");
    expect(formatPhoneNumberInput("555123")).toBe("(555) 123");
    expect(formatPhoneNumberInput("5551234")).toBe("(555) 123-4");
    expect(formatPhoneNumberInput("5551234567")).toBe("(555) 123-4567");
  });

  it("strips non-numeric characters", () => {
    expect(formatPhoneNumberInput("(555) 123")).toBe("(555) 123");
  });
});

describe("formatCardDate", () => {
  it("formats date strings correctly", () => {
    const result = formatCardDate("2024-01-15T12:00:00");
    expect(result).toMatch(/Jan\s+15,\s+2024/);
  });

  it("handles ISO date strings", () => {
    const result = formatCardDate("2024-12-25T12:00:00");
    expect(result).toMatch(/Dec\s+25,\s+2024/);
  });
});

describe("calculateEndDate", () => {
  it("calculates end date by adding days", () => {
    expect(calculateEndDate("2024-01-15", 5)).toBe("2024-01-20");
    expect(calculateEndDate("2024-01-15", 0)).toBe("2024-01-15");
  });

  it("handles month boundaries", () => {
    expect(calculateEndDate("2024-01-30", 5)).toBe("2024-02-04");
  });

  it("handles year boundaries", () => {
    expect(calculateEndDate("2024-12-30", 5)).toBe("2025-01-04");
  });
});

describe("formatDate", () => {
  it("formats YYYY-MM-DD date strings", () => {
    expect(formatDate("2024-01-15")).toBe("1/15/24");
    expect(formatDate("2024-12-05")).toBe("12/5/24");
  });

  it("formats ISO date strings", () => {
    expect(formatDate("2024-06-20T10:30:00")).toBe("6/20/24");
  });

  it("throws error for empty string", () => {
    expect(() => formatDate("")).toThrow("Invalid date string");
  });

  it("throws error for invalid date format", () => {
    expect(() => formatDate("not-a-date")).toThrow("Invalid date format");
  });
});

describe("createLocalDate", () => {
  it("creates date from YYYY-MM-DD string", () => {
    const date = createLocalDate("2024-01-15");
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(0); // January is 0
    expect(date.getDate()).toBe(15);
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
  });

  it("creates date from ISO string and normalizes to midnight", () => {
    const date = createLocalDate("2024-01-15T10:30:00");
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(15);
    expect(date.getHours()).toBe(0);
  });
});

describe("formatToDateString", () => {
  it("formats Date object to YYYY-MM-DD string", () => {
    const date = new Date(2024, 0, 15); // January 15, 2024
    expect(formatToDateString(date)).toBe("2024-01-15");
  });

  it("pads single-digit months and days", () => {
    const date = new Date(2024, 5, 5); // June 5, 2024
    expect(formatToDateString(date)).toBe("2024-06-05");
  });
});

describe("getCurrentBusinessDate", () => {
  it("returns same date for weekday", () => {
    // Wednesday
    const wednesday = new Date(2024, 0, 17, 10, 30);
    const result = getCurrentBusinessDate(wednesday);
    expect(result.getDay()).toBe(3); // Wednesday
    expect(result.getDate()).toBe(17);
  });

  it("moves Saturday to Monday", () => {
    const saturday = new Date(2024, 0, 20, 10, 30);
    const result = getCurrentBusinessDate(saturday);
    expect(result.getDay()).toBe(1); // Monday
    expect(result.getDate()).toBe(22);
  });

  it("moves Sunday to Monday", () => {
    const sunday = new Date(2024, 0, 21, 10, 30);
    const result = getCurrentBusinessDate(sunday);
    expect(result.getDay()).toBe(1); // Monday
    expect(result.getDate()).toBe(22);
  });

  it("preserves time components", () => {
    const friday = new Date(2024, 0, 19, 14, 45, 30);
    const result = getCurrentBusinessDate(friday);
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(45);
  });
});

describe("addBusinessDays", () => {
  it("adds business days correctly skipping weekends", () => {
    // Thursday Jan 18, 2024 + 1 business day = Friday Jan 19
    const thursday = new Date(2024, 0, 18);
    const result = addBusinessDays(thursday, 1);
    expect(result.getDate()).toBe(19);
    expect(result.getDay()).toBe(5); // Friday
  });

  it("skips weekends when adding days", () => {
    // Friday Jan 19, 2024 + 1 business day = Monday Jan 22
    const friday = new Date(2024, 0, 19);
    const result = addBusinessDays(friday, 1);
    expect(result.getDate()).toBe(22);
    expect(result.getDay()).toBe(1); // Monday
  });

  it("handles adding 0 days on a weekday", () => {
    const wednesday = new Date(2024, 0, 17);
    const result = addBusinessDays(wednesday, 0);
    expect(result.getDate()).toBe(17);
  });

  it("handles adding 0 days on Saturday (moves to Monday)", () => {
    const saturday = new Date(2024, 0, 20);
    const result = addBusinessDays(saturday, 0);
    expect(result.getDay()).toBe(1); // Monday
    expect(result.getDate()).toBe(22);
  });

  it("handles adding 0 days on Sunday (moves to Monday)", () => {
    const sunday = new Date(2024, 0, 21);
    const result = addBusinessDays(sunday, 0);
    expect(result.getDay()).toBe(1); // Monday
    expect(result.getDate()).toBe(22);
  });

  it("handles negative business days", () => {
    // Monday Jan 22, 2024 - 1 business day = Friday Jan 19
    const monday = new Date(2024, 0, 22);
    const result = addBusinessDays(monday, -1);
    expect(result.getDate()).toBe(19);
    expect(result.getDay()).toBe(5); // Friday
  });

  it("handles multiple business days spanning weeks", () => {
    // Monday Jan 15, 2024 + 10 business days = Friday Jan 26
    const monday = new Date(2024, 0, 15);
    const result = addBusinessDays(monday, 10);
    expect(result.getDate()).toBe(29);
    expect(result.getDay()).toBe(1); // Monday
  });
});

describe("getBusinessDaysBetween", () => {
  it("returns 0 for same day", () => {
    const date = new Date(2024, 0, 15);
    expect(getBusinessDaysBetween(date, date)).toBe(0);
  });

  it("counts business days between two dates", () => {
    // Monday Jan 15 to Friday Jan 19 = 4 business days
    const start = new Date(2024, 0, 15);
    const end = new Date(2024, 0, 19);
    expect(getBusinessDaysBetween(start, end)).toBe(4);
  });

  it("excludes weekends", () => {
    // Friday Jan 19 to Monday Jan 22 = 1 business day (Monday only)
    const start = new Date(2024, 0, 19);
    const end = new Date(2024, 0, 22);
    expect(getBusinessDaysBetween(start, end)).toBe(1);
  });

  it("counts full week correctly (5 business days)", () => {
    // Monday Jan 15 to Monday Jan 22 = 5 business days
    const start = new Date(2024, 0, 15);
    const end = new Date(2024, 0, 22);
    expect(getBusinessDaysBetween(start, end)).toBe(5);
  });
});

describe("calculatePhaseDates", () => {
  const makeTask = (startdate: string, duration: number): TaskView => ({
    task_id: 1,
    phase_id: 1,
    task_title: "Test Task",
    task_startdate: startdate,
    task_duration: duration,
    task_status: "active",
    task_description: "",
    users: [],
  });

  const makeMaterial = (duedate: string): MaterialView => ({
    material_id: 1,
    phase_id: 1,
    material_title: "Test Material",
    material_duedate: duedate,
    material_status: "active",
    material_description: "",
    users: [],
  });

  it("calculates correct range with tasks only", () => {
    const tasks = [
      makeTask("2024-01-15", 5), // Mon Jan 15 + 5 biz days = Mon Jan 22
      makeTask("2024-01-10", 3), // Wed Jan 10 + 3 biz days = Mon Jan 15
    ];
    const result = calculatePhaseDates(tasks, []);
    expect(result.startDate).toBe("2024-01-10");
    expect(result.endDate).toBe("2024-01-22");
  });

  it("calculates correct range with materials only", () => {
    const materials = [makeMaterial("2024-02-01"), makeMaterial("2024-03-15")];
    const result = calculatePhaseDates([], materials);
    expect(result.startDate).toBe("2024-02-01");
    expect(result.endDate).toBe("2024-03-15");
  });

  it("extends endDate when material due date is beyond last task", () => {
    const tasks = [makeTask("2024-01-15", 3)];
    const materials = [makeMaterial("2024-06-01")];
    const result = calculatePhaseDates(tasks, materials);
    expect(result.startDate).toBe("2024-01-15");
    expect(result.endDate).toBe("2024-06-01");
  });

  it("handles single task and single material", () => {
    const tasks = [makeTask("2024-02-05", 1)]; // Mon Feb 5 + 1 biz day = Tue Feb 6
    const materials = [makeMaterial("2024-02-07")];
    const result = calculatePhaseDates(tasks, materials);
    expect(result.startDate).toBe("2024-02-05");
    expect(result.endDate).toBe("2024-02-07");
  });

  it("uses material as startDate when earlier than all tasks", () => {
    const tasks = [makeTask("2024-03-01", 2)];
    const materials = [makeMaterial("2024-01-01")];
    const result = calculatePhaseDates(tasks, materials);
    expect(result.startDate).toBe("2024-01-01");
  });
});
