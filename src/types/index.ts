export interface Course {
  id: string;
  name: string;
  credit: number;
  type: 'degree' | 'non-degree';
  semester: string;
  score: number;
  gradePoint: number;
  importedAt: number;
}

export interface GPAResult {
  gpa: number;
  totalWeightedScore: number;
  totalWeightedCredits: number;
  degreeCourses: Course[];
  nonDegreeCourses: Course[];
  totalCredits: number;
  originalCount?: number;
}

export interface PredictInput {
  name: string;
  credit: number;
  type: 'degree' | 'non-degree';
  predictedScore: number;
}

export interface PredictResult {
  currentGPA: number;
  predictedGPA: number;
  change: number;
  predictedCourse: Course;
}

export interface ParsedCourse {
  name: string;
  credit: number;
  type: 'degree' | 'non-degree';
  semester: string;
  score: number;
}

export interface TimetableCourse {
  id: string;
  name: string;
  teacher: string;
  weekRange: string;
  weeks: number[];
  dayOfWeek: number;
  section: string;
  classroom: string;
}

export type WeekSchedule = TimetableCourse[][][];

export interface TimetableStore {
  courses: TimetableCourse[];
  weekSchedule: WeekSchedule;
  semester: string;
  startDate: string;
}
