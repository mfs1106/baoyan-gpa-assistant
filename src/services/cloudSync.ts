import { useCourseStore } from '@/store/courseStore';
import { useTimetableStore } from '@/store/timetableStore';
import { useReminderStore } from '@/store/reminderStore';
import { useRecommendationStore } from '@/store/recommendationStore';
import { useRankingStore } from '@/store/rankingStore';
import { parseWeekSchedule } from '@/utils/timetableParser';
import { supabase } from '@/lib/supabase';

export interface CloudSnapshot {
  version: 1;
  courses: ReturnType<typeof useCourseStore.getState>['courses'];
  timetable: Pick<ReturnType<typeof useTimetableStore.getState>, 'courses' | 'semester' | 'startDate' | 'currentWeek'>;
  reminders: ReturnType<typeof useReminderStore.getState>['reminders'];
  competitions: ReturnType<typeof useRecommendationStore.getState>['competitions'];
  ranking: {
    students: ReturnType<typeof useRankingStore.getState>['students'];
    bonusList: [string, number][];
    nameBonusMap: [string, number][];
  };
}

/** 空白快照用于在同一浏览器切换到另一个新账号时清除前一位用户的本地状态。 */
export function createEmptyCloudSnapshot(): CloudSnapshot {
  return {
    version: 1,
    courses: [],
    timetable: { courses: [], semester: '', startDate: '', currentWeek: 1 },
    reminders: [],
    competitions: [],
    ranking: { students: [], bonusList: [], nameBonusMap: [] },
  };
}

export function getLocalSnapshot(): CloudSnapshot {
  const timetable = useTimetableStore.getState();
  const ranking = useRankingStore.getState();

  return {
    version: 1,
    courses: useCourseStore.getState().courses,
    timetable: {
      courses: timetable.courses,
      semester: timetable.semester,
      startDate: timetable.startDate,
      currentWeek: timetable.currentWeek,
    },
    reminders: useReminderStore.getState().reminders,
    competitions: useRecommendationStore.getState().competitions,
    ranking: {
      students: ranking.students,
      bonusList: Array.from(ranking.bonusList.entries()),
      nameBonusMap: Array.from(ranking.nameBonusMap.entries()),
    },
  };
}

export function applyCloudSnapshot(snapshot: CloudSnapshot): void {
  if (!snapshot || snapshot.version !== 1) {
    throw new Error('云端数据版本不兼容');
  }

  useCourseStore.setState({ courses: snapshot.courses || [] });
  useTimetableStore.setState({
    courses: snapshot.timetable?.courses || [],
    semester: snapshot.timetable?.semester || '',
    startDate: snapshot.timetable?.startDate || '',
    currentWeek: snapshot.timetable?.currentWeek || 1,
    weekSchedule: parseWeekSchedule(
      snapshot.timetable?.courses || [],
      snapshot.timetable?.currentWeek || 1,
    ),
  });
  useReminderStore.setState({ reminders: snapshot.reminders || [] });
  useRecommendationStore.setState({ competitions: snapshot.competitions || [] });
  useRankingStore.setState({
    students: snapshot.ranking?.students || [],
    bonusList: new Map(snapshot.ranking?.bonusList || []),
    nameBonusMap: new Map(snapshot.ranking?.nameBonusMap || []),
  });
}

export async function loadCloudSnapshot(userId: string): Promise<CloudSnapshot | null> {
  if (!supabase) throw new Error('云端服务尚未配置');

  const { data, error } = await supabase
    .from('user_snapshots')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.data ? (data.data as CloudSnapshot) : null;
}

export async function saveCloudSnapshot(userId: string): Promise<void> {
  if (!supabase) throw new Error('云端服务尚未配置');

  const { error } = await supabase.from('user_snapshots').upsert(
    {
      user_id: userId,
      data: getLocalSnapshot(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) throw error;
}
