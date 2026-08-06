import type { Course, GPAResult, PredictInput, PredictResult } from '@/types';

const GRADE_POINT_MAP: Array<{ min: number; max: number; point: number }> = [
  { min: 97, max: 100, point: 4.5 },
  { min: 93, max: 96, point: 4.3 },
  { min: 89, max: 92, point: 4.0 },
  { min: 85, max: 88, point: 3.8 },
  { min: 81, max: 84, point: 3.4 },
  { min: 77, max: 80, point: 3.0 },
  { min: 73, max: 76, point: 2.6 },
  { min: 69, max: 72, point: 2.2 },
  { min: 65, max: 68, point: 1.8 },
  { min: 60, max: 64, point: 1.2 },
  { min: 40, max: 59, point: 0 },
  { min: 0, max: 39, point: 0 },
];

export function getGradePoint(score: number): number {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const match = GRADE_POINT_MAP.find(
    (range) => normalizedScore >= range.min && normalizedScore <= range.max
  );
  return match?.point ?? 0;
}

export function getGradeLevel(score: number): string {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  if (normalizedScore >= 97) return 'A+';
  if (normalizedScore >= 93) return 'A';
  if (normalizedScore >= 89) return 'A-';
  if (normalizedScore >= 85) return 'B+';
  if (normalizedScore >= 81) return 'B';
  if (normalizedScore >= 77) return 'B-';
  if (normalizedScore >= 73) return 'C+';
  if (normalizedScore >= 69) return 'C';
  if (normalizedScore >= 65) return 'C-';
  if (normalizedScore >= 60) return 'D';
  if (normalizedScore >= 40) return 'F';
  return 'F-';
}

export function calculateGPA(courses: Course[]): GPAResult {
  if (courses.length === 0) {
    return {
      gpa: 0,
      totalWeightedScore: 0,
      totalWeightedCredits: 0,
      degreeCourses: [],
      nonDegreeCourses: [],
      totalCredits: 0,
    };
  }

  const degreeCourses = courses.filter((c) => c.type === 'degree');
  const nonDegreeCourses = courses.filter((c) => c.type === 'non-degree');

  let totalWeightedScore = 0;
  let totalWeightedCredits = 0;
  let totalCredits = 0;

  nonDegreeCourses.forEach((course) => {
    totalWeightedScore += course.gradePoint * course.credit;
    totalWeightedCredits += course.credit;
    totalCredits += course.credit;
  });

  degreeCourses.forEach((course) => {
    totalWeightedScore += course.gradePoint * course.credit * 1.2;
    totalWeightedCredits += course.credit * 1.2;
    totalCredits += course.credit;
  });

  const gpa = totalWeightedCredits > 0 ? totalWeightedScore / totalWeightedCredits : 0;

  return {
    gpa: Math.round(gpa * 1000) / 1000,
    totalWeightedScore,
    totalWeightedCredits,
    degreeCourses,
    nonDegreeCourses,
    totalCredits,
  };
}

export function calculateGPABysemester(courses: Course[], semester: string): GPAResult {
  const filteredCourses = courses.filter((c) => c.semester === semester);
  return calculateGPA(filteredCourses);
}

export function calculateGPAByschoolYear(courses: Course[], schoolYear: string): GPAResult {
  const filteredCourses = courses.filter((c) => c.semester.startsWith(schoolYear));
  return calculateGPA(filteredCourses);
}

export function getAvailableSemesters(courses: Course[]): string[] {
  const semesters = new Set<string>();
  courses.forEach((c) => semesters.add(c.semester));
  return Array.from(semesters).sort();
}

export function getAvailableSchoolYears(courses: Course[]): string[] {
  const years = new Set<string>();
  courses.forEach((c) => {
    const match = c.semester.match(/^\d{4}-\d{4}/);
    if (match) {
      years.add(match[0]);
    }
  });
  return Array.from(years).sort();
}

export function predictGPA(courses: Course[], predictInput: PredictInput): PredictResult {
  const currentResult = calculateGPA(courses);
  const predictedGradePoint = getGradePoint(predictInput.predictedScore);

  const predictedCourse: Course = {
    id: 'predicted',
    name: predictInput.name,
    credit: predictInput.credit,
    type: predictInput.type,
    semester: '预测课程',
    score: predictInput.predictedScore,
    gradePoint: predictedGradePoint,
    importedAt: Date.now(),
  };

  let newTotalWeightedScore = currentResult.totalWeightedScore;
  let newTotalWeightedCredits = currentResult.totalWeightedCredits;

  if (predictInput.type === 'degree') {
    newTotalWeightedScore += predictedGradePoint * predictInput.credit * 1.2;
    newTotalWeightedCredits += predictInput.credit * 1.2;
  } else {
    newTotalWeightedScore += predictedGradePoint * predictInput.credit;
    newTotalWeightedCredits += predictInput.credit;
  }

  const predictedGPA = newTotalWeightedCredits > 0 ? newTotalWeightedScore / newTotalWeightedCredits : 0;

  return {
    currentGPA: currentResult.gpa,
    predictedGPA: Math.round(predictedGPA * 1000) / 1000,
    change: Math.round((predictedGPA - currentResult.gpa) * 1000) / 1000,
    predictedCourse,
  };
}
