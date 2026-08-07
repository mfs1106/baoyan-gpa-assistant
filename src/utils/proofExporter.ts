/**
 * 基于模板.docx直接替换红色文字
 * 原理：.docx是zip压缩包，内部word/document.xml存储文档内容
 * 找到所有红色(w:color w:val="FF0000")的文字run，替换内容并改为黑色
 * 落款和日期替换后加粗
 * 格式100%不变，只改文字内容
 */

import JSZip from 'jszip';

export interface ProofData {
  name: string;
  studentId: string;
  enrollmentYear: string;
  enrollmentMonth: string;
  college: string;
  major: string;
  studyDuration: string;
  gradeLevel: string;
  gpa: string;
  totalStudents: string;
  rank: string;
  signUnit: string;
  /** 专业方向（专业方向排名时使用，会拼接到学院+专业后面） */
  direction?: string;
}

/** 证明类型：专业排名 / 专业方向排名 */
export type ProofType = 'major' | 'direction';

function getTodayDate() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: String(now.getMonth() + 1).padStart(2, '0'),
    day: String(now.getDate()).padStart(2, '0'),
  };
}

/**
 * 导出排名证明
 * @param data 证明数据
 * @param type 证明类型：'major'=专业排名，'direction'=专业方向排名
 * @returns { blob, filename } 调用方负责触发下载与本地留存
 */
export async function exportRankingProof(
  data: ProofData,
  type: ProofType = 'major'
): Promise<{ blob: Blob; filename: string }> {
  const today = getTodayDate();
  // 第5组：学院+专业（专业排名） 或 学院+专业+专业方向（专业方向排名）
  const collegeMajor = data.direction
    ? `${data.college}${data.major}${data.direction}专业方向`
    : `${data.college}${data.major}`;
  const dateStr = `${today.year}年${today.month}月${today.day}日`;

  // 替换值列表（按模板中红色文字出现顺序，两个模板完全一致）
  const replacements = [
    data.name,            // 1. 姓名
    data.studentId,        // 2. 学号
    data.enrollmentYear,   // 3. 入学年
    data.enrollmentMonth,  // 4. 入学月
    collegeMajor,          // 5. 学院+专业（+专业方向）
    data.studyDuration,    // 6. 学制
    data.gradeLevel,       // 7. 年级
    data.gpa,              // 8. GPA
    data.totalStudents,    // 9. 总人数
    data.rank,             // 10. 排名
    data.signUnit,         // 11. 落款单位
    dateStr,               // 12. 日期
  ];

  // 根据类型加载对应的内置模板（加时间戳避免缓存，BASE_URL适配GitHub Pages子路径）
  const t = Date.now();
  const baseRaw = import.meta.env.BASE_URL || '/';
  const base = baseRaw.endsWith('/') ? baseRaw.slice(0, -1) : baseRaw;
  const templateFile = type === 'direction'
    ? `${base}/templates/专业方向排名模板.docx?v=${t}`
    : `${base}/templates/排名证明模板.docx?v=${t}`;
  const resp = await fetch(templateFile);
  const templateBuffer = await resp.arrayBuffer();

  // 用JSZip读取docx
  const zip = await JSZip.loadAsync(templateBuffer);
  const docFile = zip.file('word/document.xml');
  if (!docFile) {
    throw new Error('模板文件格式错误：未找到 word/document.xml');
  }
  const xmlString = await docFile.async('text');

  // 解析XML
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

  // 获取所有段落
  const paragraphs = doc.getElementsByTagNameNS(W_NS, 'p');

  // 收集所有红色run，按段落分组，同一段落内连续的红色run为一组
  const groups: Element[][] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const runs = para.getElementsByTagNameNS(W_NS, 'r');
    let currentGroup: Element[] = [];

    for (let j = 0; j < runs.length; j++) {
      const run = runs[j];
      const rPr = run.getElementsByTagNameNS(W_NS, 'rPr')[0];
      let isRed = false;

      if (rPr) {
        const color = rPr.getElementsByTagNameNS(W_NS, 'color')[0];
        if (color && color.getAttribute('w:val') === 'FF0000') {
          isRed = true;
        }
      }

      if (isRed) {
        currentGroup.push(run);
      } else {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
          currentGroup = [];
        }
      }
    }
    // 段落结束时，如果有未完成的组，保存
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
      currentGroup = [];
    }
  }

  // 替换每组红色文字
  for (let i = 0; i < groups.length && i < replacements.length; i++) {
    const group = groups[i];
    const replacement = replacements[i];
    const isLastTwo = i >= groups.length - 2; // 最后两组（落款和日期）

    // 找到第一个有非空白文字的run 和 最后一个有非空白文字的run
    let firstTextIdx = -1;
    let lastTextIdx = -1;
    for (let k = 0; k < group.length; k++) {
      const textElem = group[k].getElementsByTagNameNS(W_NS, 't')[0];
      if (textElem && textElem.textContent && textElem.textContent.trim() !== '') {
        if (firstTextIdx === -1) firstTextIdx = k;
        lastTextIdx = k;
      }
    }
    // 找不到就默认最后一个
    if (firstTextIdx === -1) firstTextIdx = group.length - 1;
    if (lastTextIdx === -1) lastTextIdx = group.length - 1;

    for (let j = 0; j < group.length; j++) {
      const run = group[j];

      let textElem = run.getElementsByTagNameNS(W_NS, 't')[0];
      if (!textElem) {
        textElem = doc.createElementNS(W_NS, 'w:t');
        run.appendChild(textElem);
      }

      if (j === firstTextIdx) {
        // 第一个"有文字"的run填入替换值
        textElem.textContent = replacement;
        textElem.setAttribute('xml:space', 'preserve');
      } else if (j < firstTextIdx) {
        // firstTextIdx之前的run全部是"前导空格"类（用于落款日期右对齐用）
        if (isLastTwo) {
          // 最后两组：保留前导空格以确保文字靠右
          textElem.setAttribute('xml:space', 'preserve');
          // 颜色要从红变黑，但保留空格
        } else {
          // 其他组：前导run不是空格则清空
          textElem.textContent = '';
        }
      } else {
        // j > firstTextIdx 之后的run：全部清空（避免残余示例文字）
        textElem.textContent = '';
      }

      // 修改颜色：红色→黑色
      const rPr = run.getElementsByTagNameNS(W_NS, 'rPr')[0];
      if (rPr) {
        const color = rPr.getElementsByTagNameNS(W_NS, 'color')[0];
        if (color) {
          color.setAttribute('w:val', '000000');
        }

        // 最后两组添加加粗（落款、日期）
        if (isLastTwo) {
          let bold = rPr.getElementsByTagNameNS(W_NS, 'b')[0];
          if (!bold) {
            bold = doc.createElementNS(W_NS, 'w:b');
            rPr.insertBefore(bold, rPr.firstChild);
          }
        }
      } else if (isLastTwo) {
        // 没有 rPr 则新增一个，保证加粗
        const newRPr = doc.createElementNS(W_NS, 'rPr');
        const bold = doc.createElementNS(W_NS, 'w:b');
        const black = doc.createElementNS(W_NS, 'color');
        black.setAttribute('w:val', '000000');
        newRPr.appendChild(bold);
        newRPr.appendChild(black);
        run.insertBefore(newRPr, run.firstChild);
      }
    }
  }

  // 序列化回XML字符串
  const serializer = new XMLSerializer();
  let newXml = serializer.serializeToString(doc);

  // 确保XML声明存在
  if (!newXml.startsWith('<?xml')) {
    newXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + newXml;
  }

  // 更新zip中的document.xml
  zip.file('word/document.xml', newXml);

  // 生成新的docx文件
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  const filePrefix = type === 'direction' ? '专业方向排名证明' : '专业排名证明';
  const filename = `${filePrefix}_${data.name}.docx`;
  return { blob, filename };
}
