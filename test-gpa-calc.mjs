import XLSX from 'xlsx';
import fs from 'fs';

const filePath = './全部成绩查询(1).xlsx';

if (!fs.existsSync(filePath)) {
  console.error('文件不存在:', filePath);
  process.exit(1);
}

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

const headers = jsonData[0];
console.log('表头:', headers);

const nameColIndex = headers.indexOf('课程名');
const gradeColIndex = headers.indexOf('总成绩');
const scoreColIndex = headers.indexOf('百分制成绩');
const creditColIndex = headers.indexOf('学分');
const degreeColIndex = headers.indexOf('是否学位课');
const retakeColIndex = headers.indexOf('重修重考');
const validColIndex = headers.indexOf('是否有效');
const courseNatureColIndex = headers.indexOf('课程性质');
const courseCategoryColIndex = headers.indexOf('课程类别');

function getGradePoint(score) {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  if (s >= 97) return 4.5;
  if (s >= 93) return 4.3;
  if (s >= 89) return 4.0;
  if (s >= 85) return 3.8;
  if (s >= 81) return 3.4;
  if (s >= 77) return 3.0;
  if (s >= 73) return 2.6;
  if (s >= 69) return 2.2;
  if (s >= 65) return 1.8;
  if (s >= 60) return 1.2;
  return 0;
}

console.log('\n====== 逐行计算 ======');

let totalWeightedScore = 0;
let totalWeightedCredits = 0;
let totalCredits = 0;

for (let i = 1; i < jsonData.length; i++) {
  const row = jsonData[i];
  const name = String(row[nameColIndex] || '').trim();
  const grade = String(row[gradeColIndex] || '');
  const score = parseFloat(String(row[scoreColIndex] || '0'));
  const credit = parseFloat(String(row[creditColIndex] || '0'));
  const isDegree = String(row[degreeColIndex] || '') === '是';
  const retake = String(row[retakeColIndex] || '').trim();
  const isValid = String(row[validColIndex] || '').trim();
  const courseNature = String(row[courseNatureColIndex] || '').trim();
  const courseCategory = String(row[courseCategoryColIndex] || '').trim();
  
  if (!name) continue;
  
  const gradePoint = getGradePoint(score);
  
  let weightedScore = 0;
  let weightedCredits = 0;
  let excludedReason = '';
  
  if (!isValid || isValid === '否') {
    excludedReason = '无效课程';
  } else if (courseNature === '辅学' || courseNature === '交流') {
    excludedReason = '辅学/交流课程';
  } else if (courseCategory !== '专业必选课') {
    excludedReason = '非专业必修课程';
  } else if (retake === '辅学') {
    excludedReason = '辅学重修';
  } else if (isDegree) {
    weightedScore = gradePoint * credit * 1.2;
    weightedCredits = credit * 1.2;
  } else {
    weightedScore = gradePoint * credit;
    weightedCredits = credit;
  }
  
  totalWeightedScore += weightedScore;
  totalWeightedCredits += weightedCredits;
  totalCredits += credit;
  
  console.log(`第${i}行: ${name}`);
  console.log(`  成绩: ${grade}, 分数: ${score}, 学分: ${credit}, 学位课: ${isDegree}, 重修重考: ${retake}, 是否有效: ${isValid}, 课程性质: ${courseNature}, 课程类别: ${courseCategory}`);
  if (excludedReason) {
    console.log(`  [已排除] 原因: ${excludedReason}`);
  } else {
    console.log(`  绩点: ${gradePoint}, 加权分数: ${weightedScore.toFixed(2)}, 加权学分: ${weightedCredits.toFixed(2)}`);
  }
}

const gpa = totalWeightedCredits > 0 ? totalWeightedScore / totalWeightedCredits : 0;

console.log('\n====== 计算结果 ======');
console.log(`总加权分数: ${totalWeightedScore.toFixed(2)}`);
console.log(`总加权学分: ${totalWeightedCredits.toFixed(2)}`);
console.log(`总学分: ${totalCredits.toFixed(2)}`);
console.log(`计算GPA: ${gpa.toFixed(4)}`);
console.log(`期望GPA: 3.607`);
console.log(`差异: ${(gpa - 3.607).toFixed(4)}`);
