import { Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Course } from '@/types';
import { getGradeLevel } from '@/utils/gpaCalculator';

interface RecentCoursesProps {
  courses: Course[];
}

export function RecentCourses({ courses }: RecentCoursesProps) {
  const recentCourses = [...courses]
    .sort((a, b) => b.importedAt - a.importedAt)
    .slice(0, 5);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 80) return 'text-blue-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (recentCourses.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">最近课程</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <p>暂无课程数据</p>
          <p className="text-sm mt-1">导入成绩后将显示课程列表</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">最近课程</h3>
        <Link
          to="/courses"
          className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 font-medium"
        >
          查看全部 <ChevronRight size={16} />
        </Link>
      </div>
      <div className="space-y-3">
        {recentCourses.map((course) => (
          <div
            key={course.id}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                <span className="text-sm font-bold text-primary-600">
                  {course.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{course.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={12} />
                    {course.semester}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${course.type === 'degree' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                    {course.type === 'degree' ? '学位课' : '非学位课'}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-bold ${getScoreColor(course.score)}`}>
                {course.score}分
              </p>
              <p className="text-xs text-gray-400">
                {getGradeLevel(course.score)} · {course.gradePoint}绩点
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
