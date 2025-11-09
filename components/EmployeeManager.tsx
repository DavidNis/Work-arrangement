'use client';

import { useState } from 'react';
import { useStore } from '@/lib/stores/useStore';
import { Employee, EmployeeType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateRandomColor } from '@/lib/utils/excel';
import { Trash2, Edit2, Plus, Upload } from 'lucide-react';

export function EmployeeManager() {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'עובד רגיל' as EmployeeType,
    contractMinShifts: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      updateEmployee(editingId, formData);
      setEditingId(null);
    } else {
      const newEmployee: Employee = {
        id: `emp-${Date.now()}`,
        ...formData,
        color: generateRandomColor(),
      };
      addEmployee(newEmployee);
    }

    setFormData({
      name: '',
      type: 'עובד רגיל',
      contractMinShifts: 0,
    });
    setIsAdding(false);
  };

  const handleEdit = (employee: Employee) => {
    setFormData({
      name: employee.name,
      type: employee.type,
      contractMinShifts: employee.contractMinShifts,
    });
    setEditingId(employee.id);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      name: '',
      type: 'עובד רגיל',
      contractMinShifts: 0,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl">ניהול עובדים</CardTitle>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="h-4 w-4 ml-2" />
            הוסף עובד
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isAdding && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">שם העובד</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="הזן שם"
                  required
                  className="text-right"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">סוג עובד</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as EmployeeType })
                  }
                  className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 text-right"
                  dir="rtl"
                  required
                >
                  <option value="עובד רגיל">עובד רגיל</option>
                  <option value="עובד בקרה">עובד בקרה</option>
                  <option value='אחמ"ש'>אחמ"ש</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">מינימום משמרות</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.contractMinShifts}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contractMinShifts: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  required
                  className="text-right"
                  dir="rtl"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  ביטול
                </Button>
                <Button type="submit">{editingId ? 'עדכן' : 'הוסף'}</Button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {employees.length === 0 ? (
            <p className="text-center text-gray-500 py-8">אין עובדים במערכת</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" dir="rtl">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-3 text-right font-medium">שם</th>
                    <th className="p-3 text-right font-medium">סוג</th>
                    <th className="p-3 text-right font-medium">מינימום משמרות</th>
                    <th className="p-3 text-right font-medium">צבע</th>
                    <th className="p-3 text-right font-medium">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{employee.name}</td>
                      <td className="p-3">{employee.type}</td>
                      <td className="p-3">{employee.contractMinShifts}</td>
                      <td className="p-3">
                        <div
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: employee.color }}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(employee)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (
                                confirm(`האם אתה בטוח שברצונך למחוק את ${employee.name}?`)
                              ) {
                                deleteEmployee(employee.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
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
