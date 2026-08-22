import { useEffect, useState } from 'react';
import { Download, Trash2, HardDrive, FileSpreadsheet, Award, Inbox } from 'lucide-react';
import {
  getAllFiles,
  deleteFile,
  downloadStoredFile,
  FILE_CATEGORY_LABELS,
  type StoredFile,
  type FileCategory,
} from '@/utils/fileStorage';

export function MyFilesPage() {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await getAllFiles();
      setFiles(list);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定删除这个文件吗？删除后无法恢复。')) return;
    await deleteFile(id);
    load();
  };

  const handleDownload = async (file: StoredFile) => {
    try {
      await downloadStoredFile(file);
    } catch {
      window.alert('下载失败，请检查网络后重试。');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  const categoryIcon = (cat: FileCategory) => {
    if (cat === 'ranking-proof') return <Award size={18} className="text-amber-500" />;
    return <FileSpreadsheet size={18} className="text-green-500" />;
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
            <HardDrive className="text-white" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900">我的文件</h2>
            <p className="text-sm text-gray-500">
              上传的 Excel 和导出的证明均仅保存在本地浏览器，不会上传云端，换设备/换浏览器不可见。
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-primary-600">{files.length}</p>
            <p className="text-xs text-gray-400">个文件 · {formatSize(totalSize)}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center text-gray-400">
          加载中...
        </div>
      ) : files.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Inbox className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无本地文件</h3>
          <p className="text-gray-500 text-sm">
            上传成绩/课表 Excel，或导出排名证明后，文件会自动保留在这里，下次打开仍可查看与下载。
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {categoryIcon(file.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mt-1">
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      {FILE_CATEGORY_LABELS[file.category]}
                    </span>
                    <span>{formatSize(file.size)}</span>
                    <span>{formatDate(file.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleDownload(file)}
                    className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                    title="下载"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                    title="删除"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
