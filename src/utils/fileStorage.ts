/**
 * 本地文件持久化（IndexedDB）
 * 用于存储用户上传的 Excel 和导出的 Word 证明等大文件 Blob。
 * 所有数据仅保存在浏览器本地，不会上传到任何服务器，每个用户/设备天然隔离。
 */

export type FileCategory = 'grade-excel' | 'timetable-excel' | 'ranking-proof';

export interface StoredFile {
  id: string;
  name: string;
  category: FileCategory;
  size: number;
  blob: Blob;
  createdAt: number;
  meta?: Record<string, unknown>;
}

export interface SaveFileInput {
  name: string;
  category: FileCategory;
  blob: Blob;
  meta?: Record<string, unknown>;
}

const DB_NAME = 'gpa-assistant-files';
const STORE_NAME = 'files';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('当前环境不支持 IndexedDB'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function genId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 11);
}

/** 保存一个文件到本地，返回生成的 id */
export async function saveFile(input: SaveFileInput): Promise<string> {
  const db = await openDB();
  const record: StoredFile = {
    id: genId(),
    name: input.name,
    category: input.category,
    size: input.blob.size,
    blob: input.blob,
    createdAt: Date.now(),
    meta: input.meta,
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => {
      db.close();
      resolve(record.id);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/** 获取全部文件，按创建时间倒序 */
export async function getAllFiles(): Promise<StoredFile[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      db.close();
      const list = (req.result as StoredFile[]) || [];
      resolve(list.sort((a, b) => b.createdAt - a.createdAt));
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

/** 按 category 获取文件 */
export async function getFilesByCategory(category: FileCategory): Promise<StoredFile[]> {
  const all = await getAllFiles();
  return all.filter((f) => f.category === category);
}

export async function getFile(id: string): Promise<StoredFile | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => {
      db.close();
      resolve(req.result as StoredFile | undefined);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

export async function deleteFile(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/** 清空指定 category 下的全部文件 */
export async function clearFilesByCategory(category: FileCategory): Promise<void> {
  const files = await getFilesByCategory(category);
  await Promise.all(files.map((f) => deleteFile(f.id)));
}

/** 触发浏览器下载一个 StoredFile */
export function downloadStoredFile(file: StoredFile): void {
  const url = URL.createObjectURL(file.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // 释放需延迟，避免某些浏览器下载被中断
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  'grade-excel': '成绩 Excel',
  'timetable-excel': '课表 Excel',
  'ranking-proof': '排名证明',
};
