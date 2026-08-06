import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CompetitionRecord {
  id: string;
  name: string;
  isFirstClass: boolean;
  awardLevel: 'national_special' | 'national_first' | 'national_second' | 'national_third' | 'provincial_special' | 'provincial_first';
  teamType: 'individual' | 'team';
  teamSize: number;
  rank: number;
}

interface RecommendationStore {
  competitions: CompetitionRecord[];
  addCompetition: (record: Omit<CompetitionRecord, 'id'>) => void;
  updateCompetition: (id: string, updates: Partial<CompetitionRecord>) => void;
  deleteCompetition: (id: string) => void;
  clearAllCompetitions: () => void;
  calculateTotalBonus: () => number;
  calculateCompetitionBonus: (record: CompetitionRecord) => number;
}

const AWARD_SCORES: Record<string, number> = {
  national_special: 0.50,
  national_first: 0.40,
  national_second: 0.30,
  national_third: 0.25,
  provincial_special: 0.20,
  provincial_first: 0.10,
};

const TEAM_RATIOS: Record<number, number[]> = {
  2: [0.7, 0.3],
  3: [0.6, 0.3, 0.1],
  4: [0.5, 0.3, 0.1, 0.1],
  5: [0.5, 0.2, 0.1, 0.1, 0.1],
};

export const useRecommendationStore = create<RecommendationStore>()(
  persist(
    (set, get) => ({
      competitions: [],

      addCompetition: (record) => {
        const newRecord: CompetitionRecord = {
          ...record,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        };
        set((state) => ({ competitions: [...state.competitions, newRecord] }));
      },

      updateCompetition: (id, updates) => {
        set((state) => ({
          competitions: state.competitions.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      deleteCompetition: (id) => {
        set((state) => ({
          competitions: state.competitions.filter((c) => c.id !== id),
        }));
      },

      clearAllCompetitions: () => {
        set({ competitions: [] });
      },

      calculateCompetitionBonus: (record) => {
        const baseScore = AWARD_SCORES[record.awardLevel];
        if (!baseScore) return 0;

        let bonus = baseScore;

        if (record.teamType === 'individual') {
          bonus *= 0.5;
        } else {
          const teamSize = Math.min(record.teamSize, 5);
          const ratios = TEAM_RATIOS[teamSize];
          if (ratios && record.rank >= 1 && record.rank <= ratios.length) {
            bonus *= ratios[record.rank - 1];
          } else {
            return 0;
          }
        }

        return Math.round(bonus * 1000) / 1000;
      },

      calculateTotalBonus: () => {
        const bonuses = get().competitions.map((c) =>
          get().calculateCompetitionBonus(c)
        );
        const total = bonuses.reduce((sum, b) => sum + b, 0);
        return Math.min(total, 0.5);
      },
    }),
    {
      name: 'recommendation-storage',
      partialize: (state) => ({ competitions: state.competitions }),
    }
  )
);
