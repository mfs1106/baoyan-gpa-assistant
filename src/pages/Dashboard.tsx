import { useState } from 'react';
import { BookOpen, CreditCard, GraduationCap, Upload, Calculator, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCourseStore } from '@/store/courseStore';
import { calculateGPA, calculateGPABysemester, calculateGPAByschoolYear, getAvailableSemesters, getAvailableSchoolYears } from '@/utils/gpaCalculator';
import { GPACard } from '@/components/dashboard/GPACard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { GradeDistribution } from '@/components/dashboard/GradeDistribution';
import { RecentCourses } from '@/components/dashboard/RecentCourses';

export function Dashboard() {
  const courses = useCourseStore((state) => state.courses);
  const gpaResult = calculateGPA(courses);
  const semesters = getAvailableSemesters(courses);
  const schoolYears = getAvailableSchoolYears(courses);
  
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>('');
  
  const semesterGPA = selectedSemester ? calculateGPABysemester(courses, selectedSemester) : null;
  const schoolYearGPA = selectedSchoolYear ? calculateGPAByschoolYear(courses, selectedSchoolYear) : null;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">保研绩点助手</h2>
        <p className="text-white/80 mb-6">绩点计算 · 保研排名 · 课表查询，一站式学业规划工具</p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/import"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-primary-600 rounded-xl font-medium hover:bg-gray-100 transition-colors shadow-lg"
          >
            <Upload size={18} />
            导入成绩
          </Link>
          <Link
            to="/predict"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition-colors"
          >
            <Calculator size={18} />
            预测成绩
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2">
          <GPACard gpa={gpaResult.gpa} />
        </div>
        <StatsCard
          icon={BookOpen}
          label="课程总数"
          value={courses.length}
          subValue={`学位课 ${gpaResult.degreeCourses.length} 门`}
          color="blue"
        />
        <StatsCard
          icon={CreditCard}
          label="总学分"
          value={gpaResult.totalCredits}
          subValue={`加权 ${gpaResult.totalWeightedCredits.toFixed(1)}`}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Calendar className="text-blue-500" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">学期GPA计算</h3>
              <p className="text-sm text-gray-500">选择学期查看该学期的平均绩点</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setSelectedSchoolYear('');
              }}
              className="w-full sm:flex-1 sm:min-w-[200px] px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-white"
            >
              <option value="">请选择学期</option>
              {semesters.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </div>
          {semesterGPA && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-600 mb-1">加权平均学分绩点</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-blue-600">{semesterGPA.gpa.toFixed(3)}</span>
                <span className="text-sm text-blue-400">/ 4.5</span>
              </div>
              <p className="text-xs text-blue-500 mt-2">共 {semesterGPA.degreeCourses.length + semesterGPA.nonDegreeCourses.length} 门课程，{semesterGPA.totalCredits} 学分</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Clock className="text-green-500" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">学年GPA计算</h3>
              <p className="text-sm text-gray-500">选择学年查看该学年的平均绩点</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedSchoolYear}
              onChange={(e) => {
                setSelectedSchoolYear(e.target.value);
                setSelectedSemester('');
              }}
              className="w-full sm:flex-1 sm:min-w-[200px] px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-white"
            >
              <option value="">请选择学年</option>
              {schoolYears.map((year) => (
                <option key={year} value={year}>
                  {year}学年
                </option>
              ))}
            </select>
          </div>
          {schoolYearGPA && (
            <div className="mt-4 p-4 bg-green-50 rounded-xl">
              <p className="text-sm text-green-600 mb-1">加权平均学分绩点</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-green-600">{schoolYearGPA.gpa.toFixed(3)}</span>
                <span className="text-sm text-green-400">/ 4.5</span>
              </div>
              <p className="text-xs text-green-500 mt-2">共 {schoolYearGPA.degreeCourses.length + schoolYearGPA.nonDegreeCourses.length} 门课程，{schoolYearGPA.totalCredits} 学分</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentCourses courses={courses} />
        </div>
        <div>
          <GradeDistribution courses={courses} />
        </div>
      </div>

      {courses.length === 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">欢迎使用保研绩点助手</h3>
          <p className="text-gray-500 mb-6">
            导入学校教务系统的Excel成绩表格，即可自动计算加权平均学分绩点、预测保研排名
          </p>
          <Link
            to="/import"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all"
          >
            <Upload size={20} />
            立即导入成绩
          </Link>
        </div>
      )}
    </div>
  );
}
