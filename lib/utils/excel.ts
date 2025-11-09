import * as XLSX from 'xlsx';
import {
  Employee,
  ShiftSlot,
  Assignment,
  WeeklySchedule,
  DayOfWeek,
} from '@/lib/types';

interface ExportOptions {
  schedule: WeeklySchedule;
  employees: Employee[];
  shiftSlots: ShiftSlot[];
  currentEmployeeId?: string; // For highlighting
}

/**
 * Export schedule to Excel file with employee highlighting
 */
export function exportScheduleToExcel(options: ExportOptions): void {
  const { schedule, employees, shiftSlots, currentEmployeeId } = options;

  // Group shifts by day
  const dayOrder: DayOfWeek[] = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Create worksheet data
  const wsData: any[][] = [];

  // Header row
  const header = ['שעה', ...dayOrder];
  wsData.push(header);

  // Get unique time slots
  const timeSlots = new Set<string>();
  shiftSlots.forEach((slot) => {
    timeSlots.add(`${slot.startTime}-${slot.endTime}`);
  });

  const sortedTimes = Array.from(timeSlots).sort();

  // Build grid
  sortedTimes.forEach((timeSlot) => {
    const row: any[] = [timeSlot];

    dayOrder.forEach((day) => {
      // Find shift for this day and time
      const slot = shiftSlots.find(
        (s) => s.day === day && `${s.startTime}-${s.endTime}` === timeSlot
      );

      if (slot) {
        const assignment = schedule.assignments.find((a) => a.shiftSlotId === slot.id);
        if (assignment) {
          const employee = employees.find((e) => e.id === assignment.employeeId);
          row.push(employee?.name || '');
        } else {
          row.push('');
        }
      } else {
        row.push('');
      }
    });

    wsData.push(row);
  });

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // Time column
    ...dayOrder.map(() => ({ wch: 20 })), // Day columns
  ];

  // Apply styling (basic - XLSX has limited styling in free version)
  // We'll highlight the current employee's cells in the data

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'סידור');

  // Create employee-specific sheets
  employees.forEach((employee) => {
    const empWsData: any[][] = [];
    empWsData.push(['שעה', ...dayOrder]);

    sortedTimes.forEach((timeSlot) => {
      const row: any[] = [timeSlot];

      dayOrder.forEach((day) => {
        const slot = shiftSlots.find(
          (s) => s.day === day && `${s.startTime}-${s.endTime}` === timeSlot
        );

        if (slot) {
          const assignment = schedule.assignments.find(
            (a) => a.shiftSlotId === slot.id && a.employeeId === employee.id
          );
          row.push(assignment ? employee.name : '');
        } else {
          row.push('');
        }
      });

      empWsData.push(row);
    });

    const empWs = XLSX.utils.aoa_to_sheet(empWsData);
    empWs['!cols'] = [{ wch: 15 }, ...dayOrder.map(() => ({ wch: 20 }))];

    XLSX.utils.book_append_sheet(wb, empWs, employee.name.substring(0, 31)); // Excel sheet name limit
  });

  // Generate Excel file
  const fileName = `schedule-${schedule.week}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Export employees to Excel
 */
export function exportEmployeesToExcel(employees: Employee[]): void {
  const wsData: any[][] = [
    ['שם', 'סוג', 'מינימום משמרות', 'צבע'],
  ];

  employees.forEach((emp) => {
    wsData.push([
      emp.name,
      emp.type,
      emp.contractMinShifts,
      emp.color || '',
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 20 }, // Name
    { wch: 15 }, // Type
    { wch: 15 }, // Min shifts
    { wch: 10 }, // Color
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'עובדים');
  XLSX.writeFile(wb, 'employees.xlsx');
}

/**
 * Import employees from Excel
 */
export function importEmployeesFromExcel(file: File): Promise<Employee[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        const employees: Employee[] = jsonData.map((row: any, index) => ({
          id: `emp-${Date.now()}-${index}`,
          name: row['שם'] || row['name'] || '',
          type: row['סוג'] || row['type'] || 'עובד רגיל',
          contractMinShifts: Number(row['מינימום משמרות'] || row['contractMinShifts']) || 0,
          color: row['צבע'] || row['color'] || generateRandomColor(),
        }));

        resolve(employees);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generate random color for employee
 */
export function generateRandomColor(): string {
  const colors = [
    '#10b981', // green
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}
