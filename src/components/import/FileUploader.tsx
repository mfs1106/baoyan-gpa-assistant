import { useState, useCallback } from 'react';
import { Upload, FileX } from 'lucide-react';
import { parseExcel } from '@/utils/excelParser';
import { saveFile } from '@/utils/fileStorage';
import type { ParsedCourse } from '@/types';

interface FileUploaderProps {
  onSuccess: (courses: ParsedCourse[]) => void;
}

export function FileUploader({ onSuccess }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('请上传Excel文件（.xlsx或.xls格式）');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const courses = await parseExcel(file);
      onSuccess(courses);
      // 本地留存原始 Excel，便于二次登录后重新查看/下载，失败不阻断流程
      saveFile({
        name: file.name,
        category: 'grade-excel',
        blob: file,
        meta: { courseCount: courses.length },
      }).catch(() => {});
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">上传成绩Excel文件</h2>
        <p className="text-gray-500 text-sm">支持从学校教务系统导出的成绩表格</p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        } ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleChange}
          className="hidden"
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 font-medium">正在解析文件...</p>
          </div>
        ) : (
          <>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isDragging ? 'bg-primary-100' : 'bg-gray-100'
            }`}>
              <Upload className={isDragging ? 'text-primary-500' : 'text-gray-400'} size={40} />
            </div>
            <p className="text-gray-900 font-medium mb-2">
              {isDragging ? '释放文件以上传' : '拖拽文件到此处或点击选择'}
            </p>
            <p className="text-gray-500 text-sm">支持 .xlsx 和 .xls 格式</p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-500 bg-red-50 rounded-xl p-4">
          <FileX size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-6 bg-gray-50 rounded-xl p-4">
        <p className="text-sm text-gray-600 font-medium mb-2">支持的字段识别：</p>
        <div className="flex flex-wrap gap-2">
          {['课程名', '学分', '是否学位课', '学年学期', '百分制成绩', '重修重考'].map((field) => (
            <span key={field} className="px-3 py-1 bg-white rounded-lg text-xs text-gray-500 border border-gray-200">
              {field}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">系统将自动识别Excel中的对应列，学期格式如：2023-2024学年 秋季学期</p>
      </div>
    </div>
  );
}
