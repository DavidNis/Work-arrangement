'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/stores/useStore';
import { DayOfWeek } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function AvailabilityManager() {
  const { employees, shiftSlots, availabilities, setAvailability } = useStore();

  const daysOfWeek: DayOfWeek[] = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  // Group shifts by day and time
  const shiftsByTime = useMemo(() => {
    const times = new Set<string>();
    shiftSlots.forEach((slot) => {
      times.add(`${slot.startTime}-${slot.endTime}`);
    });

    const sortedTimes = Array.from(times).sort();

    const grid: {
      [time: string]: {
        [day in DayOfWeek]?: string; // slot ID
      };
    } = {};

    sortedTimes.forEach((time) => {
      grid[time] = {};
      daysOfWeek.forEach((day) => {
        const slot = shiftSlots.find(
          (s) => s.day === day && `${s.startTime}-${s.endTime}` === time
        );
        if (slot) {
          grid[time][day] = slot.id;
        }
      });
    });

    return { grid, times: sortedTimes };
  }, [shiftSlots, daysOfWeek]);

  const getAvailabilityStatus = (employeeId: string, slotId: string) => {
    const availability = availabilities.find(
      (av) => av.employeeId === employeeId && av.shiftSlotId === slotId
    );
    return availability?.preference || 'unavailable';
  };

  const handleCellClick = (employeeId: string, slotId: string) => {
    const current = getAvailabilityStatus(employeeId, slotId);

    let next: 'preferred' | 'available' | 'unavailable';
    if (current === 'unavailable') {
      next = 'available';
    } else if (current === 'available') {
      next = 'preferred';
    } else {
      next = 'unavailable';
    }

    setAvailability({
      employeeId,
      shiftSlotId: slotId,
      preference: next,
    });
  };

  const getCellColor = (status: string) => {
    switch (status) {
      case 'preferred':
        return 'bg-green-500 text-white hover:bg-green-600';
      case 'available':
        return 'bg-yellow-300 text-gray-900 hover:bg-yellow-400';
      case 'unavailable':
        return 'bg-gray-200 text-gray-600 hover:bg-gray-300';
      default:
        return 'bg-gray-100 hover:bg-gray-200';
    }
  };

  const getCellText = (status: string) => {
    switch (status) {
      case 'preferred':
        return 'מועדף';
      case 'available':
        return 'זמין';
      case 'unavailable':
        return 'לא זמין';
      default:
        return '';
    }
  };

  if (employees.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>זמינות והעדפות</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">
            אנא הוסף עובדים למערכת כדי לנהל את הזמינות שלהם
          </p>
        </CardContent>
      </Card>
    );
  }

  if (shiftSlots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>זמינות והעדפות</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">
            אנא הוסף משמרות למערכת כדי לנהל זמינות
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>זמינות והעדפות</CardTitle>
        <div className="flex gap-4 mt-4 text-sm" dir="rtl">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded"></div>
            <span>מועדף</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-300 rounded"></div>
            <span>זמין</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <span>לא זמין</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2" dir="rtl">
          לחץ על התא כדי לשנות את הסטטוס
        </p>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          {employees.map((employee) => (
            <div key={employee.id} className="mb-8">
              <h3 className="text-lg font-semibold mb-3" dir="rtl">
                {employee.name} - {employee.type}
              </h3>

              <table className="w-full border-collapse border mb-4" dir="rtl">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 font-medium">שעות</th>
                    {daysOfWeek.map((day) => (
                      <th key={day} className="border p-2 font-medium min-w-[100px]">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shiftsByTime.times.map((time) => (
                    <tr key={time}>
                      <td className="border p-2 font-medium bg-gray-50 whitespace-nowrap">
                        {time}
                      </td>
                      {daysOfWeek.map((day) => {
                        const slotId = shiftsByTime.grid[time][day];
                        if (!slotId) {
                          return (
                            <td key={day} className="border p-2 bg-gray-50"></td>
                          );
                        }

                        const status = getAvailabilityStatus(employee.id, slotId);

                        return (
                          <td key={day} className="border p-0">
                            <button
                              className={`w-full h-full p-3 text-xs font-medium transition-colors ${getCellColor(
                                status
                              )}`}
                              onClick={() => handleCellClick(employee.id, slotId)}
                            >
                              {getCellText(status)}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
