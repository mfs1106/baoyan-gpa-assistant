import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Check, X, BookOpen, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useTimetableStore } from '@/store/timetableStore';
import { parseExcelTimetable } from '@/utils/timetableParser';
import type { TimetableCourse } from '@/types';

export function TimetableImportPage() {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [parsedCourses, setParsedCourses] = useState<TimetableCourse[]>([]);
  const [semester, setSemester] = useState('');
  const [startDate, setStartDate] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const setCourses = useTimetableStore((state) => state.setCourses);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'pdf' || extension === 'docx' || extension === 'doc') {
      setError('PDF和Word文档暂不支持，请使用Excel文件(.xlsx, .xls)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false }) as any[][];

        const firstRow = jsonData[0]?.[0] || '';
        const semesterMatch = String(firstRow).match(/(\d{4}-\d{4}学年\s*[春夏秋冬季]学期)/);
        setSemester(semesterMatch ? semesterMatch[1] : '');

        const courses = parseExcelTimetable(jsonData);
        if (courses.length === 0) {
          setError('未解析到有效的课程数据，请检查文件格式');
          return;
        }

        setParsedCourses(courses);
        setError('');
        setStep('preview');
      } catch (err) {
        setError('解析文件失败，请确保文件格式正确');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirm = () => {
    setCourses(parsedCourses, semester, startDate);
    navigate('/timetable');
  };

  const handleCancel = () => {
    setStep('upload');
    setParsedCourses([]);
    setSemester('');
    setStartDate('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getDayLabel = (dayOfWeek: number) => {
    const days = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    return days[dayOfWeek] || '';
  };

  const getDayColor = (dayOfWeek: number) => {
    const colors = ['', 'bg-red-50 text-red-600', 'bg-orange-50 text-orange-600', 'bg-amber-50 text-amber-600', 'bg-green-50 text-green-600', 'bg-emerald-50 text-emerald-600', 'bg-blue-50 text-blue-600', 'bg-indigo-50 text-indigo-600'];
    return colors[dayOfWeek] || '';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen size={28} />
          <h2 className="text-2xl font-bold">导入课表</h2>
        </div>
        <p className="text-white/80">上传Excel课表文件，自动解析并生成周课表和日课表</p>
      </div>

      {step === 'upload' ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center">
              <Upload size={36} className="text-primary-500" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">上传课表文件</h3>
            <p className="text-gray-500 mb-6">
              支持 Excel (.xlsx, .xls) 文件<br />
              <span className="text-sm text-gray-400">PDF 和 Word 文档暂不支持</span>
            </p>

            {error && (
              <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-red-50 text-red-600 rounded-xl">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.pdf,.docx,.doc"
              onChange={handleFileChange}
              className="hidden"
              id="timetable-file"
            />
            
            <label
              htmlFor="timetable-file"
              className="inline-flex items-center justify-center gap-3 w-full px-6 py-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all"
            >
              <FileText size={24} className="text-gray-400" />
              <span className="font-medium text-gray-600">点击或拖拽文件到此处</span>
            </label>

            <p className="text-sm text-gray-400 mt-4">
              请确保课表格式包含星期标题（星期一至星期日）和节次信息（如1-2节）
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">课表预览</h3>
                  {semester && (
                    <p className="text-gray-500 mt-1">{semester}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开学日期（第一周周一）
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <X size={18} />
                    取消
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!startDate}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check size={18} />
                    确认导入
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      课程名称
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      教师
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      星期
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      节次
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      周次
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      教室
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parsedCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{course.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-600">{course.teacher}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDayColor(course.dayOfWeek)}`}>
                          {getDayLabel(course.dayOfWeek)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-600">{course.section}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-600">{course.weekRange || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-600">{course.classroom || '-'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">共 {parsedCourses.length} 门课程</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
