import { useState } from 'react';
import { Search, Edit3, Trash2, Plus, BookOpen, X, Save, Filter } from 'lucide-react';
import { useCourseStore } from '@/store/courseStore';
import { getGradeLevel } from '@/utils/gpaCalculator';
import type { Course } from '@/types';

export function CourseManagement() {
  const courses = useCourseStore((state) => state.courses);
  const updateCourse = useCourseStore((state) => state.updateCourse);
  const deleteCourse = useCourseStore((state) => state.deleteCourse);
  const addCourse = useCourseStore((state) => state.addCourse);
  const clearAllCourses = useCourseStore((state) => state.clearAllCourses);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'degree' | 'non-degree'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: '',
    credit: 3,
    type: 'non-degree' as 'degree' | 'non-degree',
    semester: '',
    score: 85,
  });

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.semester.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || course.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleEdit = (course: Course) => {
    setEditingId(course.id);
    setEditingCourse({ ...course });
  };

  const handleSaveEdit = () => {
    if (editingId && editingCourse) {
      updateCourse(editingId, editingCourse as Omit<Course, 'id' | 'importedAt'>);
    }
    setEditingId(null);
    setEditingCourse(null);
  };

  const handleAddCourse = () => {
    if (!newCourse.name.trim()) return;
    addCourse(newCourse as Omit<Course, 'id' | 'gradePoint' | 'importedAt'>);
    setNewCourse({
      name: '',
      credit: 3,
      type: 'non-degree',
      semester: '',
      score: 85,
    });
    setShowAddModal(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 80) return 'text-blue-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getGPAColor = (gpa: number) => {
    if (gpa >= 4.0) return 'text-green-500';
    if (gpa >= 3.5) return 'text-blue-500';
    if (gpa >= 3.0) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen size={28} />
          <h2 className="text-2xl font-bold">课程管理</h2>
        </div>
        <p className="text-white/80">查看和管理所有已导入的课程信息</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="搜索课程名称或学期..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-64"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white cursor-pointer"
              >
                <option value="all">全部课程</option>
                <option value="degree">学位课</option>
                <option value="non-degree">非学位课</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all"
            >
              <Plus size={18} />
              添加课程
            </button>
            <button
              onClick={() => {
                if (confirm('确定要删除所有课程吗？此操作不可恢复。')) {
                  clearAllCourses();
                }
              }}
              disabled={courses.length === 0}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={18} />
              一键删除
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  课程名称
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  学分
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  学期
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  成绩
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  等级
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  绩点
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {editingId === course.id && editingCourse ? (
                        <input
                          type="text"
                          value={editingCourse.name || ''}
                          onChange={(e) => setEditingCourse((prev) => prev ? { ...prev, name: e.target.value } : null)}
                          className="w-full px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium text-gray-900">{course.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === course.id && editingCourse ? (
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={editingCourse.credit || 0}
                          onChange={(e) => setEditingCourse((prev) => prev ? { ...prev, credit: parseFloat(e.target.value) || 0 } : null)}
                          className="w-full px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      ) : (
                        <span className="text-gray-600">{course.credit}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === course.id && editingCourse ? (
                        <select
                          value={editingCourse.type || 'non-degree'}
                          onChange={(e) => setEditingCourse((prev) => prev ? { ...prev, type: e.target.value as 'degree' | 'non-degree' } : null)}
                          className="w-full px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="degree">学位课</option>
                          <option value="non-degree">非学位课</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          course.type === 'degree'
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {course.type === 'degree' ? '学位课' : '非学位课'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === course.id && editingCourse ? (
                        <input
                          type="text"
                          value={editingCourse.semester || ''}
                          onChange={(e) => setEditingCourse((prev) => prev ? { ...prev, semester: e.target.value } : null)}
                          className="w-full px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      ) : (
                        <span className="text-gray-600">{course.semester}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === course.id && editingCourse ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editingCourse.score || 0}
                          onChange={(e) => setEditingCourse((prev) => prev ? { ...prev, score: parseInt(e.target.value) || 0 } : null)}
                          className="w-full px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      ) : (
                        <span className={`font-bold ${getScoreColor(course.score)}`}>
                          {course.score}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{getGradeLevel(course.score)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${getGPAColor(course.gradePoint)}`}>
                        {course.gradePoint}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {editingId === course.id ? (
                          <>
                            <button
                              onClick={handleSaveEdit}
                              className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                              title="保存"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditingCourse(null);
                              }}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                              title="取消"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(course)}
                              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                              title="编辑"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => deleteCourse(course.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="删除"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">暂无课程数据</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchTerm || filterType !== 'all' ? '尝试调整筛选条件' : '导入成绩后将显示课程列表'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredCourses.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-sm text-gray-500">共 {filteredCourses.length} 门课程</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">添加课程</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">课程名称</label>
                <input
                  type="text"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="例如：高等数学"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">学分</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={newCourse.credit}
                  onChange={(e) => setNewCourse((prev) => ({ ...prev, credit: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">课程类型</label>
                <select
                  value={newCourse.type}
                  onChange={(e) => setNewCourse((prev) => ({ ...prev, type: e.target.value as 'degree' | 'non-degree' }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="degree">学位课</option>
                  <option value="non-degree">非学位课</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">学期</label>
                <input
                  type="text"
                  value={newCourse.semester}
                  onChange={(e) => setNewCourse((prev) => ({ ...prev, semester: e.target.value }))}
                  placeholder="例如：2024-2025学年秋季学期"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">成绩</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newCourse.score}
                  onChange={(e) => setNewCourse((prev) => ({ ...prev, score: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddCourse}
                disabled={!newCourse.name.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
