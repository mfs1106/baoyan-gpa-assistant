import { useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Cloud, Loader2 } from 'lucide-react';
import {
  applyCloudSnapshot,
  createEmptyCloudSnapshot,
  loadCloudSnapshot,
  saveCloudSnapshot,
} from '@/services/cloudSync';
import { useCourseStore } from '@/store/courseStore';
import { useTimetableStore } from '@/store/timetableStore';
import { useReminderStore } from '@/store/reminderStore';
import { useRecommendationStore } from '@/store/recommendationStore';
import { useRankingStore } from '@/store/rankingStore';
import { syncLocalFilesToCloud } from '@/utils/fileStorage';

interface CloudDataSyncProps {
  user: User;
  children: React.ReactNode;
}

const LAST_ACTIVE_ACCOUNT_KEY = 'gpa-assistant:last-active-account';

export function CloudDataSync({ user, children }: CloudDataSyncProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let disposed = false;
    const initialize = async () => {
      setStatus('loading');
      setError('');
      try {
        const previousUserId = localStorage.getItem(LAST_ACTIVE_ACCOUNT_KEY);
        const cloudSnapshot = await loadCloudSnapshot(user.id);
        if (disposed) return;
        if (cloudSnapshot) {
          applyCloudSnapshot(cloudSnapshot);
        } else if (previousUserId && previousUserId !== user.id) {
          // 共享设备上注册一个新账号时，绝不能把上一位用户残留在浏览器里的数据上传给新账号。
          applyCloudSnapshot(createEmptyCloudSnapshot());
          await saveCloudSnapshot(user.id);
        } else {
          // 首次接入云端时，将旧单机版数据迁移进当前账号。
          await saveCloudSnapshot(user.id);
        }
        await syncLocalFilesToCloud({ includeLegacyFiles: !previousUserId });
        localStorage.setItem(LAST_ACTIVE_ACCOUNT_KEY, user.id);
        if (!disposed) setStatus('ready');
      } catch (caught) {
        if (!disposed) {
          setError(caught instanceof Error ? caught.message : '无法连接云端数据。');
          setStatus('error');
        }
      }
    };
    initialize();
    return () => { disposed = true; };
  }, [user.id]);

  useEffect(() => {
    if (status !== 'ready') return;
    const queueSave = () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveCloudSnapshot(user.id).catch((caught) => {
          setError(caught instanceof Error ? caught.message : '云端同步失败，将在下次数据变更时重试。');
        });
      }, 800);
    };
    const unsubscribe = [
      useCourseStore.subscribe(queueSave),
      useTimetableStore.subscribe(queueSave),
      useReminderStore.subscribe(queueSave),
      useRecommendationStore.subscribe(queueSave),
      useRankingStore.subscribe(queueSave),
    ];
    return () => {
      unsubscribe.forEach((fn) => fn());
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [status, user.id]);

  if (status === 'loading') return <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4"><div className="text-center text-gray-600"><Loader2 className="animate-spin text-primary-500 mx-auto mb-3" size={30} /><p className="font-medium">正在安全加载你的云端数据...</p></div></main>;
  if (status === 'error') return <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4"><div className="w-full max-w-md text-center bg-white border border-red-100 rounded-2xl p-7 shadow-sm"><Cloud className="text-red-500 mx-auto mb-3" size={32} /><h1 className="font-bold text-gray-900">云端数据暂时无法加载</h1><p className="text-sm text-red-600 mt-3 break-words">{error}</p><button onClick={() => window.location.reload()} className="mt-5 px-4 py-2 rounded-xl bg-primary-500 text-white font-medium">重新连接</button></div></main>;
  return <>{error && <div className="fixed z-[70] bottom-4 left-4 max-w-sm bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm shadow-lg">云端同步提醒：{error}</div>}{children}</>;
}
