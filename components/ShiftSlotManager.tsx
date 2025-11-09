'use client';

import { useState } from 'react';
import { useStore } from '@/lib/stores/useStore';
import { ShiftSlot, ShiftType, DayOfWeek } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';

export function ShiftSlotManager() {
  const { shiftSlots, addShiftSlot, deleteShiftSlot } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    day: 'ראשון' as DayOfWeek,
    startTime: '08:00',
    endTime: '16:00',
    type: 'רגיל' as ShiftType,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newSlot: ShiftSlot = {
      id: `slot-${Date.now()}`,
      ...formData,
    };

    addShiftSlot(newSlot);
    setFormData({
      day: 'ראשון',
      startTime: '08:00',
      endTime: '16:00',
      type: 'רגיל',
    });
    setIsAdding(false);
  };

  const daysOfWeek: DayOfWeek[] = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl">ניהול משמרות</CardTitle>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="h-4 w-4 ml-2" />
            הוסף משמרת
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isAdding && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">יום</label>
                <select
                  value={formData.day}
                  onChange={(e) =>
                    setFormData({ ...formData, day: e.target.value as DayOfWeek })
                  }
                  className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 text-right"
                  dir="rtl"
                  required
                >
                  {daysOfWeek.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">שעת התחלה</label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">שעת סיום</label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">סוג משמרת</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as ShiftType })
                  }
                  className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 text-right"
                  dir="rtl"
                  required
                >
                  <option value="רגיל">רגיל</option>
                  <option value="בקרה">בקרה</option>
                  <option value='אחמ"ש'>אחמ"ש</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                  ביטול
                </Button>
                <Button type="submit">הוסף משמרת</Button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {shiftSlots.length === 0 ? (
            <p className="text-center text-gray-500 py-8">אין משמרות במערכת</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" dir="rtl">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-3 text-right font-medium">יום</th>
                    <th className="p-3 text-right font-medium">שעת התחלה</th>
                    <th className="p-3 text-right font-medium">שעת סיום</th>
                    <th className="p-3 text-right font-medium">סוג</th>
                    <th className="p-3 text-right font-medium">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {shiftSlots
                    .sort((a, b) => {
                      const dayOrder = daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day);
                      if (dayOrder !== 0) return dayOrder;
                      return a.startTime.localeCompare(b.startTime);
                    })
                    .map((slot) => (
                      <tr key={slot.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{slot.day}</td>
                        <td className="p-3">{slot.startTime}</td>
                        <td className="p-3">{slot.endTime}</td>
                        <td className="p-3">{slot.type}</td>
                        <td className="p-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm('האם אתה בטוח שברצונך למחוק משמרת זו?')) {
                                deleteShiftSlot(slot.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
