import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Employee,
  ShiftSlot,
  Availability,
  Assignment,
  WeeklySchedule,
  DayOfWeek,
} from '@/lib/types';

interface StoreState {
  // Employees
  employees: Employee[];
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  // Shift Slots
  shiftSlots: ShiftSlot[];
  addShiftSlot: (slot: ShiftSlot) => void;
  updateShiftSlot: (id: string, slot: Partial<ShiftSlot>) => void;
  deleteShiftSlot: (id: string) => void;

  // Availability
  availabilities: Availability[];
  setAvailability: (availability: Availability) => void;
  getEmployeeAvailability: (employeeId: string) => Availability[];

  // Assignments & Schedules
  schedules: WeeklySchedule[];
  currentWeek: string;
  setCurrentWeek: (week: string) => void;
  addSchedule: (schedule: WeeklySchedule) => void;
  updateAssignment: (weekId: string, assignment: Assignment) => void;
  deleteAssignment: (weekId: string, assignmentId: string) => void;
  getCurrentSchedule: () => WeeklySchedule | undefined;

  // Utility
  resetStore: () => void;
}

const initialState = {
  employees: [],
  shiftSlots: [],
  availabilities: [],
  schedules: [],
  currentWeek: getISOWeek(new Date()),
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Employee methods
      addEmployee: (employee) =>
        set((state) => ({
          employees: [...state.employees, employee],
        })),

      updateEmployee: (id, employeeUpdate) =>
        set((state) => ({
          employees: state.employees.map((emp) =>
            emp.id === id ? { ...emp, ...employeeUpdate } : emp
          ),
        })),

      deleteEmployee: (id) =>
        set((state) => ({
          employees: state.employees.filter((emp) => emp.id !== id),
          availabilities: state.availabilities.filter((av) => av.employeeId !== id),
        })),

      // Shift Slot methods
      addShiftSlot: (slot) =>
        set((state) => ({
          shiftSlots: [...state.shiftSlots, slot],
        })),

      updateShiftSlot: (id, slotUpdate) =>
        set((state) => ({
          shiftSlots: state.shiftSlots.map((slot) =>
            slot.id === id ? { ...slot, ...slotUpdate } : slot
          ),
        })),

      deleteShiftSlot: (id) =>
        set((state) => ({
          shiftSlots: state.shiftSlots.filter((slot) => slot.id !== id),
          availabilities: state.availabilities.filter((av) => av.shiftSlotId !== id),
        })),

      // Availability methods
      setAvailability: (availability) =>
        set((state) => {
          const existing = state.availabilities.findIndex(
            (av) =>
              av.employeeId === availability.employeeId &&
              av.shiftSlotId === availability.shiftSlotId
          );

          if (existing >= 0) {
            const newAvailabilities = [...state.availabilities];
            newAvailabilities[existing] = availability;
            return { availabilities: newAvailabilities };
          }

          return {
            availabilities: [...state.availabilities, availability],
          };
        }),

      getEmployeeAvailability: (employeeId) => {
        return get().availabilities.filter((av) => av.employeeId === employeeId);
      },

      // Schedule methods
      setCurrentWeek: (week) => set({ currentWeek: week }),

      addSchedule: (schedule) =>
        set((state) => {
          const existingIndex = state.schedules.findIndex((s) => s.week === schedule.week);
          if (existingIndex >= 0) {
            const newSchedules = [...state.schedules];
            newSchedules[existingIndex] = schedule;
            return { schedules: newSchedules };
          }
          return { schedules: [...state.schedules, schedule] };
        }),

      updateAssignment: (weekId, assignment) =>
        set((state) => {
          const scheduleIndex = state.schedules.findIndex((s) => s.week === weekId);
          if (scheduleIndex === -1) return state;

          const schedule = state.schedules[scheduleIndex];
          const assignmentIndex = schedule.assignments.findIndex((a) => a.id === assignment.id);

          const newSchedules = [...state.schedules];
          if (assignmentIndex >= 0) {
            newSchedules[scheduleIndex] = {
              ...schedule,
              assignments: schedule.assignments.map((a) =>
                a.id === assignment.id ? assignment : a
              ),
            };
          } else {
            newSchedules[scheduleIndex] = {
              ...schedule,
              assignments: [...schedule.assignments, assignment],
            };
          }

          return { schedules: newSchedules };
        }),

      deleteAssignment: (weekId, assignmentId) =>
        set((state) => {
          const scheduleIndex = state.schedules.findIndex((s) => s.week === weekId);
          if (scheduleIndex === -1) return state;

          const newSchedules = [...state.schedules];
          newSchedules[scheduleIndex] = {
            ...newSchedules[scheduleIndex],
            assignments: newSchedules[scheduleIndex].assignments.filter(
              (a) => a.id !== assignmentId
            ),
          };

          return { schedules: newSchedules };
        }),

      getCurrentSchedule: () => {
        const currentWeek = get().currentWeek;
        return get().schedules.find((s) => s.week === currentWeek);
      },

      // Reset
      resetStore: () => set(initialState),
    }),
    {
      name: 'shift-scheduler-storage',
    }
  )
);

// Utility function to get ISO week
function getISOWeek(date: Date): string {
  const target = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return `${target.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}
