// Employee Types
export type EmployeeType = 'אחמ"ש' | 'עובד בקרה' | 'עובד רגיל';

// Shift Types
export type ShiftType = 'אחמ"ש' | 'בקרה' | 'רגיל';

// Days of the week
export type DayOfWeek = 'ראשון' | 'שני' | 'שלישי' | 'רביעי' | 'חמישי' | 'שישי' | 'שבת';

// Employee interface
export interface Employee {
  id: string;
  name: string;
  type: EmployeeType;
  contractMinShifts: number; // Minimum shifts per week/month per contract
  color?: string; // For highlighting in schedule
}

// Shift time slot
export interface ShiftSlot {
  id: string;
  day: DayOfWeek;
  startTime: string; // Format: "HH:MM"
  endTime: string;
  type: ShiftType;
}

// Employee availability
export interface Availability {
  employeeId: string;
  shiftSlotId: string;
  preference: 'preferred' | 'available' | 'unavailable';
}

// Assigned shift
export interface Assignment {
  id: string;
  employeeId: string;
  shiftSlotId: string;
  week: string; // ISO week format: "2025-W01"
}

// Schedule for a week
export interface WeeklySchedule {
  week: string; // ISO week format: "2025-W01"
  assignments: Assignment[];
  startDate: Date;
  endDate: Date;
}

// Employee capabilities based on type
export const getEmployeeCapabilities = (type: EmployeeType): ShiftType[] => {
  switch (type) {
    case 'אחמ"ש':
      return ['אחמ"ש', 'בקרה', 'רגיל'];
    case 'עובד בקרה':
      return ['בקרה', 'רגיל'];
    case 'עובד רגיל':
      return ['רגיל'];
    default:
      return [];
  }
};

// Check if employee can work a shift type
export const canWorkShiftType = (employeeType: EmployeeType, shiftType: ShiftType): boolean => {
  const capabilities = getEmployeeCapabilities(employeeType);
  return capabilities.includes(shiftType);
};

// Calculate hours between two time strings
export const getHoursBetween = (time1: string, time2: string): number => {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  const minutes1 = h1 * 60 + m1;
  const minutes2 = h2 * 60 + m2;
  return Math.abs(minutes2 - minutes1) / 60;
};
