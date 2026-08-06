import { useState, useCallback } from 'react';
import { Calculator, TrendingUp, TrendingDown, Minus, Sparkles, Upload, Plus, Trash2 } from 'lucide-react';
import { useCourseStore } from '@/store/courseStore';
import { calculateGPA, predictGPA, getGradePoint, getGradeLevel } from '@/utils/gpaCalculator';
import { parseUnsubmittedExcel, type UnsubmittedCourse } from '@/utils/unsubmittedParser';

export function PredictPage() {
  const courses = useCourseStore((state) => state.courses);
  const currentGPA = calculateGPA(courses).gpa;

  const [mode, setMode] = useState<'manual' | 'import'>('manual');
  const [formData, setFormData] = useState({
    name: '',
    credit: 3,
    type: 'non-degree' as 'degree' | 'non-degree',
    predictedScore: 85,
  });
  const [importedCourses, setImportedCourses] = useState<UnsubmittedCourse[]>([]);
  const [result, setResult] = useState<{ currentGPA: number; predictedGPA: number; change: number; predictedCourse: any } | null>(null);
  const [error, setError] = useState<string>('');

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setResult(null);
  };

  const handlePredict = () => {
    if (!formData.name.trim()) return;
    const prediction = predictGPA(courses, formData);
    setResult(prediction);
  };

  const handleReset = () => {
    setFormData({
      name: '',
      credit: 3,
      type: 'non-degree',
      predictedScore: 85,
    });
    setResult(null);
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    try {
      const parsedCourses = await parseUnsubmittedExcel(file);
      setImportedCourses(parsedCourses);
      setMode('import');
      setResult(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const handleScoreChange = (index: number, score: number) => {
    setImportedCourses((prev) =>
      prev.map((course, i) => (i === index ? { ...course, predictedScore: score } : course))
    );
  };

  const handleTypeChange = (index: number, type: 'degree' | 'non-degree') => {
    setImportedCourses((prev) =>
      prev.map((course, i) => (i === index ? { ...course, type } : course))
    );
  };

  const handleRemoveCourse = (index: number) => {
    setImportedCourses((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const handleAddManually = () => {
    if (!formData.name.trim()) return;
    const newCourse: UnsubmittedCourse = {
      name: formData.name,
      credit: formData.credit,
      type: formData.type,
      semester: '手动添加',
      predictedScore: formData.predictedScore,
    };
    setImportedCourses((prev) => [...prev, newCourse]);
    setMode('import');
    setFormData({
      name: '',
      credit: 3,
      type: 'non-degree',
      predictedScore: 85,
    });
    setResult(null);
  };

  const handleBatchPredict = () => {
    if (importedCourses.length === 0) return;
    
    let predictionResult = { ...predictGPA(courses, importedCourses[0]), predictedCourse: importedCourses[0] };
    
    for (let i = 1; i < importedCourses.length; i++) {
      const tempCourses = [...courses];
      for (let j = 0; j < i; j++) {
        tempCourses.push({
          id: `temp-${j}`,
          name: importedCourses[j].name,
          credit: importedCourses[j].credit,
          type: importedCourses[j].type,
          semester: importedCourses[j].semester,
          score: importedCourses[j].predictedScore,
          gradePoint: getGradePoint(importedCourses[j].predictedScore),
          importedAt: Date.now(),
        });
      }
      const tempResult = predictGPA(tempCourses, importedCourses[i]);
      predictionResult = {
        ...tempResult,
        predictedCourse: importedCourses[i],
      };
    }
    
    setResult({
      ...predictionResult,
      predictedCourse: {
        name: `${importedCourses.length}门课程`,
        credit: importedCourses.reduce((sum, c) => sum + c.credit, 0),
        type: 'non-degree',
        score: importedCourses.reduce((sum, c) => sum + c.predictedScore, 0) / importedCourses.length,
      },
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 80) return 'text-blue-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Calculator size={28} />
          <h2 className="text-2xl font-bold">成绩预测</h2>
        </div>
        <p className="text-white/80">
          输入预计成绩，提前了解对GPA的影响，更好地规划学业
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setMode('manual')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
            mode === 'manual'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Plus size={18} />
          手动添加
        </button>
        <button
          onClick={() => setMode('import')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
            mode === 'import'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Upload size={18} />
          导入未提交成绩
        </button>
      </div>

      {mode === 'manual' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">输入预测信息</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">课程名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="例如：高等数学"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">学分</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={formData.credit}
                  onChange={(e) => handleChange('credit', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">课程类型</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all hover:border-primary-300">
                    <input
                      type="radio"
                      name="type"
                      value="degree"
                      checked={formData.type === 'degree'}
                      onChange={(e) => handleChange('type', e.target.value)}
                      className="sr-only"
                    />
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      formData.type === 'degree' ? 'border-purple-500' : 'border-gray-300'
                    }`}>
                      {formData.type === 'degree' && (
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                      )}
                    </span>
                    <span className={`font-medium ${
                      formData.type === 'degree' ? 'text-purple-600' : 'text-gray-600'
                    }`}>学位课</span>
                  </label>
                  <label className="flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all hover:border-primary-300">
                    <input
                      type="radio"
                      name="type"
                      value="non-degree"
                      checked={formData.type === 'non-degree'}
                      onChange={(e) => handleChange('type', e.target.value)}
                      className="sr-only"
                    />
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      formData.type === 'non-degree' ? 'border-blue-500' : 'border-gray-300'
                    }`}>
                      {formData.type === 'non-degree' && (
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </span>
                    <span className={`font-medium ${
                      formData.type === 'non-degree' ? 'text-blue-600' : 'text-gray-600'
                    }`}>非学位课</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  预测分数：<span className={`font-bold ${getScoreColor(formData.predictedScore)}`}>
                    {formData.predictedScore}分
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.predictedScore}
                  onChange={(e) => handleChange('predictedScore', parseInt(e.target.value) || 0)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>0</span>
                  <span>60</span>
                  <span>80</span>
                  <span>90</span>
                  <span>100</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600">
                  当前预测课程绩点：<span className="font-bold text-primary-600">
                    {getGradePoint(formData.predictedScore)}
                  </span>
                  <span className="text-gray-400 ml-2">({getGradeLevel(formData.predictedScore)})</span>
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  重置
                </button>
                <button
                  onClick={handlePredict}
                  disabled={!formData.name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles size={18} />
                  开始预测
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">预测结果</h3>

            {result ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-6">
                  <p className="text-sm text-gray-500 mb-2">当前 GPA</p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-gray-900">{currentGPA.toFixed(3)}</span>
                    <span className="text-lg text-gray-400 mb-1">/ 4.5</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                  <p className="text-sm text-gray-500 mb-2">预测 GPA</p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-green-600">{result.predictedGPA.toFixed(3)}</span>
                    <span className="text-lg text-gray-400 mb-1">/ 4.5</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-gray-50">
                  {result.change > 0 ? (
                    <TrendingUp className="text-green-500" size={24} />
                  ) : result.change < 0 ? (
                    <TrendingDown className="text-red-500" size={24} />
                  ) : (
                    <Minus className="text-gray-400" size={24} />
                  )}
                  <span className={`text-xl font-bold ${
                    result.change > 0 ? 'text-green-500' : result.change < 0 ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {result.change > 0 ? '+' : ''}{result.change.toFixed(3)}
                  </span>
                  <span className="text-gray-500">绩点变化</span>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 font-medium mb-3">预测课程信息</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">课程名称</span>
                      <p className="font-medium text-gray-900">{result.predictedCourse.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">学分</span>
                      <p className="font-medium text-gray-900">{result.predictedCourse.credit}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">课程类型</span>
                      <p className={`font-medium ${
                        result.predictedCourse.type === 'degree' ? 'text-purple-600' : 'text-blue-600'
                      }`}>
                        {result.predictedCourse.type === 'degree' ? '学位课' : '非学位课'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">预测分数</span>
                      <p className={`font-medium ${getScoreColor(result.predictedCourse.score)}`}>
                        {result.predictedCourse.score}分
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Calculator size={48} className="mb-4 opacity-50" />
                <p>输入课程信息并点击预测</p>
                <p className="text-sm mt-1">查看预计成绩对GPA的影响</p>
              </div>
            )}
          </div>
        </div>
      )}

      {mode === 'import' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">未提交成绩课程列表</h3>
              <button
                onClick={handleAddManually}
                disabled={!formData.name.trim()}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                添加课程
              </button>
            </div>

            <div className="mb-4">
              <label className="flex items-center justify-center w-full border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-primary-300 transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex flex-col items-center text-gray-500">
                  <Upload size={32} className="mb-2" />
                  <span className="text-sm">拖拽文件到此处或点击选择</span>
                  <span className="text-xs text-gray-400">支持 .xlsx 和 .xls 格式</span>
                </div>
              </label>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {importedCourses.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Upload size={40} className="mx-auto mb-3 opacity-50" />
                <p>导入未提交成绩Excel文件</p>
                <p className="text-sm mt-1">提取课程名称、学分、是否学位课</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3">
                  {importedCourses.map((course, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{course.name}</h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span>学分：{course.credit}</span>
                            <span className={`${course.type === 'degree' ? 'text-purple-500' : 'text-blue-500'}`}>
                              {course.type === 'degree' ? '学位课' : '非学位课'}
                            </span>
                            <span>{course.semester}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveCourse(index)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">
                            预测分数：<span className={`font-bold ${getScoreColor(course.predictedScore)}`}>
                              {course.predictedScore}分
                            </span>
                          </label>
                          <span className="text-sm text-gray-500">
                            绩点：<span className="font-bold text-primary-600">
                              {getGradePoint(course.predictedScore)}
                            </span>
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={course.predictedScore}
                          onChange={(e) => handleScoreChange(index, parseInt(e.target.value) || 0)}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>0</span>
                          <span>60</span>
                          <span>80</span>
                          <span>90</span>
                          <span>100</span>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all">
                          <input
                            type="radio"
                            checked={course.type === 'degree'}
                            onChange={() => handleTypeChange(index, 'degree')}
                            className="sr-only"
                          />
                          <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                            course.type === 'degree' ? 'border-purple-500' : 'border-gray-300'
                          }`}>
                            {course.type === 'degree' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            )}
                          </span>
                          <span className={`text-sm ${
                            course.type === 'degree' ? 'text-purple-600 font-medium' : 'text-gray-500'
                          }`}>学位课</span>
                        </label>
                        <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all">
                          <input
                            type="radio"
                            checked={course.type === 'non-degree'}
                            onChange={() => handleTypeChange(index, 'non-degree')}
                            className="sr-only"
                          />
                          <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                            course.type === 'non-degree' ? 'border-blue-500' : 'border-gray-300'
                          }`}>
                            {course.type === 'non-degree' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            )}
                          </span>
                          <span className={`text-sm ${
                            course.type === 'non-degree' ? 'text-blue-600 font-medium' : 'text-gray-500'
                          }`}>非学位课</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">
                      共 {importedCourses.length} 门课程，{importedCourses.reduce((sum, c) => sum + c.credit, 0)} 学分
                    </span>
                    <button
                      onClick={handleBatchPredict}
                      disabled={importedCourses.length === 0}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles size={18} />
                      批量预测
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">预测结果</h3>

            {result ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-6">
                  <p className="text-sm text-gray-500 mb-2">当前 GPA</p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-gray-900">{currentGPA.toFixed(3)}</span>
                    <span className="text-lg text-gray-400 mb-1">/ 4.5</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                  <p className="text-sm text-gray-500 mb-2">预测 GPA</p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-green-600">{result.predictedGPA.toFixed(3)}</span>
                    <span className="text-lg text-gray-400 mb-1">/ 4.5</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-gray-50">
                  {result.change > 0 ? (
                    <TrendingUp className="text-green-500" size={24} />
                  ) : result.change < 0 ? (
                    <TrendingDown className="text-red-500" size={24} />
                  ) : (
                    <Minus className="text-gray-400" size={24} />
                  )}
                  <span className={`text-xl font-bold ${
                    result.change > 0 ? 'text-green-500' : result.change < 0 ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {result.change > 0 ? '+' : ''}{result.change.toFixed(3)}
                  </span>
                  <span className="text-gray-500">绩点变化</span>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 font-medium mb-3">预测课程汇总</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">课程数量</span>
                      <p className="font-medium text-gray-900">{importedCourses.length}门</p>
                    </div>
                    <div>
                      <span className="text-gray-400">总学分</span>
                      <p className="font-medium text-gray-900">{importedCourses.reduce((sum, c) => sum + c.credit, 0)}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">学位课</span>
                      <p className="font-medium text-purple-600">
                        {importedCourses.filter(c => c.type === 'degree').length}门
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">非学位课</span>
                      <p className="font-medium text-blue-600">
                        {importedCourses.filter(c => c.type === 'non-degree').length}门
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Calculator size={48} className="mb-4 opacity-50" />
                <p>导入课程并设置预测分数</p>
                <p className="text-sm mt-1">点击批量预测查看对GPA的影响</p>
              </div>
            )}
          </div>
        </div>
      )}

      {courses.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-800 text-sm">
            <strong>提示：</strong>当前暂无历史成绩数据。建议先导入历史成绩再进行预测，以便更准确地预估GPA变化。
          </p>
        </div>
      )}
    </div>
  );
}
