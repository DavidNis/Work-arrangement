import {
  Employee,
  ShiftSlot,
  Availability,
  Assignment,
  WeeklySchedule,
  canWorkShiftType,
  getHoursBetween,
} from '@/lib/types';

interface SchedulerOptions {
  employees: Employee[];
  shiftSlots: ShiftSlot[];
  availabilities: Availability[];
  week: string;
  startDate: Date;
  endDate: Date;
}

interface EmployeeShiftCount {
  [employeeId: string]: number;
}

interface ShiftTime {
  day: string;
  startTime: string;
  endTime: string;
}

/**
 * AI-powered shift scheduler using constraint satisfaction
 * Respects:
 * - Employee type capabilities
 * - 8-hour minimum gap between shifts
 * - Contract minimum shifts
 * - Preferences with random selection for conflicts
 */
export class ShiftScheduler {
  private employees: Employee[];
  private shiftSlots: ShiftSlot[];
  private availabilities: Availability[];
  private assignments: Assignment[];
  private employeeShiftCounts: EmployeeShiftCount;
  private week: string;
  private startDate: Date;
  private endDate: Date;

  constructor(options: SchedulerOptions) {
    this.employees = options.employees;
    this.shiftSlots = options.shiftSlots;
    this.availabilities = options.availabilities;
    this.week = options.week;
    this.startDate = options.startDate;
    this.endDate = options.endDate;
    this.assignments = [];
    this.employeeShiftCounts = {};

    // Initialize shift counts
    this.employees.forEach((emp) => {
      this.employeeShiftCounts[emp.id] = 0;
    });
  }

  /**
   * Generate the schedule
   */
  generateSchedule(): WeeklySchedule {
    // Sort shifts by day and time for logical assignment order
    const sortedSlots = this.sortShiftSlots();

    // Assign shifts
    sortedSlots.forEach((slot) => {
      this.assignShiftSlot(slot);
    });

    // Try to fill minimum contract requirements
    this.fillMinimumShifts();

    return {
      week: this.week,
      assignments: this.assignments,
      startDate: this.startDate,
      endDate: this.endDate,
    };
  }

  /**
   * Sort shift slots by day and start time
   */
  private sortShiftSlots(): ShiftSlot[] {
    const dayOrder = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

    return [...this.shiftSlots].sort((a, b) => {
      const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;

      return a.startTime.localeCompare(b.startTime);
    });
  }

  /**
   * Assign a single shift slot to an employee
   */
  private assignShiftSlot(slot: ShiftSlot): void {
    // Get eligible employees
    const eligible = this.getEligibleEmployees(slot);

    if (eligible.length === 0) {
      console.warn(`No eligible employees for shift ${slot.id}`);
      return;
    }

    // Categorize by preference
    const preferred = eligible.filter((e) => e.preference === 'preferred');
    const available = eligible.filter((e) => e.preference === 'available');

    // Pick from preferred first, then available
    let selectedEmployee: Employee | null = null;

    if (preferred.length > 0) {
      selectedEmployee = this.selectRandomEmployee(
        preferred.map((e) => e.employee)
      );
    } else if (available.length > 0) {
      selectedEmployee = this.selectRandomEmployee(
        available.map((e) => e.employee)
      );
    }

    if (selectedEmployee) {
      this.createAssignment(selectedEmployee.id, slot.id);
    }
  }

  /**
   * Get employees eligible for a shift slot
   */
  private getEligibleEmployees(
    slot: ShiftSlot
  ): Array<{ employee: Employee; preference: 'preferred' | 'available' }> {
    const result: Array<{ employee: Employee; preference: 'preferred' | 'available' }> = [];

    for (const employee of this.employees) {
      // Check if employee type can handle shift type
      if (!canWorkShiftType(employee.type, slot.type)) {
        continue;
      }

      // Check availability
      const availability = this.availabilities.find(
        (av) => av.employeeId === employee.id && av.shiftSlotId === slot.id
      );

      if (!availability || availability.preference === 'unavailable') {
        continue;
      }

      // Check 8-hour gap constraint
      if (!this.meetsMinimumGap(employee.id, slot)) {
        continue;
      }

      result.push({
        employee,
        preference: availability.preference,
      });
    }

    return result;
  }

  /**
   * Check if assigning this shift maintains 8-hour minimum gap
   */
  private meetsMinimumGap(employeeId: string, newSlot: ShiftSlot): boolean {
    const MIN_GAP_HOURS = 8;

    // Get all current assignments for this employee
    const employeeAssignments = this.assignments.filter(
      (a) => a.employeeId === employeeId
    );

    for (const assignment of employeeAssignments) {
      const existingSlot = this.shiftSlots.find((s) => s.id === assignment.shiftSlotId);
      if (!existingSlot) continue;

      // If same day, check time gap
      if (existingSlot.day === newSlot.day) {
        const gap = this.calculateTimeGap(existingSlot, newSlot);
        if (gap < MIN_GAP_HOURS) {
          return false;
        }
      }

      // Check adjacent days (end of one day to start of next)
      const dayOrder = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
      const existingDayIndex = dayOrder.indexOf(existingSlot.day);
      const newDayIndex = dayOrder.indexOf(newSlot.day);

      if (Math.abs(existingDayIndex - newDayIndex) === 1) {
        const gap = this.calculateCrossDayGap(existingSlot, newSlot, existingDayIndex < newDayIndex);
        if (gap < MIN_GAP_HOURS) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Calculate time gap between two shifts on the same day
   */
  private calculateTimeGap(slot1: ShiftSlot, slot2: ShiftSlot): number {
    const end1 = this.timeToMinutes(slot1.endTime);
    const start1 = this.timeToMinutes(slot1.startTime);
    const end2 = this.timeToMinutes(slot2.endTime);
    const start2 = this.timeToMinutes(slot2.startTime);

    // Return the gap between shifts
    if (end1 <= start2) {
      return (start2 - end1) / 60;
    } else if (end2 <= start1) {
      return (start1 - end2) / 60;
    }

    // Overlapping shifts - not allowed
    return 0;
  }

  /**
   * Calculate gap between shifts across days
   */
  private calculateCrossDayGap(
    slot1: ShiftSlot,
    slot2: ShiftSlot,
    slot1IsEarlier: boolean
  ): number {
    const MINUTES_IN_DAY = 24 * 60;

    if (slot1IsEarlier) {
      // Gap from end of slot1 to start of slot2
      const end1 = this.timeToMinutes(slot1.endTime);
      const start2 = this.timeToMinutes(slot2.startTime);
      return (MINUTES_IN_DAY - end1 + start2) / 60;
    } else {
      // Gap from end of slot2 to start of slot1
      const end2 = this.timeToMinutes(slot2.endTime);
      const start1 = this.timeToMinutes(slot1.startTime);
      return (MINUTES_IN_DAY - end2 + start1) / 60;
    }
  }

  /**
   * Convert time string to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Randomly select an employee from a list
   */
  private selectRandomEmployee(employees: Employee[]): Employee | null {
    if (employees.length === 0) return null;
    const index = Math.floor(Math.random() * employees.length);
    return employees[index];
  }

  /**
   * Create an assignment
   */
  private createAssignment(employeeId: string, shiftSlotId: string): void {
    const assignment: Assignment = {
      id: `${this.week}-${shiftSlotId}-${employeeId}`,
      employeeId,
      shiftSlotId,
      week: this.week,
    };

    this.assignments.push(assignment);
    this.employeeShiftCounts[employeeId]++;
  }

  /**
   * Try to fill minimum contract shifts for employees who are under
   */
  private fillMinimumShifts(): void {
    const underMinimum = this.employees.filter(
      (emp) => this.employeeShiftCounts[emp.id] < emp.contractMinShifts
    );

    for (const employee of underMinimum) {
      const needed = employee.contractMinShifts - this.employeeShiftCounts[employee.id];

      // Find unassigned shifts this employee can work
      const unassignedSlots = this.shiftSlots.filter((slot) => {
        const isAssigned = this.assignments.some((a) => a.shiftSlotId === slot.id);
        return !isAssigned;
      });

      let assigned = 0;
      for (const slot of unassignedSlots) {
        if (assigned >= needed) break;

        if (
          canWorkShiftType(employee.type, slot.type) &&
          this.meetsMinimumGap(employee.id, slot)
        ) {
          // Check availability - allow both preferred and available
          const availability = this.availabilities.find(
            (av) => av.employeeId === employee.id && av.shiftSlotId === slot.id
          );

          if (availability && availability.preference !== 'unavailable') {
            this.createAssignment(employee.id, slot.id);
            assigned++;
          }
        }
      }
    }
  }
}

/**
 * Generate a schedule for a week
 */
export function generateWeeklySchedule(options: SchedulerOptions): WeeklySchedule {
  const scheduler = new ShiftScheduler(options);
  return scheduler.generateSchedule();
}
