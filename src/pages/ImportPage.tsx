import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUploader } from '@/components/import/FileUploader';
import { DataPreview } from '@/components/import/DataPreview';
import { useCourseStore } from '@/store/courseStore';
import type { ParsedCourse } from '@/types';

export function ImportPage() {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [parsedCourses, setParsedCourses] = useState<ParsedCourse[]>([]);
  const navigate = useNavigate();
  const addCourses = useCourseStore((state) => state.addCourses);

  const handleFileSuccess = (courses: ParsedCourse[]) => {
    setParsedCourses(courses);
    setStep('preview');
  };

  const handleConfirm = (courses: ParsedCourse[]) => {
    addCourses(courses);
    navigate('/');
  };

  const handleCancel = () => {
    setStep('upload');
    setParsedCourses([]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
              step === 'upload' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              1
            </div>
            <div className="w-12 h-0.5 mt-5 bg-gray-200" />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
              step === 'preview' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              2
            </div>
          </div>
          <div className="flex gap-6">
            <span className={`font-medium ${step === 'upload' ? 'text-primary-600' : 'text-gray-400'}`}>
              上传文件
            </span>
            <span className={`font-medium ${step === 'preview' ? 'text-primary-600' : 'text-gray-400'}`}>
              确认导入
            </span>
          </div>
        </div>
      </div>

      {step === 'upload' ? (
        <FileUploader onSuccess={handleFileSuccess} />
      ) : (
        <DataPreview
          courses={parsedCourses}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
