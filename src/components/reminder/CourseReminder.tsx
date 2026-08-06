import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useReminderStore } from '@/store/reminderStore';
import { useTimetableStore } from '@/store/timetableStore';
import { getCurrentWeek } from '@/utils/timetableParser';
import type { TimetableCourse } from '@/types';

export function CourseReminder({ course }: { course: TimetableCourse }) {
  const [showModal, setShowModal] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [showNotification, setShowNotification] = useState(false);
  
  const reminder = useReminderStore((state) => state.getReminderByCourseId(course.id));
  const addReminder = useReminderStore((state) => state.addReminder);
  const toggleReminder = useReminderStore((state) => state.toggleReminder);
  
  const startDate = useTimetableStore((state) => state.startDate);

  useEffect(() => {
    if (!reminder || !reminder.enabled || !startDate) return;

    const checkReminder = () => {
      const today = new Date();
      const dayOfWeek = today.getDay() || 7;
      const currentWeek = getCurrentWeek(startDate);

      if (course.dayOfWeek !== dayOfWeek || !course.weeks.includes(currentWeek)) {
        return;
      }

      const sectionTimeMap: Record<string, { hours: number; minutes: number }> = {
        '1-2节': { hours: 8, minutes: 0 },
        '3-4节': { hours: 10, minutes: 0 },
        '5-6节': { hours: 14, minutes: 0 },
        '7-8节': { hours: 16, minutes: 0 },
        '9-10节': { hours: 19, minutes: 0 },
        '11-12节': { hours: 21, minutes: 0 },
      };

      const startTime = sectionTimeMap[course.section];
      if (!startTime) return;

      const courseStartTime = new Date();
      courseStartTime.setHours(startTime.hours, startTime.minutes, 0, 0);

      const reminderTime = new Date(courseStartTime.getTime() - reminder.reminderMinutes * 60 * 1000);
      const now = new Date();

      const diffMinutes = Math.round((reminderTime.getTime() - now.getTime()) / (1000 * 60));

      if (diffMinutes >= 0 && diffMinutes <= 1) {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 10000);
      }
    };

    const interval = setInterval(checkReminder, 60000);
    checkReminder();

    return () => clearInterval(interval);
  }, [reminder, course, startDate]);

  const handleSave = () => {
    addReminder(course, reminderMinutes);
    setShowModal(false);
  };

  const handleToggle = () => {
    if (reminder) {
      toggleReminder(reminder.id);
    }
  };

  return (
    <>
      {reminder ? (
        <button
          onClick={handleToggle}
          className={`p-1.5 rounded-lg transition-colors ${
            reminder.enabled
              ? 'bg-green-50 text-green-600 hover:bg-green-100'
              : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
          }`}
          title={reminder.enabled ? '已开启提醒' : '提醒已关闭'}
        >
          {reminder.enabled ? <Bell size={16} /> : <BellOff size={16} />}
        </button>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          title="设置提醒"
        >
          <Bell size={16} />
        </button>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">设置课程提醒</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-900">{course.name}</p>
                <p className="text-sm text-gray-500">
                  {course.section} · {course.classroom}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  课前提醒时间
                </label>
                <div className="flex gap-2">
                  {[5, 10, 15, 30].map((minutes) => (
                    <button
                      key={minutes}
                      onClick={() => setReminderMinutes(minutes)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        reminderMinutes === minutes
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {minutes}分钟
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showNotification && (
        <div className="fixed top-4 right-4 bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-50 animate-slide-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Bell className="text-green-500" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">课程提醒</h4>
              <p className="text-sm text-gray-600">{course.name}</p>
              <p className="text-sm text-gray-500">
                {course.section} · {course.classroom} · 还有{reminder?.reminderMinutes}分钟开始
              </p>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function ReminderList() {
  const reminders = useReminderStore((state) => state.reminders);
  const toggleReminder = useReminderStore((state) => state.toggleReminder);
  const deleteReminder = useReminderStore((state) => state.deleteReminder);
  const clearAllReminders = useReminderStore((state) => state.clearAllReminders);

  const dayLabels = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  if (reminders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>暂无课程提醒</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">已设置的提醒</h4>
        <button
          onClick={clearAllReminders}
          className="text-sm text-red-500 hover:text-red-600"
        >
          清除全部
        </button>
      </div>
      
      <div className="space-y-2">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              reminder.enabled ? 'bg-green-50' : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleReminder(reminder.id)}
                className={`p-2 rounded-lg ${
                  reminder.enabled
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {reminder.enabled ? <Bell size={16} /> : <BellOff size={16} />}
              </button>
              <div>
                <p className="font-medium text-gray-900">{reminder.courseName}</p>
                <p className="text-sm text-gray-500">
                  {dayLabels[reminder.dayOfWeek]} {reminder.section} · {reminder.classroom}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                课前{reminder.reminderMinutes}分钟
              </span>
              <button
                onClick={() => deleteReminder(reminder.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
