import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TimetableCourse, WeekSchedule } from '@/types';
import { parseWeekSchedule } from '@/utils/timetableParser';

interface TimetableStore {
  courses: TimetableCourse[];
  weekSchedule: WeekSchedule;
  semester: string;
  startDate: string;
  currentWeek: number;
  setCourses: (courses: TimetableCourse[], semester: string, startDate: string) => void;
  setStartDate: (startDate: string) => void;
  setCurrentWeek: (week: number) => void;
  clearTimetable: () => void;
}

export const useTimetableStore = create<TimetableStore>()(
  persist(
    (set) => ({
      courses: [],
      weekSchedule: Array(8).fill(null).map(() => 
        Array(7).fill(null).map(() => [])
      ),
      semester: '',
      startDate: '',
      currentWeek: 1,

      setCourses: (courses, semester, startDate) => {
        const weekSchedule = parseWeekSchedule(courses, 1);
        set({ courses, weekSchedule, semester, startDate, currentWeek: 1 });
      },

      setStartDate: (startDate) => {
        set({ startDate });
      },

      setCurrentWeek: (week) => {
        set({ currentWeek: week });
      },

      clearTimetable: () => {
        set({ 
          courses: [], 
          weekSchedule: Array(8).fill(null).map(() => 
            Array(7).fill(null).map(() => [])
          ),
          semester: '',
          startDate: '',
          currentWeek: 1,
        });
      },
    }),
    {
      name: 'timetable-storage',
      partialize: (state) => ({ 
        courses: state.courses, 
        semester: state.semester,
        startDate: state.startDate,
      }),
    }
  )
);
