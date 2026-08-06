import type { Course } from '@/types';
import { calculateGPA } from './gpaCalculator';

export interface CourseImpact {
  course: Course;
  impactScore: number;
  impactPercent: number;
  weightedScore: number;
  weightedCredits: number;
}

export interface GPATrendData {
  label: string;
  gpa: number;
  totalCredits: number;
  courseCount: number;
}

export interface SemesterGPAResult {
  semester: string;
  gpa: number;
  totalWeightedScore: number;
  totalWeightedCredits: number;
  totalCredits: number;
  courseCount: number;
}

export function calculateCourseImpact(courses: Course[], targetCourse: Course): CourseImpact {
  const totalResult = calculateGPA(courses);
  
  const weightMultiplier = targetCourse.type === 'degree' ? 1.2 : 1;
  const weightedScore = targetCourse.gradePoint * targetCourse.credit * weightMultiplier;
  const weightedCredits = targetCourse.credit * weightMultiplier;
  
  const impactPercent = totalResult.totalWeightedCredits > 0 
    ? (weightedScore / totalResult.totalWeightedCredits) * 100 
    : 0;
  
  return {
    course: targetCourse,
    impactScore: weightedScore,
    impactPercent: Math.round(impactPercent * 100) / 100,
    weightedScore,
    weightedCredits,
  };
}

export function calculateAllCourseImpacts(courses: Course[]): CourseImpact[] {
  return courses.map(course => calculateCourseImpact(courses, course))
    .sort((a, b) => b.impactPercent - a.impactPercent);
}

export function calculateSemesterGPAs(courses: Course[]): SemesterGPAResult[] {
  const semesterMap = new Map<string, Course[]>();
  
  courses.forEach(course => {
    const semester = course.semester;
    if (!semesterMap.has(semester)) {
      semesterMap.set(semester, []);
    }
    semesterMap.get(semester)!.push(course);
  });
  
  const results: SemesterGPAResult[] = [];
  
  semesterMap.forEach((semesterCourses, semester) => {
    const result = calculateGPA(semesterCourses);
    results.push({
      semester,
      gpa: result.gpa,
      totalWeightedScore: result.totalWeightedScore,
      totalWeightedCredits: result.totalWeightedCredits,
      totalCredits: result.totalCredits,
      courseCount: semesterCourses.length,
    });
  });
  
  return results.sort((a, b) => a.semester.localeCompare(b.semester));
}

export function calculateSchoolYearGPAs(courses: Course[]): SemesterGPAResult[] {
  const yearMap = new Map<string, Course[]>();
  
  courses.forEach(course => {
    const match = course.semester.match(/^\d{4}-\d{4}/);
    if (match) {
      const year = match[0];
      if (!yearMap.has(year)) {
        yearMap.set(year, []);
      }
      yearMap.get(year)!.push(course);
    }
  });
  
  const results: SemesterGPAResult[] = [];
  
  yearMap.forEach((yearCourses, year) => {
    const result = calculateGPA(yearCourses);
    results.push({
      semester: year + '学年',
      gpa: result.gpa,
      totalWeightedScore: result.totalWeightedScore,
      totalWeightedCredits: result.totalWeightedCredits,
      totalCredits: result.totalCredits,
      courseCount: yearCourses.length,
    });
  });
  
  return results.sort((a, b) => a.semester.localeCompare(b.semester));
}

export function getGPATrendData(courses: Course[], type: 'semester' | 'year'): GPATrendData[] {
  const results = type === 'semester' 
    ? calculateSemesterGPAs(courses) 
    : calculateSchoolYearGPAs(courses);
  
  return results.map(r => ({
    label: r.semester,
    gpa: r.gpa,
    totalCredits: r.totalCredits,
    courseCount: r.courseCount,
  }));
}

export function calculateCumulativeGPAs(courses: Course[]): GPATrendData[] {
  const semesterResults = calculateSemesterGPAs(courses);
  
  let cumulativeWeightedScore = 0;
  let cumulativeWeightedCredits = 0;
  let cumulativeCredits = 0;
  let cumulativeCourses = 0;
  
  return semesterResults.map((semester) => {
    cumulativeWeightedScore += semester.totalWeightedScore;
    cumulativeWeightedCredits += semester.totalWeightedCredits;
    cumulativeCredits += semester.totalCredits;
    cumulativeCourses += semester.courseCount;
    
    const cumulativeGPA = cumulativeWeightedCredits > 0 
      ? cumulativeWeightedScore / cumulativeWeightedCredits 
      : 0;
    
    return {
      label: semester.semester,
      gpa: Math.round(cumulativeGPA * 1000) / 1000,
      totalCredits: cumulativeCredits,
      courseCount: cumulativeCourses,
    };
  });
}

export function getTopImpactCourses(courses: Course[], limit: number = 5): CourseImpact[] {
  return calculateAllCourseImpacts(courses).slice(0, limit);
}

export function getBottomImpactCourses(courses: Course[], limit: number = 5): CourseImpact[] {
  return calculateAllCourseImpacts(courses).slice(-limit).reverse();
}
