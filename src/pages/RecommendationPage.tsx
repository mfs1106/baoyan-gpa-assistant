import { useState } from 'react';
import { Trophy, Award, Users, User, Trash2, Plus, Calculator, GraduationCap, Info } from 'lucide-react';
import { useCourseStore } from '@/store/courseStore';
import { calculateGPA } from '@/utils/gpaCalculator';
import { useRecommendationStore, type CompetitionRecord } from '@/store/recommendationStore';

const AWARD_OPTIONS = [
  { value: 'provincial_first', label: '省级一等奖', category: 'provincial' },
  { value: 'provincial_special', label: '省级特等奖', category: 'provincial' },
  { value: 'national_third', label: '国家级三等奖', category: 'national' },
  { value: 'national_second', label: '国家级二等奖', category: 'national' },
  { value: 'national_first', label: '国家级一等奖', category: 'national' },
  { value: 'national_special', label: '国家级特等奖', category: 'national' },
];

const TEAM_SIZE_OPTIONS = [1, 2, 3, 4, 5];

export function RecommendationPage() {
  const courses = useCourseStore((state) => state.courses);
  const gpaResult = calculateGPA(courses);
  
  const competitions = useRecommendationStore((state) => state.competitions);
  const addCompetition = useRecommendationStore((state) => state.addCompetition);
  const deleteCompetition = useRecommendationStore((state) => state.deleteCompetition);
  const clearAllCompetitions = useRecommendationStore((state) => state.clearAllCompetitions);
  const calculateCompetitionBonus = useRecommendationStore((state) => state.calculateCompetitionBonus);
  const calculateTotalBonus = useRecommendationStore((state) => state.calculateTotalBonus);

  const [formData, setFormData] = useState({
    name: '',
    isFirstClass: true,
    awardLevel: 'provincial_first' as CompetitionRecord['awardLevel'],
    teamType: 'team' as 'individual' | 'team',
    teamSize: 3,
    rank: 1,
  });

  const totalBonus = calculateTotalBonus();
  const recommendationGPA = Math.round((gpaResult.gpa + totalBonus) * 1000) / 1000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    addCompetition({
      name: formData.name.trim(),
      isFirstClass: formData.isFirstClass,
      awardLevel: formData.awardLevel,
      teamType: formData.teamType,
      teamSize: formData.teamType === 'individual' ? 1 : formData.teamSize,
      rank: formData.teamType === 'individual' ? 1 : formData.rank,
    });

    setFormData({
      name: '',
      isFirstClass: true,
      awardLevel: 'provincial_first',
      teamType: 'team',
      teamSize: 3,
      rank: 1,
    });
  };

  const getAwardScore = (level: string) => {
    const scores: Record<string, number> = {
      national_special: 0.50,
      national_first: 0.40,
      national_second: 0.30,
      national_third: 0.25,
      provincial_special: 0.20,
      provincial_first: 0.10,
    };
    return scores[level] || 0;
  };

  const getAwardLabel = (level: string) => {
    return AWARD_OPTIONS.find((o) => o.value === level)?.label || level;
  };

  const getRankLabel = (teamSize: number, rank: number) => {
    const labels = ['', '第一作者', '第二作者', '第三作者', '第四作者', '第五作者'];
    if (teamSize === 1) return '个人';
    return labels[rank] || `第${rank}作者`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <GraduationCap size={28} />
          <h2 className="text-2xl font-bold">保研预测</h2>
        </div>
        <p className="text-white/80">根据竞赛获奖情况预测推免GPA</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Calculator className="text-primary-500" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">当前GPA</p>
              <p className="text-2xl font-bold text-gray-900">{gpaResult.gpa.toFixed(3)}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">加权平均学分绩点</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Award className="text-amber-500" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">竞赛加分</p>
              <p className="text-2xl font-bold text-amber-600">+{totalBonus.toFixed(3)}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">累计加分（最高0.5）</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Trophy className="text-white" size={20} />
            </div>
            <div>
              <p className="text-sm text-white/80">推免预测GPA</p>
              <p className="text-2xl font-bold text-white">{recommendationGPA.toFixed(3)}</p>
            </div>
          </div>
          <p className="text-xs text-white/60">当前GPA + 竞赛加分</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <Plus className="text-primary-500" size={20} />
            <div>
              <h3 className="text-lg font-bold text-gray-900">添加竞赛记录</h3>
              <p className="text-sm text-gray-500">填写竞赛获奖信息</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                竞赛名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如：中国国际大学生创新大赛"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                是否一类竞赛
              </label>
              <select
                value={formData.isFirstClass ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, isFirstClass: e.target.value === 'true' })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              >
                <option value="true">是</option>
                <option value="false">否</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                奖项等级 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.awardLevel}
                onChange={(e) => setFormData({ ...formData, awardLevel: e.target.value as CompetitionRecord['awardLevel'] })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                required
              >
                <optgroup label="省级">
                  {AWARD_OPTIONS.filter((o) => o.category === 'provincial').map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}（{getAwardScore(o.value)}分）
                    </option>
                  ))}
                </optgroup>
                <optgroup label="国家级（国际）">
                  {AWARD_OPTIONS.filter((o) => o.category === 'national').map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}（{getAwardScore(o.value)}分）
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                参赛类型
              </label>
              <select
                value={formData.teamType}
                onChange={(e) => {
                  const newType = e.target.value as 'individual' | 'team';
                  setFormData({
                    ...formData,
                    teamType: newType,
                    teamSize: newType === 'individual' ? 1 : formData.teamSize,
                    rank: newType === 'individual' ? 1 : formData.rank,
                  });
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              >
                <option value="team">团体赛</option>
                <option value="individual">个人赛（加分折半）</option>
              </select>
            </div>

            {formData.teamType === 'team' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    队伍人数
                  </label>
                  <select
                    value={formData.teamSize}
                    onChange={(e) => {
                      const newSize = parseInt(e.target.value);
                      setFormData({
                        ...formData,
                        teamSize: newSize,
                        rank: Math.min(formData.rank, newSize),
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  >
                    {TEAM_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size}人
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    个人排名（在队伍中的位次）
                  </label>
                  <select
                    value={formData.rank}
                    onChange={(e) => setFormData({ ...formData, rank: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  >
                    {Array.from({ length: formData.teamSize }, (_, i) => i + 1).map((rank) => (
                      <option key={rank} value={rank}>
                        {getRankLabel(formData.teamSize, rank)}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all"
            >
              添加竞赛记录
            </button>
          </form>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 text-amber-800 mb-2">
              <Info size={16} />
              <span className="font-medium text-sm">加分规则说明</span>
            </div>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>• 个人赛所有奖项加分折半（×0.5）</li>
              <li>• 团体赛按排名分配：2人(7:3)、3人(6:3:1)、4人(5:3:1:1)、5人(5:2:1:1:1)</li>
              <li>• 同一竞赛多次获奖按最高分计算，不同竞赛可累加</li>
              <li>• 累计加分不得超过0.5绩点</li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Trophy className="text-amber-500" size={20} />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">竞赛记录</h3>
                  <p className="text-sm text-gray-500">已添加 {competitions.length} 条记录</p>
                </div>
              </div>
              {competitions.length > 0 && (
                <button
                  onClick={clearAllCompetitions}
                  className="text-sm text-red-500 hover:text-red-600 transition-colors"
                >
                  清除全部
                </button>
              )}
            </div>

            {competitions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无竞赛记录</p>
                <p className="text-sm">请在左侧添加竞赛获奖信息</p>
              </div>
            ) : (
              <div className="space-y-3">
                {competitions.map((competition) => {
                  const bonus = calculateCompetitionBonus(competition);
                  return (
                    <div
                      key={competition.id}
                      className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-900">{competition.name}</span>
                            {competition.isFirstClass && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">
                                一类
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{getAwardLabel(competition.awardLevel)}</span>
                            <span className="flex items-center gap-1">
                              {competition.teamType === 'individual' ? (
                                <User size={14} />
                              ) : (
                                <Users size={14} />
                              )}
                              {competition.teamType === 'individual' ? '个人' : `${competition.teamSize}人`}
                            </span>
                            {competition.teamType === 'team' && (
                              <span>{getRankLabel(competition.teamSize, competition.rank)}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            bonus > 0 ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            +{bonus.toFixed(3)}
                          </p>
                          <button
                            onClick={() => deleteCompetition(competition.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors mt-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <GraduationCap size={24} />
              <h3 className="text-lg font-bold">推免GPA预测</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/80">当前加权GPA</span>
                <span className="font-medium">{gpaResult.gpa.toFixed(3)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">竞赛加分（最高0.5）</span>
                <span className="font-medium">+{totalBonus.toFixed(3)}</span>
              </div>
              <div className="border-t border-white/20 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">推免预测GPA</span>
                  <span className="text-2xl font-bold">{recommendationGPA.toFixed(3)}</span>
                </div>
              </div>
            </div>

            {totalBonus >= 0.5 && (
              <div className="mt-4 p-3 bg-white/20 rounded-lg">
                <p className="text-sm">
                  ✨ 恭喜！您的竞赛加分已达到上限0.5绩点
                </p>
              </div>
            )}

            {competitions.length === 0 && (
              <div className="mt-4 p-3 bg-white/10 rounded-lg">
                <p className="text-sm text-white/80">
                  💡 添加竞赛记录以计算推免加分
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <Info className="text-blue-500" size={20} />
          <h3 className="text-lg font-bold text-gray-900">加分细则说明</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">奖项等级</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">基础加分</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">个人赛加分</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">备注</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {AWARD_OPTIONS.map((option) => {
                const baseScore = getAwardScore(option.value);
                return (
                  <tr key={option.value}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{option.label}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-gray-600">{baseScore.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-amber-600">{(baseScore * 0.5).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500">
                      {option.category === 'national' ? '国家级' : '省级'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <h4 className="font-medium text-gray-900 mb-2">团体赛排名分配比例</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="font-bold text-gray-900">2人队</p>
              <p className="text-sm text-gray-600">70% : 30%</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="font-bold text-gray-900">3人队</p>
              <p className="text-sm text-gray-600">60% : 30% : 10%</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="font-bold text-gray-900">4人队</p>
              <p className="text-sm text-gray-600">50% : 30% : 10% : 10%</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="font-bold text-gray-900">5人队</p>
              <p className="text-sm text-gray-600">50% : 20% : 10% : 10% : 10%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
