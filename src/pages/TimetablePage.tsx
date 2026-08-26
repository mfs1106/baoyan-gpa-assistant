import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight, Upload, Sun, Settings, RefreshCw } from 'lucide-react';
import { useTimetableStore } from '@/store/timetableStore';
import { getTodaySchedule, getDaySchedule, getCurrentWeek, getWeekStartDate, getWeekEndDate, parseWeekSchedule, filterCoursesByWeek } from '@/utils/timetableParser';
import { CourseReminder } from '@/components/reminder/CourseReminder';

export function TimetablePage() {
  const [view, setView] = useState<'week' | 'day'>('week');
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const navigate = useNavigate();
  const { courses, semester, startDate, currentWeek, setStartDate, setCurrentWeek } = useTimetableStore();

  const today = new Date();
  const computedCurrentWeek = getCurrentWeek(startDate);
  const weekSchedule = parseWeekSchedule(courses, currentWeek);
  const todaySchedule = getTodaySchedule(courses, startDate);

  const getDayLabel = (dayOfWeek: number) => {
    const days = ['', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
    return days[dayOfWeek] || '';
  };

  const getShortDayLabel = (dayOfWeek: number) => {
    const days = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    return days[dayOfWeek] || '';
  };

  const getCourseColor = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-green-500 to-green-600',
      'from-orange-500 to-orange-600',
      'from-pink-500 to-pink-600',
      'from-cyan-500 to-cyan-600',
      'from-rose-500 to-rose-600',
      'from-teal-500 to-teal-600',
    ];
    return colors[index % colors.length];
  };

  const sections = ['1-2节', '3-4节', '5-6节', '7-8节', '9-10节', '11-12节', '13-14节'];
  const periods = Array.from({ length: 14 }, (_, index) => index + 1);

  const getWeekDayDate = (day: number) => {
    if (!startDate) return null;
    const date = new Date(getWeekStartDate(startDate, currentWeek));
    date.setDate(date.getDate() + day - 1);
    return date;
  };

  const getSectionStart = (section: string) => {
    const match = section.match(/\d+/);
    return match ? Number(match[0]) : 1;
  };

  const getSelectedDaySchedule = () => {
    return getDaySchedule(courses, startDate, selectedDay);
  };

  const goToPrevDay = () => {
    const newDate = new Date(selectedDay);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDay(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDay);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDay(newDate);
  };

  const goToPrevWeek = () => {
    if (currentWeek > 1) {
      setCurrentWeek(currentWeek - 1);
    }
  };

  const goToNextWeek = () => {
    setCurrentWeek(currentWeek + 1);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(computedCurrentWeek || 1);
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  };

  const formatShortDate = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  };

  const handleStartDateSave = () => {
    if (tempStartDate) {
      setStartDate(tempStartDate);
      setShowStartDateModal(false);
    }
  };

  const getWeekDateRange = () => {
    if (!startDate) return '';
    const weekStart = getWeekStartDate(startDate, currentWeek);
    const weekEnd = getWeekEndDate(startDate, currentWeek);
    return `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`;
  };

  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen size={28} />
            <h2 className="text-2xl font-bold">我的课表</h2>
          </div>
          <p className="text-white/80">查看本周和今日课程安排</p>
          {semester && (
            <p className="text-white/60 text-sm mt-1">{semester}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center">
              <Calendar size={36} className="text-primary-500" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">暂无课表数据</h3>
            <p className="text-gray-500 mb-6">请先导入课表文件</p>
            
            <button
              onClick={() => navigate('/timetable-import')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all"
            >
              <Upload size={20} />
              导入课表
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen size={28} />
              <h2 className="text-2xl font-bold">我的课表</h2>
            </div>
            <p className="text-white/80">查看本周和今日课程安排</p>
            {semester && (
              <p className="text-white/60 text-sm mt-1">{semester}</p>
            )}
          </div>
          
          <button
            onClick={() => {
              setTempStartDate(startDate || '');
              setShowStartDateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-colors"
          >
            <Settings size={18} />
            开学日期
          </button>
        </div>
      </div>

      {startDate && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800">
              <Calendar size={18} />
              <span className="font-medium">开学日期：{startDate}</span>
              <span className="text-amber-600">
                · {computedCurrentWeek === 0 ? '尚未开学' : `当前是第 ${computedCurrentWeek} 周`}
              </span>
            </div>
            {computedCurrentWeek > 0 && computedCurrentWeek !== currentWeek && (
              <button
                onClick={goToCurrentWeek}
                className="flex items-center gap-1 px-3 py-1 bg-amber-200 text-amber-800 rounded-lg text-sm font-medium hover:bg-amber-300 transition-colors"
              >
                <RefreshCw size={14} />
                回到当前周
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 sm:mb-6">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setView('week')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                view === 'week'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar size={18} />
              周课表
            </button>
            <button
              onClick={() => setView('day')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                view === 'day'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock size={18} />
              日课表
            </button>
          </div>
          
          <button
            onClick={() => navigate('/timetable-import')}
            className="self-end sm:self-auto flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Upload size={18} />
            重新导入
          </button>
        </div>

        {view === 'week' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={goToPrevWeek}
                  disabled={currentWeek <= 1}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} />
                </button>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    第 {currentWeek} 周
                  </h3>
                  <p className="text-sm text-gray-500">
                    {startDate ? getWeekDateRange() : '请设置开学日期'}
                  </p>
                </div>
                <button
                  onClick={goToNextWeek}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              
              <button
                onClick={goToCurrentWeek}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  (computedCurrentWeek === 0 ? currentWeek === 1 : currentWeek === computedCurrentWeek)
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {computedCurrentWeek === 0 ? '开学第1周' : '本周'}
              </button>
            </div>

            {/* 手机端使用教务系统常见的节次网格，而不是横向滚动的大卡片。 */}
            <div className="md:hidden rounded-xl border border-slate-200 overflow-hidden bg-white">
              <div className="grid grid-cols-[34px_repeat(7,minmax(0,1fr))] border-b border-slate-200 bg-slate-50">
                <div className="border-r border-slate-200" />
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                  const weekDayDate = getWeekDayDate(day);
                  const isTodayCell = weekDayDate && isToday(weekDayDate);
                  return (
                    <div
                      key={day}
                      className={`min-w-0 py-2 text-center border-r last:border-r-0 border-slate-200 ${
                        isTodayCell ? 'bg-primary-50 text-primary-700' : 'text-slate-700'
                      }`}
                    >
                      <div className="text-[11px] leading-none text-slate-500">
                        {weekDayDate ? `${weekDayDate.getMonth() + 1}.${String(weekDayDate.getDate()).padStart(2, '0')}` : ''}
                      </div>
                      <div className="mt-1 text-sm font-semibold leading-none">{getShortDayLabel(day)}</div>
                    </div>
                  );
                })}
              </div>

              <div
                className="grid grid-cols-[34px_repeat(7,minmax(0,1fr))] relative"
                style={{ gridTemplateRows: 'repeat(14, minmax(42px, auto))' }}
              >
                {periods.map((period) => (
                  <div
                    key={`period-${period}`}
                    className="col-start-1 flex items-start justify-center pt-2 text-[11px] text-slate-400 border-r border-b border-slate-200 bg-slate-50"
                    style={{ gridRow: period }}
                  >
                    {period}
                  </div>
                ))}

                {periods.flatMap((period) => [1, 2, 3, 4, 5, 6, 7].map((day) => {
                  const weekDayDate = getWeekDayDate(day);
                  return (
                    <div
                      key={`cell-${period}-${day}`}
                      className={`border-r border-b border-slate-200 last:border-r-0 ${
                        weekDayDate && isToday(weekDayDate) ? 'bg-primary-50/40' : 'bg-white'
                      }`}
                      style={{ gridColumn: day + 1, gridRow: period }}
                    />
                  );
                }))}

                {filterCoursesByWeek(courses, currentWeek).map((course, index) => {
                  const start = getSectionStart(course.section);
                  return (
                    <div
                      key={course.id}
                      className={`z-10 m-0.5 rounded-md px-1 py-1 text-[10px] leading-tight shadow-sm overflow-hidden ${
                        index % 2 === 0
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-violet-100 text-violet-800'
                      }`}
                      style={{
                        gridColumn: course.dayOfWeek + 1,
                        gridRow: `${start} / span 2`,
                      }}
                      title={`${course.name}\n${course.teacher}\n${course.classroom}`}
                    >
                      <div className="font-semibold break-words">{course.name}</div>
                      {course.classroom && (
                        <div className="mt-0.5 opacity-75 break-all">{course.classroom}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                      节次
                    </th>
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                      const weekDayDate = startDate ? new Date(getWeekStartDate(startDate, currentWeek)) : null;
                      if (weekDayDate) {
                        weekDayDate.setDate(weekDayDate.getDate() + day - 1);
                      }
                      const isTodayCell = weekDayDate && isToday(weekDayDate);
                      
                      return (
                        <th
                          key={day}
                          className={`px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                            isTodayCell ? 'text-white' : 'text-gray-500'
                          }`}
                          style={{ backgroundColor: isTodayCell ? '#4F46E5' : '' }}
                        >
                          <div>{getShortDayLabel(day)}</div>
                          {weekDayDate && (
                            <div className="text-[10px] opacity-75 mt-1">
                              {formatShortDate(weekDayDate)}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sections.map((section, sectionIndex) => (
                    <tr key={section}>
                      <td className="px-3 py-4 bg-gray-50 text-sm font-medium text-gray-600">
                        {section}
                      </td>
                      {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                        const dayCourses = weekSchedule[sectionIndex + 1]?.[day - 1] || [];
                        const weekDayDate = startDate ? new Date(getWeekStartDate(startDate, currentWeek)) : null;
                        if (weekDayDate) {
                          weekDayDate.setDate(weekDayDate.getDate() + day - 1);
                        }
                        const isTodayCell = weekDayDate && isToday(weekDayDate);
                        
                        return (
                          <td
                            key={day}
                            className={`px-2 py-2 relative ${
                              isTodayCell ? 'bg-primary-50/50' : ''
                            }`}
                          >
                            {dayCourses.length > 0 ? (
                              <div className="space-y-1">
                                {dayCourses.map((course, courseIndex) => (
                                  <div
                                    key={course.id}
                                    className={`p-2 rounded-lg bg-gradient-to-r ${getCourseColor(courseIndex)} text-white text-xs hover:opacity-90 transition-opacity`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="font-medium truncate">{course.name}</div>
                                        <div className="flex items-center gap-1 mt-1 opacity-90">
                                          <User size={10} />
                                          <span className="truncate">{course.teacher}</span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-1 opacity-90">
                                          <MapPin size={10} />
                                          <span className="truncate">{course.classroom}</span>
                                        </div>
                                      </div>
                                      <CourseReminder course={course} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="h-full min-h-[60px]" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                本周共 {filterCoursesByWeek(courses, currentWeek).length} 门课
                {computedCurrentWeek === 0 && (
                  <span className="ml-2">· 当前尚未开学（开学日期：{startDate}）</span>
                )}
                {currentWeek !== computedCurrentWeek && computedCurrentWeek > 0 && (
                  <span className="ml-2">· 当前实际是第 {computedCurrentWeek} 周</span>
                )}
              </p>
            </div>
          </div>
        )}

        {view === 'day' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={goToPrevDay}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {formatDate(selectedDay)}
                  </h3>
                  <p className={`text-sm ${isToday(selectedDay) ? 'text-primary-600' : 'text-gray-500'}`}>
                    {isToday(selectedDay) ? '今天' : getDayLabel(selectedDay.getDay() || 7)}
                    {isToday(selectedDay) && todaySchedule.length > 0 && (
                      <span className="ml-2 text-green-600">· 今日有课</span>
                    )}
                    {isToday(selectedDay) && todaySchedule.length === 0 && (
                      <span className="ml-2 text-gray-400">· 今日无课</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={goToNextDay}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              
              <button
                onClick={() => setSelectedDay(today)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isToday(selectedDay)
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                今天
              </button>
            </div>

            <div className="space-y-4">
              {getSelectedDaySchedule().length > 0 ? (
                getSelectedDaySchedule().map((course, index) => (
                  <div
                    key={course.id}
                    className={`p-4 rounded-xl bg-gradient-to-r ${getCourseColor(index)} text-white`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-white/20 rounded text-xs font-medium">
                            {course.section}
                          </span>
                          {course.weekRange && (
                            <span className="px-2 py-1 bg-white/20 rounded text-xs">
                              {course.weekRange}
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg font-bold mt-2">{course.name}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm opacity-90">
                          <span className="flex items-center gap-1">
                            <User size={14} />
                            {course.teacher}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {course.classroom}
                          </span>
                        </div>
                      </div>
                      <CourseReminder course={course} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                    <Sun size={32} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500">当天没有课</p>
                  <p className="text-sm text-gray-400 mt-1">好好休息一下吧！</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showStartDateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">设置开学日期</h3>
              <button
                onClick={() => setShowStartDateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-500 mb-4">
              设置学期第一周周一的日期，系统将据此计算当前周次
            </p>
            <input
              type="date"
              value={tempStartDate}
              onChange={(e) => setTempStartDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowStartDateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleStartDateSave}
                disabled={!tempStartDate}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

