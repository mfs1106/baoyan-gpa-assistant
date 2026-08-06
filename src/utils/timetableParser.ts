import type { TimetableCourse } from '@/types';

const DAY_MAP: Record<string, number> = {
  '星期一': 1,
  '星期二': 2,
  '星期三': 3,
  '星期四': 4,
  '星期五': 5,
  '星期六': 6,
  '星期日': 7,
  '周一': 1,
  '周二': 2,
  '周三': 3,
  '周四': 4,
  '周五': 5,
  '周六': 6,
  '周日': 7,
};

export function parseWeekRange(weekRange: string): number[] {
  const weeks: number[] = [];
  
  const rangeMatches = weekRange.match(/(\d+)[-~](\d+)周/g);
  if (rangeMatches) {
    for (const match of rangeMatches) {
      const [, start, end] = match.match(/(\d+)[-~](\d+)周/) || [];
      if (start && end) {
        const startWeek = parseInt(start, 10);
        const endWeek = parseInt(end, 10);
        for (let w = startWeek; w <= endWeek; w++) {
          if (!weeks.includes(w)) {
            weeks.push(w);
          }
        }
      }
    }
  }
  
  const singleWeekMatches = weekRange.match(/(\d+)周/g);
  if (singleWeekMatches) {
    for (const match of singleWeekMatches) {
      const week = parseInt(match.replace('周', ''), 10);
      if (!isNaN(week) && !weeks.includes(week)) {
        weeks.push(week);
      }
    }
  }
  
  return weeks.sort((a, b) => a - b);
}

export function parseExcelTimetable(data: any[][]): TimetableCourse[] {
  const courses: TimetableCourse[] = [];
  
  let dayHeaders: { dayOfWeek: number; colIndex: number }[] = [];
  let headerRowIndex = -1;
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] || '').trim();
      if (DAY_MAP[cell]) {
        if (headerRowIndex === -1) {
          headerRowIndex = i;
        }
        dayHeaders.push({ dayOfWeek: DAY_MAP[cell], colIndex: j });
      }
    }
  }
  
  if (dayHeaders.length === 0) {
    dayHeaders = [
      { dayOfWeek: 1, colIndex: 1 },
      { dayOfWeek: 2, colIndex: 2 },
      { dayOfWeek: 3, colIndex: 3 },
      { dayOfWeek: 4, colIndex: 4 },
      { dayOfWeek: 5, colIndex: 5 },
      { dayOfWeek: 6, colIndex: 6 },
      { dayOfWeek: 7, colIndex: 7 },
    ];
  }
  
  const sectionPattern = /(\d+[-~]\d+节)/;
  
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    let currentSection = '';
    
    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] || '').trim();
      if (cell && sectionPattern.test(cell)) {
        const match = cell.match(sectionPattern);
        if (match) {
          currentSection = match[1];
        }
      }
    }
    
    for (const header of dayHeaders) {
      const cell = String(row[header.colIndex] || '').trim();
      if (!cell || !currentSection) continue;
      
      const courseBlocks = cell.split('\n\n').filter(b => b.trim());
      
      for (const block of courseBlocks) {
        const lines = block.split('\n').filter(l => l.trim());
        if (lines.length < 2) continue;
        
        const firstLine = lines[0];
        const nameMatch = firstLine.match(/^[\d-]+-(.+?)\[\d+\]/);
        const name = nameMatch ? nameMatch[1].trim() : firstLine.trim();
        
        const secondLine = lines[1];
        const teacher = secondLine.trim();
        
        let weekRange = '';
        let classroom = '';
        
        if (lines.length >= 3) {
          const thirdLine = lines[2];
          const weekMatch = thirdLine.match(/(\d+[-~]\d+周|\d+周)/g);
          if (weekMatch) {
            weekRange = weekMatch.join(',');
          }
          
          const roomMatch = thirdLine.match(/[,，]([^,，]+)$/);
          if (roomMatch) {
            classroom = roomMatch[1].trim();
          }
        }
        
        const weeks = parseWeekRange(weekRange);
        
        courses.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          teacher,
          weekRange,
          weeks,
          dayOfWeek: header.dayOfWeek,
          section: currentSection,
          classroom,
        });
      }
    }
  }
  
  return courses;
}

export function getCurrentWeek(startDateStr: string): number {
  if (!startDateStr) return 0;
  
  const startDate = new Date(startDateStr);
  // 把 startDate 置为当天 00:00:00 避免时分秒干扰
  startDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 如果今天早于开学日期，返回 0 表示「未开学」
  if (today.getTime() < startDate.getTime()) {
    return 0;
  }

  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // 开学当天算第 1 周
  return Math.max(1, Math.floor(diffDays / 7) + 1);
}

export function getWeekStartDate(startDateStr: string, weekNumber: number): Date {
  if (!startDateStr) return new Date();
  
  const startDate = new Date(startDateStr);
  const weekStart = new Date(startDate);
  weekStart.setDate(startDate.getDate() + (weekNumber - 1) * 7);
  
  return weekStart;
}

export function getWeekEndDate(startDateStr: string, weekNumber: number): Date {
  const weekStart = getWeekStartDate(startDateStr, weekNumber);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  return weekEnd;
}

export function getDateWeekNumber(startDateStr: string, date: Date): number {
  if (!startDateStr) return 0;
  
  const startDate = new Date(startDateStr);
  const diffTime = Math.abs(date.getTime() - startDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, Math.ceil(diffDays / 7));
}

export function filterCoursesByWeek(courses: TimetableCourse[], weekNumber: number): TimetableCourse[] {
  return courses.filter(course => (course.weeks || []).includes(weekNumber));
}

export function parseWeekSchedule(courses: TimetableCourse[], weekNumber: number): TimetableCourse[][][] {
  const filteredCourses = filterCoursesByWeek(courses, weekNumber);
  
  const schedule: TimetableCourse[][][] = Array(8).fill(null).map(() => 
    Array(7).fill(null).map(() => [])
  );
  
  const sectionOrder: Record<string, number> = {
    '1-2节': 1,
    '3-4节': 2,
    '5-6节': 3,
    '7-8节': 4,
    '9-10节': 5,
    '11-12节': 6,
    '13-14节': 7,
  };
  
  for (const course of filteredCourses) {
    const sectionIndex = sectionOrder[course.section] || 0;
    const dayIndex = course.dayOfWeek - 1;
    
    if (sectionIndex > 0 && sectionIndex <= 7 && dayIndex >= 0 && dayIndex < 7) {
      schedule[sectionIndex][dayIndex].push(course);
    }
  }
  
  return schedule;
}

export function getTodaySchedule(courses: TimetableCourse[], startDateStr: string): TimetableCourse[] {
  const today = new Date();
  const dayOfWeek = today.getDay() || 7;
  const currentWeek = getCurrentWeek(startDateStr);
  
  return courses
    .filter(c => c.dayOfWeek === dayOfWeek && (c.weeks || []).includes(currentWeek))
    .sort((a, b) => {
      const sectionOrder: Record<string, number> = {
        '1-2节': 1,
        '3-4节': 2,
        '5-6节': 3,
        '7-8节': 4,
        '9-10节': 5,
        '11-12节': 6,
      };
      return (sectionOrder[a.section] || 0) - (sectionOrder[b.section] || 0);
    });
}

export function getDaySchedule(courses: TimetableCourse[], startDateStr: string, date: Date): TimetableCourse[] {
  const dayOfWeek = date.getDay() || 7;
  const weekNumber = getDateWeekNumber(startDateStr, date);
  
  return courses
    .filter(c => c.dayOfWeek === dayOfWeek && (c.weeks || []).includes(weekNumber))
    .sort((a, b) => {
      const sectionOrder: Record<string, number> = {
        '1-2节': 1,
        '3-4节': 2,
        '5-6节': 3,
        '7-8节': 4,
        '9-10节': 5,
        '11-12节': 6,
      };
      return (sectionOrder[a.section] || 0) - (sectionOrder[b.section] || 0);
    });
}
