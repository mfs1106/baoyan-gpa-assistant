import { supabase, USER_FILES_BUCKET } from '@/lib/supabase';

/**
 * 本地文件持久化（IndexedDB）
 * 用于存储用户上传的 Excel 和导出的 Word 证明等大文件 Blob。
 * 文件会同时保存在浏览器本地和当前登录用户的私有云端空间。
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
  /** 本机副本所属的登录账号；旧单机版文件没有该字段。 */
  ownerId?: string;
  /** 云端对象路径；存在时下载和删除会同时操作私有云端副本。 */
  storagePath?: string;
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
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const record: StoredFile = {
    id: genId(),
    name: input.name,
    category: input.category,
    size: input.blob.size,
    blob: input.blob,
    createdAt: Date.now(),
    meta: input.meta,
    ownerId: auth.user?.id,
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => {
      db.close();
      // 云端同步失败不阻断当前导入；下次登录初始化时会再次补传。
      uploadFileToCloud(record).catch(() => {});
      resolve(record.id);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/** 获取本机文件，按创建时间倒序 */
async function getLocalFiles(ownerId?: string, includeLegacyFiles = false): Promise<StoredFile[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      db.close();
      const list = ((req.result as StoredFile[]) || []).filter((file) => {
        if (!ownerId) return true;
        return file.ownerId === ownerId || (includeLegacyFiles && !file.ownerId);
      });
      resolve(list.sort((a, b) => b.createdAt - a.createdAt));
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

interface CloudFileRow {
  id: string;
  name: string;
  category: FileCategory;
  size: number;
  created_at: string;
  meta: Record<string, unknown> | null;
  storage_path: string;
}

/** 获取全部文件：优先呈现云端清单，同时保留尚未上传成功的本机文件。 */
export async function getAllFiles(): Promise<StoredFile[]> {
  if (!supabase) return getLocalFiles();

  let userId: string | undefined;
  try {
    const { data: auth } = await supabase.auth.getUser();
    userId = auth.user?.id;
    const localFiles = await getLocalFiles(userId);
    if (!auth.user) return localFiles;
    const { data, error } = await supabase
      .from('user_files')
      .select('id, name, category, size, created_at, meta, storage_path')
      .order('created_at', { ascending: false });
    if (error || !data) return localFiles;

    const localById = new Map(localFiles.map((file) => [file.id, file]));
    const remoteFiles = (data as CloudFileRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      size: row.size,
      blob: localById.get(row.id)?.blob || new Blob(),
      createdAt: new Date(row.created_at).getTime(),
      meta: row.meta || undefined,
      storagePath: row.storage_path,
    }));
    const remoteIds = new Set(remoteFiles.map((file) => file.id));
    return [...remoteFiles, ...localFiles.filter((file) => !remoteIds.has(file.id))]
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return getLocalFiles(userId);
  }
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
      deleteCloudFile(id).catch(() => {});
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

/** 触发浏览器下载一个 StoredFile（必要时先从私有云端获取内容）。 */
export async function downloadStoredFile(file: StoredFile): Promise<void> {
  let blob = file.blob;
  if (file.storagePath && supabase) {
    const { data, error } = await supabase.storage.from(USER_FILES_BUCKET).download(file.storagePath);
    if (error) throw error;
    blob = data;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // 释放需延迟，避免某些浏览器下载被中断
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function uploadFileToCloud(file: StoredFile): Promise<void> {
  if (!supabase) return;
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return;
  if (file.ownerId && file.ownerId !== auth.user.id) return;

  const storagePath = `${auth.user.id}/${file.id}`;
  const { error: uploadError } = await supabase.storage
    .from(USER_FILES_BUCKET)
    .upload(storagePath, file.blob, { upsert: true, contentType: file.blob.type || undefined });
  if (uploadError) throw uploadError;

  const { error: metadataError } = await supabase.from('user_files').upsert(
    {
      id: file.id,
      user_id: auth.user.id,
      name: file.name,
      category: file.category,
      size: file.size,
      meta: file.meta || {},
      storage_path: storagePath,
      created_at: new Date(file.createdAt).toISOString(),
    },
    { onConflict: 'id' },
  );
  if (metadataError) throw metadataError;
}

async function deleteCloudFile(id: string): Promise<void> {
  if (!supabase) return;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  const { data } = await supabase
    .from('user_files')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle();
  if (data?.storage_path) await supabase.storage.from(USER_FILES_BUCKET).remove([data.storage_path]);
  await supabase.from('user_files').delete().eq('id', id);
}

/** 登录后调用：同步当前账号文件；仅首次迁移单机版文件。 */
export async function syncLocalFilesToCloud({ includeLegacyFiles = false } = {}): Promise<void> {
  if (!supabase) return;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  const files = await getLocalFiles(auth.user.id, includeLegacyFiles);
  await Promise.all(files.map((file) => uploadFileToCloud(file)));
}

export const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  'grade-excel': '成绩 Excel',
  'timetable-excel': '课表 Excel',
  'ranking-proof': '排名证明',
};
