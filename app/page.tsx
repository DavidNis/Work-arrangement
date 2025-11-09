'use client';

import { useState } from 'react';
import { EmployeeManager } from '@/components/EmployeeManager';
import { ShiftSlotManager } from '@/components/ShiftSlotManager';
import { AvailabilityManager } from '@/components/AvailabilityManager';
import { ScheduleView } from '@/components/ScheduleView';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Clock, Settings } from 'lucide-react';

type Tab = 'schedule' | 'employees' | 'shifts' | 'availability';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('schedule');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">מערכת ניהול משמרות</h1>
          <p className="text-gray-600 mt-1">ניהול חכם של סידור עבודה באמצעות בינה מלאכותית</p>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 py-4">
            <Button
              variant={activeTab === 'schedule' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('schedule')}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              סידור
            </Button>
            <Button
              variant={activeTab === 'employees' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('employees')}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              עובדים
            </Button>
            <Button
              variant={activeTab === 'shifts' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('shifts')}
              className="gap-2"
            >
              <Clock className="h-4 w-4" />
              משמרות
            </Button>
            <Button
              variant={activeTab === 'availability' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('availability')}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              זמינות
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'schedule' && <ScheduleView />}
        {activeTab === 'employees' && <EmployeeManager />}
        {activeTab === 'shifts' && <ShiftSlotManager />}
        {activeTab === 'availability' && <AvailabilityManager />}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-600">
          <p>מערכת ניהול משמרות עם AI - נבנה בעזרת Next.js, TypeScript ו-Tailwind CSS</p>
        </div>
      </footer>
    </div>
  );
}
