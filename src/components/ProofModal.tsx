import { useState, useMemo } from 'react';
import { X, FileText, Search, Award, GitBranch } from 'lucide-react';
import { useRankingStore } from '@/store/rankingStore';
import { exportRankingProof, type ProofType } from '@/utils/proofExporter';
import { saveFile } from '@/utils/fileStorage';

interface ProofModalProps {
  onClose: () => void;
}

export function ProofModal({ onClose }: ProofModalProps) {
  const students = useRankingStore((state) => state.students);

  const [searchType, setSearchType] = useState<'select' | 'manual'>('select');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // 证明类型：专业排名 / 专业方向排名
  const [proofType, setProofType] = useState<ProofType>('major');

  // 表单字段
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [enrollmentYear, setEnrollmentYear] = useState('2023');
  const [enrollmentMonth, setEnrollmentMonth] = useState('9');
  const [college, setCollege] = useState('');
  const [major, setMajor] = useState('');
  const [direction, setDirection] = useState(''); // 专业方向
  const [studyDuration, setStudyDuration] = useState('四');
  const [gradeLevel, setGradeLevel] = useState('三');
  const [gpa, setGpa] = useState('');
  const [totalStudents, setTotalStudents] = useState('');
  const [rank, setRank] = useState('');
  const [signUnit, setSignUnit] = useState('');
  const [exporting, setExporting] = useState(false);

  // 所有学生（按最终GPA排序）
  const allSortedStudents = useMemo(() => {
    return [...students].sort((a, b) => b.finalGPA - a.finalGPA);
  }, [students]);

  // 搜索结果
  const searchResults = useMemo(() => {
    if (!searchKeyword.trim()) return [];
    const kw = searchKeyword.trim().toLowerCase();
    return allSortedStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(kw) ||
        s.studentId.toLowerCase().includes(kw)
    );
  }, [searchKeyword, allSortedStudents]);

  // 选中学生后自动填充
  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    const student = allSortedStudents.find((s) => s.id === studentId);
    if (!student) return;

    // 计算排名：专业方向排名按同专业+同方向，专业排名按同专业
    let rankingStudents = allSortedStudents.filter(
      (s) => s.major === student.major
    );
    if (proofType === 'direction' && student.direction) {
      rankingStudents = rankingStudents.filter(
        (s) => (s as any).direction === student.direction
      );
    }
    const rankIndex = rankingStudents.findIndex(
      (s) => s.studentId === student.studentId
    );

    setName(student.name);
    setStudentId(student.studentId);
    setCollege(student.college || '');
    setMajor(student.major || '');
    setDirection((student as any).direction || '');
    setGpa(String(student.finalGPA));
    setTotalStudents(String(rankingStudents.length));
    setRank(String(rankIndex + 1));
    // 自动填落款单位：Excel里有signUnit列就直接用，否则按"学校+学院"拼，用户后续可手动改
    setSignUnit(
      (student as any).signUnit ||
        (student.college ? `燕山大学${student.college}` : '')
    );
  };

  // 切换证明类型时清空已选学生
  const handleProofTypeChange = (type: ProofType) => {
    setProofType(type);
    setSelectedStudentId('');
    setSearchKeyword('');
    setTotalStudents('');
    setRank('');
  };

  const handleSubmit = async () => {
    if (!name.trim() || !studentId.trim()) {
      alert('请填写姓名和学号');
      return;
    }
    if (!gpa.trim() || !totalStudents.trim() || !rank.trim()) {
      alert('GPA、专业总人数和排名不能为空');
      return;
    }
    if (proofType === 'direction' && !direction.trim()) {
      alert('专业方向排名需要填写专业方向');
      return;
    }

    setExporting(true);
    try {
      const { blob, filename } = await exportRankingProof({
        name: name.trim(),
        studentId: studentId.trim(),
        enrollmentYear: enrollmentYear.trim() || '2023',
        enrollmentMonth: enrollmentMonth.trim() || '9',
        college: college.trim(),
        major: major.trim(),
        direction: proofType === 'direction' ? direction.trim() : undefined,
        studyDuration: studyDuration.trim() || '四',
        gradeLevel: gradeLevel.trim() || '三',
        gpa: gpa.trim(),
        totalStudents: totalStudents.trim(),
        rank: rank.trim(),
        // 直接用输入框里的落款，用户手动改过就用改过的，实在空再用学院兜底
        signUnit: signUnit.trim() || (college.trim() ? `燕山大学${college.trim()}` : ''),
      }, proofType);

      // 本地留存（IndexedDB），失败不阻断下载
      saveFile({
        name: filename,
        category: 'ranking-proof',
        blob,
        meta: {
          proofType,
          name: name.trim(),
          studentId: studentId.trim(),
          major: major.trim(),
          direction: proofType === 'direction' ? direction.trim() : undefined,
          gpa: gpa.trim(),
          rank: rank.trim(),
          totalStudents: totalStudents.trim(),
        },
      }).catch(() => {});

      // 触发浏览器下载
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      onClose();
    } catch (err) {
      alert('导出失败：' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setExporting(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-gray-900">导出排名证明</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-6 space-y-4">
          {/* 证明类型选择 */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => handleProofTypeChange('major')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                proofType === 'major'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Award size={16} />
              专业排名证明
            </button>
            <button
              onClick={() => handleProofTypeChange('direction')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                proofType === 'direction'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <GitBranch size={16} />
              专业方向排名证明
            </button>
          </div>

          {/* 切换模式 */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setSearchType('select')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                searchType === 'select'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              从排名表中选择
            </button>
            <button
              onClick={() => setSearchType('manual')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                searchType === 'manual'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              手动输入信息
            </button>
          </div>

          {/* 选择学生模式 */}
          {searchType === 'select' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="输入姓名或学号搜索..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {searchResults.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectStudent(s.id)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-primary-50 border-b border-gray-100 last:border-0 transition-colors ${
                        selectedStudentId === s.id ? 'bg-primary-100' : ''
                      }`}
                    >
                      <span className="font-medium">{s.name}</span>
                      <span className="ml-2 text-gray-500">{s.studentId}</span>
                      <span className="ml-2 text-gray-400">{s.major}</span>
                      <span className="ml-2 text-primary-600">综合GPA: {s.finalGPA}</span>
                    </button>
                  ))}
                </div>
              )}

              {students.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  请先导入成绩排名表
                </p>
              )}
            </div>
          )}

          {/* 表单字段 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>姓名 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="如：张三"
              />
            </div>
            <div>
              <label className={labelClass}>学号 *</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className={inputClass}
                placeholder="如：2023XXXXXXXX"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>入学年份</label>
              <input
                type="text"
                value={enrollmentYear}
                onChange={(e) => setEnrollmentYear(e.target.value)}
                className={inputClass}
                placeholder="如：2023"
              />
            </div>
            <div>
              <label className={labelClass}>入学月份</label>
              <input
                type="text"
                value={enrollmentMonth}
                onChange={(e) => setEnrollmentMonth(e.target.value)}
                className={inputClass}
                placeholder="如：9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>学院</label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className={inputClass}
                placeholder="如：XX学院"
              />
            </div>
            <div>
              <label className={labelClass}>专业</label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className={inputClass}
                placeholder="如：XX专业"
              />
            </div>
            {proofType === 'direction' && (
              <div>
                <label className={labelClass}>专业方向</label>
                <input
                  type="text"
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  className={inputClass}
                  placeholder="如：XX方向"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>学制</label>
              <input
                type="text"
                value={studyDuration}
                onChange={(e) => setStudyDuration(e.target.value)}
                className={inputClass}
                placeholder="如：四"
              />
            </div>
            <div>
              <label className={labelClass}>年级</label>
              <input
                type="text"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className={inputClass}
                placeholder="如：三"
              />
            </div>
            <div>
              <label className={labelClass}>GPA</label>
              <input
                type="text"
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                className={inputClass}
                placeholder="如：X.XXX"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                {proofType === 'direction' ? '专业方向总人数' : '专业总人数'}
              </label>
              <input
                type="text"
                value={totalStudents}
                onChange={(e) => setTotalStudents(e.target.value)}
                className={inputClass}
                placeholder="如：XX"
              />
            </div>
            <div>
              <label className={labelClass}>
                {proofType === 'direction' ? '专业方向排名' : '专业排名'}
              </label>
              <input
                type="text"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                className={inputClass}
                placeholder="如：X"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>落款单位</label>
            <input
              type="text"
              value={signUnit}
              onChange={(e) => setSignUnit(e.target.value)}
              className={inputClass}
              placeholder="如：燕山大学XX学院"
            />
          </div>

          {/* 模板信息提示 */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-blue-600">
              {proofType === 'direction'
                ? '使用内置的专业方向排名模板，红色字段将自动替换为实际数据，格式100%保持不变'
                : '使用内置的专业排名模板，红色字段将自动替换为实际数据，格式100%保持不变'}
            </p>
          </div>

          {/* 预览 */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-400 mb-2">预览：</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="text-center block text-2xl mb-3" style={{ fontFamily: '华文中宋' }}>
                证&nbsp;&nbsp;明
              </span>
              {name || '【姓名】'}，学号：{studentId || '【学号】'}，
              {enrollmentYear || '【年】'}年{enrollmentMonth || '【月】'}月进入我校
              {college || '【学院】'}
              {major || '【专业】'}
              {proofType === 'direction' && direction ? `${direction}专业方向` : '专业'}学习，学制{studyDuration || '【学制】'}年，
              现为本科{gradeLevel || '【年级】'}年级学生。截止目前，
              综合成绩绩点{gpa || '【GPA】'}，
              {proofType === 'direction' ? '本专业方向' : '本专业'}学生共计{totalStudents || '【总人数】'}人，
              {proofType === 'direction' ? '专业方向' : '专业'}排名第{rank || '【排名】'}名。
            </p>
            <p className="text-sm text-gray-700 mt-2">特此证明。</p>
            <p className="text-sm text-gray-700 text-right mt-4 font-bold">
              {signUnit || '【落款单位】'}
            </p>
            <p className="text-sm text-gray-700 text-right font-bold">
              {new Date().getFullYear()}年{String(new Date().getMonth() + 1).padStart(2, '0')}月
              {String(new Date().getDate()).padStart(2, '0')}日
            </p>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={exporting}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? '正在导出...' : '导出 Word 文档'}
          </button>
        </div>
      </div>
    </div>
  );
}
