import * as XLSX from 'xlsx';
import type { ParsedCourse } from '@/types';

const COLUMN_PATTERNS = {
  name: ['课程名'],
  credit: ['学分'],
  type: ['是否学位课', '课程性质'],
  semester: ['学年学期'],
  score: ['百分制成绩', '百分制', '成绩', '分数', '总成绩'],
  retake: ['重修重考'],
};

function findColumnIndex(headers: (string | number)[], patterns: string[]): number {
  for (const pattern of patterns) {
    for (let i = 0; i < headers.length; i++) {
      const rawHeader = String(headers[i] || '');
      const header = rawHeader.trim().replace(/\s+/g, '');
      if (header === pattern || rawHeader.trim() === pattern) {
        return i;
      }
    }
  }
  for (const pattern of patterns) {
    for (let i = 0; i < headers.length; i++) {
      const rawHeader = String(headers[i] || '');
      const header = rawHeader.trim().replace(/\s+/g, '');
      if (header.includes(pattern) || rawHeader.includes(pattern)) {
        return i;
      }
    }
  }
  return -1;
}

export function parseExcel(file: File): Promise<ParsedCourse[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          reject(new Error('Excel文件内容为空或格式不正确'));
          return;
        }

        let headers = jsonData[0] as (string | number)[];
        let dataStartRow = 1;

        const nameIndexFirstRow = findColumnIndex(headers, COLUMN_PATTERNS.name);
        const scoreIndexFirstRow = findColumnIndex(headers, COLUMN_PATTERNS.score);

        if (nameIndexFirstRow === -1 || scoreIndexFirstRow === -1) {
          if (jsonData.length > 2) {
            headers = jsonData[1] as (string | number)[];
            dataStartRow = 2;
          }
        }

        const nameIndex = findColumnIndex(headers, COLUMN_PATTERNS.name);
        const creditIndex = findColumnIndex(headers, COLUMN_PATTERNS.credit);
        const typeIndex = findColumnIndex(headers, COLUMN_PATTERNS.type);
        const semesterIndex = findColumnIndex(headers, COLUMN_PATTERNS.semester);
        const scoreIndex = findColumnIndex(headers, COLUMN_PATTERNS.score);
        const retakeIndex = findColumnIndex(headers, COLUMN_PATTERNS.retake);

        if (nameIndex === -1) {
          reject(new Error('未找到课程名列，表头为: ' + headers.join(', ')));
          return;
        }
        if (scoreIndex === -1) {
          reject(new Error('未找到成绩列，表头为: ' + headers.join(', ')));
          return;
        }

        const courses: ParsedCourse[] = [];

        for (let i = dataStartRow; i < jsonData.length; i++) {
          const row = jsonData[i] as (string | number)[];
          const name = String(row[nameIndex] || '').trim();
          const scoreValue = row[scoreIndex];

          if (!name || !scoreValue) continue;

          const score = typeof scoreValue === 'number' ? scoreValue : parseFloat(String(scoreValue));
          if (isNaN(score)) continue;

          const rawCredit = creditIndex >= 0 ? (typeof row[creditIndex] === 'number' ? row[creditIndex] : parseFloat(String(row[creditIndex] || '0'))) : 0;
          const retakeStr = retakeIndex >= 0 ? String(row[retakeIndex] || '').trim() : '';
          const credit = retakeStr === '辅学' ? 0 : (isNaN(rawCredit) ? 0 : rawCredit);

          const typeStr = typeIndex >= 0 ? String(row[typeIndex] || '').trim() : '';
          const semester = semesterIndex >= 0 ? String(row[semesterIndex] || '').trim() : '未知学期';

          const isDegree = typeStr === '是' || typeStr.includes('必修') || typeStr.includes('学位');
          const type = isDegree ? ('degree' as const) : ('non-degree' as const);

          courses.push({
            name,
            credit,
            type,
            semester,
            score: isNaN(score) ? 0 : score,
          });
        }

        if (courses.length === 0) {
          reject(new Error('未解析到有效的课程数据，请检查数据格式'));
          return;
        }

        resolve(courses);
      } catch (error) {
        reject(new Error('解析Excel文件失败: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };

    reader.readAsArrayBuffer(file);
  });
}
