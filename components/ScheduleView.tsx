'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/stores/useStore';
import { DayOfWeek, ShiftSlot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateWeeklySchedule } from '@/lib/utils/scheduler';
import { exportScheduleToExcel } from '@/lib/utils/excel';
import { Download, Calendar, Sparkles } from 'lucide-react';

export function ScheduleView() {
  const {
    employees,
    shiftSlots,
    availabilities,
    schedules,
    currentWeek,
    addSchedule,
    getCurrentSchedule,
  } = useStore();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  const currentSchedule = getCurrentSchedule();

  const handleGenerateSchedule = () => {
    if (employees.length === 0) {
      alert('אנא הוסף עובדים למערכת');
      return;
    }

    if (shiftSlots.length === 0) {
      alert('אנא הוסף משמרות למערכת');
      return;
    }

    // Get week start and end dates
    const { startDate, endDate } = getWeekDates(currentWeek);

    const schedule = generateWeeklySchedule({
      employees,
      shiftSlots,
      availabilities,
      week: currentWeek,
      startDate,
      endDate,
    });

    addSchedule(schedule);
    alert('הסידור נוצר בהצלחה!');
  };

  const handleExport = () => {
    if (!currentSchedule) {
      alert('אין סידור להצגה');
      return;
    }

    exportScheduleToExcel({
      schedule: currentSchedule,
      employees,
      shiftSlots,
      currentEmployeeId: selectedEmployeeId,
    });
  };

  const daysOfWeek: DayOfWeek[] = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  // Group shifts by day and time
  const scheduleGrid = useMemo(() => {
    if (!currentSchedule) return null;

    // Get unique times
    const times = new Set<string>();
    shiftSlots.forEach((slot) => {
      times.add(`${slot.startTime}-${slot.endTime}`);
    });

    const sortedTimes = Array.from(times).sort();

    const grid: {
      [time: string]: {
        [day in DayOfWeek]?: {
          slot: ShiftSlot;
          employeeName?: string;
          employeeColor?: string;
          isCurrentEmployee?: boolean;
        };
      };
    } = {};

    sortedTimes.forEach((time) => {
      grid[time] = {};

      daysOfWeek.forEach((day) => {
        const slot = shiftSlots.find(
          (s) => s.day === day && `${s.startTime}-${s.endTime}` === time
        );

        if (slot) {
          const assignment = currentSchedule.assignments.find((a) => a.shiftSlotId === slot.id);
          if (assignment) {
            const employee = employees.find((e) => e.id === assignment.employeeId);
            grid[time][day] = {
              slot,
              employeeName: employee?.name,
              employeeColor: employee?.color,
              isCurrentEmployee: selectedEmployeeId
                ? employee?.id === selectedEmployeeId
                : false,
            };
          } else {
            grid[time][day] = { slot };
          }
        }
      });
    });

    return { grid, times: sortedTimes };
  }, [currentSchedule, shiftSlots, employees, selectedEmployeeId, daysOfWeek]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">סידור משמרות</CardTitle>
          <div className="flex gap-2">
            <Button onClick={handleGenerateSchedule} size="sm">
              <Sparkles className="h-4 w-4 ml-2" />
              צור סידור אוטומטי
            </Button>
            {currentSchedule && (
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="h-4 w-4 ml-2" />
                ייצא לאקסל
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-4 items-center mt-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">שבוע: {currentWeek}</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">הדגש עובד:</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="flex h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
              dir="rtl"
            >
              <option value="">הכל</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!currentSchedule ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>אין סידור זמין. לחץ על &quot;צור סידור אוטומטי&quot; כדי ליצור סידור חדש.</p>
          </div>
        ) : !scheduleGrid ? (
          <div className="text-center py-12 text-gray-500">
            <p>אין משמרות להצגה</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border" dir="rtl">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-3 font-medium">שעות</th>
                  {daysOfWeek.map((day) => (
                    <th key={day} className="border p-3 font-medium min-w-[120px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scheduleGrid.times.map((time) => (
                  <tr key={time}>
                    <td className="border p-3 font-medium bg-gray-50 whitespace-nowrap">
                      {time}
                    </td>
                    {daysOfWeek.map((day) => {
                      const cell = scheduleGrid.grid[time][day];
                      return (
                        <td
                          key={day}
                          className="border p-3"
                          style={{
                            backgroundColor: cell?.isCurrentEmployee
                              ? cell.employeeColor
                              : cell?.employeeName
                              ? `${cell.employeeColor}20`
                              : 'white',
                          }}
                        >
                          {cell?.employeeName && (
                            <div className="text-center">
                              <div className="font-medium">{cell.employeeName}</div>
                              <div className="text-xs text-gray-600 mt-1">{cell.slot.type}</div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getWeekDates(weekString: string): { startDate: Date; endDate: Date } {
  const [year, week] = weekString.split('-W').map(Number);

  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());

  const endDate = new Date(ISOweekStart);
  endDate.setDate(endDate.getDate() + 6);

  return { startDate: ISOweekStart, endDate };
}
