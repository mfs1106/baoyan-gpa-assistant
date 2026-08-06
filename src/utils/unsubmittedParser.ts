import * as XLSX from 'xlsx';

export interface UnsubmittedCourse {
  name: string;
  credit: number;
  type: 'degree' | 'non-degree';
  semester: string;
  predictedScore: number;
}

const COLUMN_PATTERNS = {
  name: ['课程名'],
  credit: ['学分'],
  type: ['是否学位课', '课程性质'],
  semester: ['学年学期'],
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

export function parseUnsubmittedExcel(file: File): Promise<UnsubmittedCourse[]> {
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
        const creditIndexFirstRow = findColumnIndex(headers, COLUMN_PATTERNS.credit);

        if (nameIndexFirstRow === -1 || creditIndexFirstRow === -1) {
          if (jsonData.length > 2) {
            headers = jsonData[1] as (string | number)[];
            dataStartRow = 2;
          }
        }

        const nameIndex = findColumnIndex(headers, COLUMN_PATTERNS.name);
        const creditIndex = findColumnIndex(headers, COLUMN_PATTERNS.credit);
        const typeIndex = findColumnIndex(headers, COLUMN_PATTERNS.type);
        const semesterIndex = findColumnIndex(headers, COLUMN_PATTERNS.semester);

        if (nameIndex === -1) {
          reject(new Error('未找到课程名列'));
          return;
        }
        if (creditIndex === -1) {
          reject(new Error('未找到学分列'));
          return;
        }

        const courses: UnsubmittedCourse[] = [];

        for (let i = dataStartRow; i < jsonData.length; i++) {
          const row = jsonData[i] as (string | number)[];
          const name = String(row[nameIndex] || '').trim();
          const creditValue = row[creditIndex];

          if (!name || !creditValue) continue;

          const credit = typeof creditValue === 'number' ? creditValue : parseFloat(String(creditValue));
          if (isNaN(credit)) continue;

          const typeStr = typeIndex >= 0 ? String(row[typeIndex] || '').trim() : '';
          const semester = semesterIndex >= 0 ? String(row[semesterIndex] || '').trim() : '未知学期';

          const isDegree = typeStr === '是' || typeStr.includes('必修') || typeStr.includes('学位');
          const type = isDegree ? ('degree' as const) : ('non-degree' as const);

          courses.push({
            name,
            credit: isNaN(credit) ? 0 : credit,
            type,
            semester,
            predictedScore: 85,
          });
        }

        if (courses.length === 0) {
          reject(new Error('未解析到有效的课程数据'));
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
