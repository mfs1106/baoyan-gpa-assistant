import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TimetableCourse } from '@/types';

interface Reminder {
  id: string;
  courseId: string;
  courseName: string;
  dayOfWeek: number;
  section: string;
  classroom: string;
  reminderMinutes: number;
  enabled: boolean;
}

interface ReminderStore {
  reminders: Reminder[];
  addReminder: (course: TimetableCourse, reminderMinutes: number) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
  clearAllReminders: () => void;
  getReminderByCourseId: (courseId: string) => Reminder | undefined;
}

export const useReminderStore = create<ReminderStore>()(
  persist(
    (set, get) => ({
      reminders: [],

      addReminder: (course, reminderMinutes) => {
        const existing = get().getReminderByCourseId(course.id);
        if (existing) {
          get().updateReminder(existing.id, { reminderMinutes, enabled: true });
          return;
        }

        const newReminder: Reminder = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          courseId: course.id,
          courseName: course.name,
          dayOfWeek: course.dayOfWeek,
          section: course.section,
          classroom: course.classroom,
          reminderMinutes,
          enabled: true,
        };

        set((state) => ({ reminders: [...state.reminders, newReminder] }));
      },

      updateReminder: (id, updates) => {
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        }));
      },

      toggleReminder: (id) => {
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, enabled: !r.enabled } : r
          ),
        }));
      },

      deleteReminder: (id) => {
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id),
        }));
      },

      clearAllReminders: () => {
        set({ reminders: [] });
      },

      getReminderByCourseId: (courseId) => {
        return get().reminders.find((r) => r.courseId === courseId);
      },
    }),
    {
      name: 'reminder-storage',
      partialize: (state) => ({ reminders: state.reminders }),
    }
  )
);
