import XLSX from 'xlsx';
import fs from 'fs';

const filePath = './timeTableForStu12.xlsx';

if (!fs.existsSync(filePath)) {
  console.error('文件不存在:', filePath);
  process.exit(1);
}

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });

console.log('====== 课表结构预览 ======');
console.log('工作表名称:', sheetName);
console.log('总行数:', jsonData.length);
console.log('总列数:', jsonData[0]?.length || 0);

console.log('\n====== 前20行数据 ======');
for (let i = 0; i < Math.min(20, jsonData.length); i++) {
  const row = jsonData[i];
  console.log(`第${i+1}行:`, JSON.stringify(row));
}

console.log('\n====== 单元格区域 ======');
const range = XLSX.utils.decode_range(worksheet['!ref']);
console.log('左上角:', XLSX.utils.encode_cell({r: range.s.r, c: range.s.c}));
console.log('右下角:', XLSX.utils.encode_cell({r: range.e.r, c: range.e.c}));
