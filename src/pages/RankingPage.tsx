import { useState, useMemo } from 'react';
import { Upload, Filter, Edit2, Info, Award, GraduationCap, Users, Download, FileText } from 'lucide-react';
import { useRankingStore, type RankingStudent } from '@/store/rankingStore';
import { ProofModal } from '@/components/ProofModal';
import * as XLSX from 'xlsx';

export function RankingPage() {
  const students = useRankingStore((state) => state.students);
  const addStudents = useRankingStore((state) => state.addStudents);
  const addBonusList = useRankingStore((state) => state.addBonusList);
  const updateStudentGPA = useRankingStore((state) => state.updateStudentGPA);
  const updateStudentBonus = useRankingStore((state) => state.updateStudentBonus);
  const clearAll = useRankingStore((state) => state.clearAll);
  const getFilteredStudents = useRankingStore((state) => state.getFilteredStudents);

  const [selectedMajor, setSelectedMajor] = useState('all');
  const [selectedDirection, setSelectedDirection] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingGPA, setEditingGPA] = useState('');
  const [editingBonusId, setEditingBonusId] = useState<string | null>(null);
  const [editingBonus, setEditingBonus] = useState('');
  const [showProofModal, setShowProofModal] = useState(false);

  const majors = useMemo(() => {
    const set = new Set(students.map((s) => s.major).filter(m => m && m.trim()));
    return ['all', ...Array.from(set)];
  }, [students]);

  const directions = useMemo(() => {
    const filtered = selectedMajor === 'all' 
      ? students 
      : students.filter((s) => s.major === selectedMajor);
    const set = new Set(filtered.map((s) => s.direction).filter(d => d && d.trim()));
    return ['all', ...Array.from(set)];
  }, [students, selectedMajor]);

  const filteredStudents = getFilteredStudents(selectedMajor, selectedDirection);

  const handleImportRanking = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false }) as any[][];

        let headerRow = -1;
        for (let i = 0; i < Math.min(15, jsonData.length); i++) {
          const row = jsonData[i];
          let hasStudentIdOrName = false;
          let hasGPA = false;

          for (let j = 0; j < row.length; j++) {
            const cell = String(row[j]).toLowerCase();
            if (cell.includes('学号') || cell.includes('编号') || cell.includes('id') || cell.includes('姓名') || cell.includes('名字')) {
              hasStudentIdOrName = true;
            }
            if (cell.includes('绩点') || cell.includes('gpa') || cell.includes('平均学分')) {
              hasGPA = true;
            }
          }

          if (hasStudentIdOrName && hasGPA) {
            headerRow = i;
            break;
          }
        }

        if (headerRow === -1) {
          alert('未找到有效表头，请确保表格包含学号/姓名和绩点字段');
          return;
        }

        const headers = jsonData[headerRow];
        let studentIdIndex = -1;
        let nameIndex = -1;
        let collegeIndex = -1;
        let majorIndex = -1;
        let directionIndex = -1;
        let classIndex = -1;
        let gpaIndex = -1;
        let rankIndex = -1;

        for (let i = 0; i < headers.length; i++) {
          const header = String(headers[i]).toLowerCase();
          if (studentIdIndex === -1 && (header.includes('学号') || header.includes('编号') || header.includes('id'))) {
            studentIdIndex = i;
          }
          if (nameIndex === -1 && (header.includes('姓名') || header.includes('名字'))) {
            nameIndex = i;
          }
          if (collegeIndex === -1 && (header.includes('学院') || header.includes('系'))) {
            collegeIndex = i;
          }
          if (majorIndex === -1 && header.includes('专业')) {
            majorIndex = i;
          }
          if (directionIndex === -1 && (header.includes('方向') || header.includes('领域') || header.includes('班'))) {
            if (!header.includes('班级')) {
              directionIndex = i;
            }
          }
          if (classIndex === -1 && (header.includes('班级') || header.includes('班'))) {
            classIndex = i;
          }
          if (gpaIndex === -1 && (header.includes('绩点') || header.includes('gpa') || header.includes('平均学分'))) {
            gpaIndex = i;
          }
          if (rankIndex === -1 && (header.includes('名次') || header.includes('排名') || header.includes('rank'))) {
            rankIndex = i;
          }
        }

        if (gpaIndex === -1) {
          alert('未找到绩点字段，请确保表格包含绩点或平均学分绩点列');
          return;
        }

        const studentData: Omit<RankingStudent, 'id' | 'bonusScore' | 'finalGPA'>[] = [];

        for (let i = headerRow + 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const studentId = studentIdIndex >= 0 ? String(row[studentIdIndex]).trim() : '';
          const name = nameIndex >= 0 ? String(row[nameIndex]).trim() : '';

          if (!studentId && !name) continue;

          const gpaValue = parseFloat(String(row[gpaIndex]));
          if (isNaN(gpaValue)) continue;

          studentData.push({
            studentId: studentId || `student_${i}`,
            name: name || `学生${i}`,
            college: collegeIndex >= 0 ? String(row[collegeIndex]).trim() : '',
            major: majorIndex >= 0 ? String(row[majorIndex]).trim() : '',
            direction: directionIndex >= 0 ? String(row[directionIndex]).trim() : '',
            class: classIndex >= 0 ? String(row[classIndex]).trim() : '',
            rawGPA: gpaValue,
            originalRank: rankIndex >= 0 ? parseInt(String(row[rankIndex])) || 0 : 0,
          });
        }

        if (studentData.length === 0) {
          alert('未找到有效数据');
          return;
        }

        addStudents(studentData);
        alert(`成功导入 ${studentData.length} 条成绩排名数据，旧成绩数据已覆盖`);
      } catch (error) {
        alert('导入失败，请检查文件格式');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportBonus = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false }) as any[][];

        let headerRow = -1;
        for (let i = 0; i < Math.min(15, jsonData.length); i++) {
          const row = jsonData[i];
          let hasStudentIdOrName = false;
          let hasBonus = false;

          for (let j = 0; j < row.length; j++) {
            const cell = String(row[j]).toLowerCase();
            if (cell.includes('学号') || cell.includes('编号') || cell.includes('id') || cell.includes('姓名') || cell.includes('名字')) {
              hasStudentIdOrName = true;
            }
            if (cell.includes('加分') || cell.includes('奖励') || cell.includes('绩点')) {
              hasBonus = true;
            }
          }

          if (hasStudentIdOrName && hasBonus) {
            headerRow = i;
            break;
          }
        }

        if (headerRow === -1) {
          alert('未找到有效表头，请确保表格包含学号/姓名和加分字段');
          return;
        }

        const headers = jsonData[headerRow];
        let studentIdIndex = -1;
        let nameIndex = -1;
        let bonusTotalIndex = -1;
        let bonusIndex = -1;

        for (let i = 0; i < headers.length; i++) {
          const header = String(headers[i]).toLowerCase();
          if (studentIdIndex === -1 && (header.includes('学号') || header.includes('编号') || header.includes('id'))) {
            studentIdIndex = i;
          }
          if (nameIndex === -1 && (header.includes('姓名') || header.includes('名字'))) {
            nameIndex = i;
          }
          if (bonusTotalIndex === -1 && (header.includes('加分总分') || header.includes('获得加分总分') || header.includes('总分'))) {
            bonusTotalIndex = i;
          }
          if (bonusIndex === -1 && header.includes('加分') && !header.includes('总分')) {
            bonusIndex = i;
          }
        }

        const targetBonusIndex = bonusTotalIndex >= 0 ? bonusTotalIndex : bonusIndex;

        if (targetBonusIndex === -1) {
          alert('未找到加分字段，请确保表格包含加分或加分总分列');
          return;
        }

        const bonusMap = new Map<string, { name: string; bonus: number }>();
        let currentStudentId = '';
        let currentName = '';

        for (let i = headerRow + 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const studentId = studentIdIndex >= 0 ? String(row[studentIdIndex] || '').trim() : '';
          const name = nameIndex >= 0 ? String(row[nameIndex] || '').trim() : '';

          if (studentId) {
            currentStudentId = studentId;
          }
          if (name) {
            currentName = name;
          }

          if (!currentStudentId && !currentName) continue;

          const bonus = parseFloat(String(row[targetBonusIndex])) || 0;
          if (bonus > 0) {
            const key = currentStudentId || currentName;
            if (!bonusMap.has(key)) {
              bonusMap.set(key, { name: currentName, bonus });
            }
          }
        }

        const bonusData: { studentId: string; name: string; bonus: number }[] = [];
        bonusMap.forEach((value, key) => {
          bonusData.push({
            studentId: key,
            name: value.name,
            bonus: value.bonus,
          });
        });

        addBonusList(bonusData);
        alert(`成功导入 ${bonusData.length} 条加分数据，加分已累计到对应学生`);
      } catch (error) {
        alert('导入失败，请检查文件格式');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleEditGPA = (student: RankingStudent) => {
    setEditingId(student.id);
    setEditingGPA(String(student.rawGPA));
  };

  const handleSaveGPA = () => {
    if (editingId && editingGPA) {
      updateStudentGPA(editingId, parseFloat(editingGPA));
      setEditingId(null);
      setEditingGPA('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingGPA('');
  };

  const handleEditBonus = (student: RankingStudent) => {
    setEditingBonusId(student.id);
    setEditingBonus(String(student.bonusScore));
  };

  const handleSaveBonus = () => {
    if (editingBonusId && editingBonus) {
      updateStudentBonus(editingBonusId, parseFloat(editingBonus));
      setEditingBonusId(null);
      setEditingBonus('');
    }
  };

  const handleCancelBonusEdit = () => {
    setEditingBonusId(null);
    setEditingBonus('');
  };

  const handleExport = () => {
    if (filteredStudents.length === 0) {
      alert('暂无数据可导出');
      return;
    }

    const majorLabel = selectedMajor === 'all' ? '全部专业' : selectedMajor;
    const directionLabel = selectedDirection === 'all' ? '全部方向' : selectedDirection;
    const dateStr = new Date().toLocaleDateString('zh-CN');

    const rankBg: Record<number, string> = {
      0: '#FFF9C4',
      1: '#E0E0E0',
      2: '#FFCCBC',
    };

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    html += `<head><meta charset="UTF-8"><style>`;
    html += `td,th{font-family:微软雅黑;font-size:10pt;text-align:center;border:0.5pt solid #E5E7EB;}`;
    html += `table{border-collapse:collapse;}`;
    html += `</style></head><body>`;
    html += `<table cellspacing="0" cellpadding="4" style="width:100%;">`;

    // 标题行
    html += `<tr><td colspan="10" style="font-size:18pt;font-weight:bold;color:#FFFFFF;background:#4F46E5;height:38pt;text-align:center;">保研排名预测表</td></tr>`;
    // 副标题行
    html += `<tr><td colspan="10" style="font-size:10pt;color:#666666;background:#F3F4F6;height:24pt;text-align:center;">筛选范围：${majorLabel} · ${directionLabel}　　导出日期：${dateStr}　　共 ${filteredStudents.length} 人</td></tr>`;
    // 空行
    html += `<tr><td colspan="10" style="height:8pt;border:none;"></td></tr>`;

    // 表头
    const headers = ['排名', '学号', '姓名', '学院', '专业', '专业方向', '班级', '裸绩', '加分', '最终GPA'];
    html += `<tr>`;
    headers.forEach((h) => {
      html += `<th style="font-size:11pt;font-weight:bold;color:#FFFFFF;background:#6366F1;height:28pt;">${h}</th>`;
    });
    html += `</tr>`;

    // 数据行
    filteredStudents.forEach((s, idx) => {
      const bg = idx < 3 && rankBg[idx] ? rankBg[idx] : (idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB');
      const rankStyle = idx < 3 ? 'font-weight:bold;font-size:11pt;' : '';
      const bonusStyle = s.bonusScore > 0 ? 'font-weight:bold;color:#D97706;' : '';
      const finalStyle = 'font-weight:bold;color:#4F46E5;';

      html += `<tr>`;
      html += `<td style="background:${bg};${rankStyle}">${idx + 1}</td>`;
      html += `<td style="background:${bg};">${s.studentId}</td>`;
      html += `<td style="background:${bg};">${s.name}</td>`;
      html += `<td style="background:${bg};">${s.college}</td>`;
      html += `<td style="background:${bg};">${s.major}</td>`;
      html += `<td style="background:${bg};">${s.direction}</td>`;
      html += `<td style="background:${bg};">${s.class}</td>`;
      html += `<td style="background:${bg};">${s.rawGPA.toFixed(3)}</td>`;
      html += `<td style="background:${bg};${bonusStyle}">${s.bonusScore > 0 ? '+' + s.bonusScore.toFixed(3) : '0.000'}</td>`;
      html += `<td style="background:${bg};${finalStyle}">${s.finalGPA.toFixed(3)}</td>`;
      html += `</tr>`;
    });

    // 底部说明
    html += `<tr><td colspan="10" style="font-size:9pt;font-style:italic;color:#9CA3AF;text-align:left;border:none;height:20pt;">说明：最终GPA = 裸绩（平均学分绩点）+ 竞赛加分（最高0.5）。排名按最终GPA从高到低排序。</td></tr>`;

    html += `</table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `保研排名预测_${majorLabel}_${directionLabel}_${dateStr.replace(/\//g, '-')}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <GraduationCap size={28} />
          <h2 className="text-2xl font-bold">保研排名预测</h2>
        </div>
        <p className="text-white/80">导入成绩排名和加分名单，预测保研排名</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-2">使用说明</p>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>成绩排名表</strong>：从学院教务/导员处获取，需包含学号、姓名、平均学分绩点等信息。<strong>每次导入将覆盖旧数据</strong>，请导入最终版本。</li>
              <li><strong>加分名单</strong>：学校公示的竞赛加分名单，包含学号、姓名、获得加分总分。<strong>支持分批导入，加分自动累计</strong>。</li>
              <li><strong>匹配规则</strong>：优先按学号匹配，学号匹配不到时按姓名匹配。</li>
              <li><strong>兼容性</strong>：系统会自动识别表头关键字段（学号/姓名/绩点/专业/方向），不依赖固定表格格式。</li>
              <li><strong>手动编辑</strong>：支持手动修改学生成绩和加分，便于模拟不同情况或补充未录入的加分。</li>
              <li><strong>筛选功能</strong>：可按专业和专业方向筛选查看。</li>
              <li><strong>排名规则</strong>：按最终GPA（裸绩+加分）从高到低自动排序。</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="text-blue-500" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">总人数</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
          </div>
          <button
            onClick={clearAll}
            className="w-full py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            清空数据
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <Upload className="text-green-500" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">导入成绩排名表</p>
              <p className="text-xs text-gray-400">从教务导出的Excel文件</p>
              <p className="text-xs text-red-500 mt-1">每次导入覆盖旧数据</p>
            </div>
          </div>
          <label className="block w-full">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportRanking}
              className="hidden"
            />
            <div className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-600 text-center hover:border-green-400 hover:text-green-600 transition-colors cursor-pointer">
              点击选择文件
            </div>
          </label>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <Award className="text-amber-500" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">导入加分名单</p>
              <p className="text-xs text-gray-400">公示的竞赛加分Excel</p>
              <p className="text-xs text-green-500 mt-1">支持分批累计导入</p>
            </div>
          </div>
          <label className="block w-full">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportBonus}
              className="hidden"
            />
            <div className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-600 text-center hover:border-amber-400 hover:text-amber-600 transition-colors cursor-pointer">
              点击选择文件
            </div>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="text-primary-500" size={20} />
          <h3 className="text-lg font-bold text-gray-900">筛选条件</h3>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">专业：</label>
            <select
              value={selectedMajor}
              onChange={(e) => {
                setSelectedMajor(e.target.value);
                setSelectedDirection('all');
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              {majors.map((major) => (
                <option key={major} value={major}>
                  {major === 'all' ? '全部专业' : major}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">专业方向：</label>
            <select
              value={selectedDirection}
              onChange={(e) => setSelectedDirection(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              {directions.map((direction) => (
                <option key={direction} value={direction}>
                  {direction === 'all' ? '全部方向' : direction}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            共 <span className="font-medium text-gray-900">{filteredStudents.length}</span> 名学生
            {selectedMajor !== 'all' && ` · ${selectedMajor}`}
            {selectedDirection !== 'all' && ` · ${selectedDirection}`}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProofModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-primary-500 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors"
            >
              <FileText size={16} />
              导出排名证明
            </button>
            <button
              onClick={handleExport}
              disabled={filteredStudents.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              导出当前排名
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">保研排名预测</h3>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>暂无数据</p>
            <p className="text-sm">请先导入成绩排名表</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">排名</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">学号</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">姓名</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">专业</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">方向</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">裸绩</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">加分</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">最终GPA</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student, index) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-600' :
                        index === 2 ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.studentId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{student.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.major}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.direction}</td>
                    <td className="px-4 py-3">
                      {editingId === student.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editingGPA}
                            onChange={(e) => setEditingGPA(e.target.value)}
                            step="0.001"
                            min="0"
                            max="4.5"
                            className="w-20 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                          />
                          <button
                            onClick={handleSaveGPA}
                            className="text-green-600 hover:text-green-700"
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <span className="font-medium text-gray-900">{student.rawGPA.toFixed(3)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingBonusId === student.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editingBonus}
                            onChange={(e) => setEditingBonus(e.target.value)}
                            step="0.001"
                            min="0"
                            max="0.5"
                            className="w-16 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                          />
                          <button
                            onClick={handleSaveBonus}
                            className="text-green-600 hover:text-green-700"
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleCancelBonusEdit}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <span className={`font-medium ${
                          student.bonusScore > 0 ? 'text-amber-600' : 'text-gray-400'
                        }`}>
                          +{student.bonusScore.toFixed(3)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-lg text-primary-600">
                        {student.finalGPA.toFixed(3)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {editingId !== student.id && editingBonusId !== student.id && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditGPA(student)}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="编辑成绩"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleEditBonus(student)}
                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="编辑加分"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-medium text-gray-900 mb-2">排名规则说明</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p className="font-medium text-gray-800">1. 排名计算方式</p>
            <p>最终GPA = 裸绩（平均学分绩点）+ 竞赛加分</p>
            <p>排名按最终GPA从高到低排序</p>
          </div>
          <div>
            <p className="font-medium text-gray-800">2. 加分规则</p>
            <p>竞赛加分最高不超过0.5绩点</p>
            <p>支持分批导入，同一学生加分自动累计</p>
          </div>
        </div>
      </div>

      {showProofModal && <ProofModal onClose={() => setShowProofModal(false)} />}
    </div>
  );
}
