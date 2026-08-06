import { useState } from 'react';
import { ArrowLeft, Check, Edit3, Save, Trash2 } from 'lucide-react';
import type { ParsedCourse } from '@/types';
import { getGradePoint, getGradeLevel } from '@/utils/gpaCalculator';

interface DataPreviewProps {
  courses: ParsedCourse[];
  onConfirm: (courses: ParsedCourse[]) => void;
  onCancel: () => void;
}

export function DataPreview({ courses, onConfirm, onCancel }: DataPreviewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedCourses, setEditedCourses] = useState<ParsedCourse[]>(courses);

  const handleEdit = (index: number) => {
    setEditingId(String(index));
  };

  const handleSave = (index: number, field: keyof ParsedCourse, value: string | number) => {
    const newCourses = [...editedCourses];
    newCourses[index] = {
      ...newCourses[index],
      [field]: typeof value === 'number' ? value : value,
    };
    setEditedCourses(newCourses);
    setEditingId(null);
  };

  const handleDelete = (index: number) => {
    const newCourses = editedCourses.filter((_, i) => i !== index);
    setEditedCourses(newCourses);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 80) return 'text-blue-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">数据预览</h2>
            <p className="text-sm text-gray-500">共 {editedCourses.length} 门课程</p>
          </div>
        </div>
        <button
          onClick={() => onConfirm(editedCourses)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all"
        >
          <Check size={18} />
          确认导入
        </button>
      </div>

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
            {editedCourses.map((course, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  {editingId === String(index) ? (
                    <input
                      type="text"
                      value={course.name}
                      onChange={(e) => handleSave(index, 'name', e.target.value)}
                      className="w-full px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      autoFocus
                    />
                  ) : (
                    <span className="font-medium text-gray-900">{course.name}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === String(index) ? (
                    <input
                      type="number"
                      value={course.credit}
                      onChange={(e) => handleSave(index, 'credit', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <span className="text-gray-600">{course.credit}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === String(index) ? (
                    <select
                      value={course.type}
                      onChange={(e) => handleSave(index, 'type', e.target.value)}
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
                  {editingId === String(index) ? (
                    <input
                      type="text"
                      value={course.semester}
                      onChange={(e) => handleSave(index, 'semester', e.target.value)}
                      className="w-full px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <span className="text-gray-600">{course.semester}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === String(index) ? (
                    <input
                      type="number"
                      value={course.score}
                      onChange={(e) => handleSave(index, 'score', parseFloat(e.target.value) || 0)}
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
                  <span className="text-gray-600">{getGradePoint(course.score)}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {editingId === String(index) ? (
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                        title="保存"
                      >
                        <Save size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEdit(index)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit3 size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(index)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
