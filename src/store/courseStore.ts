import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Course } from '@/types';
import { getGradePoint } from '@/utils/gpaCalculator';

interface CourseStore {
  courses: Course[];
  addCourse: (course: Omit<Course, 'id' | 'gradePoint' | 'importedAt'>) => void;
  addCourses: (courses: Omit<Course, 'id' | 'gradePoint' | 'importedAt'>[]) => void;
  updateCourse: (id: string, updates: Partial<Omit<Course, 'id' | 'importedAt'>>) => void;
  deleteCourse: (id: string) => void;
  clearAllCourses: () => void;
}

export const useCourseStore = create<CourseStore>()(
  persist(
    (set) => ({
      courses: [],

      addCourse: (course) => {
        const newCourse: Course = {
          ...course,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          gradePoint: getGradePoint(course.score),
          importedAt: Date.now(),
        };
        set((state) => ({ courses: [...state.courses, newCourse] }));
      },

      addCourses: (courses) => {
        const newCourses: Course[] = courses.map((course) => ({
          ...course,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          gradePoint: getGradePoint(course.score),
          importedAt: Date.now(),
        }));
        set({ courses: newCourses });
      },

      updateCourse: (id, updates) => {
        set((state) => ({
          courses: state.courses.map((course) =>
            course.id === id
              ? {
                  ...course,
                  ...updates,
                  gradePoint: updates.score !== undefined ? getGradePoint(updates.score) : course.gradePoint,
                }
              : course
          ),
        }));
      },

      deleteCourse: (id) => {
        set((state) => ({ courses: state.courses.filter((course) => course.id !== id) }));
      },

      clearAllCourses: () => {
        set({ courses: [] });
      },
    }),
    {
      name: 'gpa-calculator-storage',
      partialize: (state) => ({ courses: state.courses }),
    }
  )
);
