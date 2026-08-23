import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_BONUS_SCORE = 0.5;

function normalizeBonus(value: number): number {
  const safeValue = Number.isFinite(value) ? value : 0;
  return Math.round(Math.max(0, Math.min(MAX_BONUS_SCORE, safeValue)) * 1000) / 1000;
}

export interface RankingStudent {
  id: string;
  studentId: string;
  name: string;
  college: string;
  major: string;
  direction: string;
  class: string;
  rawGPA: number;
  bonusScore: number;
  finalGPA: number;
  originalRank: number;
}

interface RankingStore {
  students: RankingStudent[];
  bonusList: Map<string, number>;
  nameBonusMap: Map<string, number>;
  addStudents: (students: Omit<RankingStudent, 'id' | 'bonusScore' | 'finalGPA'>[]) => void;
  addBonusList: (bonuses: { studentId: string; name: string; bonus: number }[]) => void;
  updateStudentGPA: (id: string, rawGPA: number) => void;
  updateStudentBonus: (id: string, bonus: number) => void;
  clearAll: () => void;
  getFilteredStudents: (major?: string, direction?: string) => RankingStudent[];
}

export const useRankingStore = create<RankingStore>()(
  persist(
    (set, get) => ({
      students: [],
      bonusList: new Map(),
      nameBonusMap: new Map(),

      addStudents: (students) => {
        const bonusList = get().bonusList;
        const nameBonusMap = get().nameBonusMap;
        const newStudents: RankingStudent[] = students.map((s) => {
          let bonus = normalizeBonus(bonusList.get(s.studentId) || 0);
          if (bonus === 0 && s.name) {
            bonus = normalizeBonus(nameBonusMap.get(s.name) || 0);
          }
          return {
            ...s,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            bonusScore: bonus,
            finalGPA: Math.round((s.rawGPA + bonus) * 1000) / 1000,
          };
        });
        set({ students: newStudents });
      },

      addBonusList: (bonuses) => {
        const existingBonusList = get().bonusList;
        const existingNameBonusMap = get().nameBonusMap;

        const bonusList = new Map<string, number>(existingBonusList);
        const nameBonusMap = new Map<string, number>(existingNameBonusMap);

        bonuses.forEach((b) => {
          const existingBonus = bonusList.get(b.studentId) || 0;
          bonusList.set(b.studentId, normalizeBonus(existingBonus + b.bonus));

          if (b.name) {
            const existingNameBonus = nameBonusMap.get(b.name) || 0;
            nameBonusMap.set(b.name, normalizeBonus(existingNameBonus + b.bonus));
          }
        });

        set({ bonusList, nameBonusMap });

        const updatedStudents = get().students.map((s) => {
          let bonus = normalizeBonus(bonusList.get(s.studentId) || 0);
          if (bonus === 0 && s.name) {
            bonus = normalizeBonus(nameBonusMap.get(s.name) || 0);
          }
          return {
            ...s,
            bonusScore: bonus,
            finalGPA: Math.round((s.rawGPA + bonus) * 1000) / 1000,
          };
        });
        set({ students: updatedStudents });
      },

      updateStudentGPA: (id, rawGPA) => {
        const bonusList = get().bonusList;
        const nameBonusMap = get().nameBonusMap;
        set((state) => ({
          students: state.students.map((s) => {
            if (s.id === id) {
              let bonus = normalizeBonus(bonusList.get(s.studentId) || 0);
              if (bonus === 0 && s.name) {
                bonus = normalizeBonus(nameBonusMap.get(s.name) || 0);
              }
              return {
                ...s,
                rawGPA: Math.round(rawGPA * 1000) / 1000,
                finalGPA: Math.round((rawGPA + bonus) * 1000) / 1000,
              };
            }
            return s;
          }),
        }));
      },

      updateStudentBonus: (id, bonus) => {
        set((state) => {
          const clampedBonus = normalizeBonus(bonus);
          const student = state.students.find((item) => item.id === id);
          const bonusList = new Map(state.bonusList);
          const nameBonusMap = new Map(state.nameBonusMap);

          // 手动修改的是该学生当前的累计总加分；同步保存到映射中，后续继续分批导入时会在此基础上累计。
          if (student?.studentId) bonusList.set(student.studentId, clampedBonus);
          if (student?.name) nameBonusMap.set(student.name, clampedBonus);

          return {
            bonusList,
            nameBonusMap,
            students: state.students.map((s) => {
              if (s.id === id) {
                return {
                  ...s,
                  bonusScore: clampedBonus,
                  finalGPA: Math.round((s.rawGPA + clampedBonus) * 1000) / 1000,
                };
              }
              return s;
            }),
          };
        });
      },

      clearAll: () => {
        set({ students: [], bonusList: new Map(), nameBonusMap: new Map() });
      },

      getFilteredStudents: (major, direction) => {
        let students = [...get().students];
        
        if (major && major !== 'all') {
          students = students.filter((s) => s.major === major);
        }
        if (direction && direction !== 'all') {
          students = students.filter((s) => s.direction === direction);
        }
        
        return students.sort((a, b) => b.finalGPA - a.finalGPA);
      },
    }),
    {
      name: 'ranking-storage',
      partialize: (state) => ({
        students: state.students,
        bonusList: Array.from(state.bonusList.entries()),
        nameBonusMap: Array.from(state.nameBonusMap.entries()),
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.bonusList && Array.isArray(state.bonusList)) {
          state.bonusList = new Map(state.bonusList.map(([studentId, bonus]) => [studentId, normalizeBonus(Number(bonus))]));
        }
        if (state && state.nameBonusMap && Array.isArray(state.nameBonusMap)) {
          state.nameBonusMap = new Map(state.nameBonusMap.map(([name, bonus]) => [name, normalizeBonus(Number(bonus))]));
        }
        if (state?.students) {
          state.students = state.students.map((student) => {
            const bonusScore = normalizeBonus(student.bonusScore);
            return {
              ...student,
              bonusScore,
              finalGPA: Math.round((student.rawGPA + bonusScore) * 1000) / 1000,
            };
          });
        }
      },
    }
  )
);

