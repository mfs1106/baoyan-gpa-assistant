import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Award, AlertTriangle, Target } from 'lucide-react';
import { useCourseStore } from '@/store/courseStore';
import { calculateGPA } from '@/utils/gpaCalculator';
import { getGPATrendData, calculateCumulativeGPAs, calculateAllCourseImpacts, getTopImpactCourses, getBottomImpactCourses } from '@/utils/gradeAnalysis';

export function GradeAnalysisPage() {
  const courses = useCourseStore((state) => state.courses);
  const gpaResult = calculateGPA(courses);
  
  const [trendType, setTrendType] = useState<'semester' | 'year'>('semester');
  const [showCumulative, setShowCumulative] = useState(true);
  
  const trendData = getGPATrendData(courses, trendType);
  const cumulativeData = calculateCumulativeGPAs(courses);
  const allImpacts = calculateAllCourseImpacts(courses);
  const topImpacts = getTopImpactCourses(courses, 5);
  const bottomImpacts = getBottomImpactCourses(courses, 5);

  const allGPAs = [...trendData.map(d => d.gpa), ...cumulativeData.map(d => d.gpa)];
  const minGPA = Math.min(...allGPAs);
  const maxGPA = Math.max(...allGPAs);
  const padding = 0.3;
  const yAxisMin = Math.max(0, Math.floor(minGPA * 10) / 10 - padding);
  const yAxisMax = Math.min(4.5, Math.ceil(maxGPA * 10) / 10 + padding);
  
  const getImpactColor = (impactPercent: number) => {
    if (impactPercent > 10) return '#EF4444';
    if (impactPercent > 5) return '#F59E0B';
    return '#10B981';
  };
  
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
          <p className="font-medium text-gray-900">{data.label}</p>
          <p className="text-sm text-gray-600">GPA: <span className="font-bold text-primary-600">{data.gpa.toFixed(3)}</span></p>
          <p className="text-sm text-gray-600">课程数: {data.courseCount}门</p>
          <p className="text-sm text-gray-600">学分: {data.totalCredits}</p>
        </div>
      );
    }
    return null;
  };

  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={28} />
            <h2 className="text-2xl font-bold">成绩分析</h2>
          </div>
          <p className="text-white/80">分析你的成绩趋势和课程影响</p>
        </div>
        
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无成绩数据</h3>
          <p className="text-gray-500">请先导入成绩数据后再进行分析</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp size={28} />
          <h2 className="text-2xl font-bold">成绩分析</h2>
        </div>
        <p className="text-white/80">分析你的成绩趋势和课程影响</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Award className="text-primary-500" size={20} />
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
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Target className="text-green-500" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">总学分</p>
              <p className="text-2xl font-bold text-gray-900">{gpaResult.totalCredits}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">已修读学分</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <BarChart3 className="text-blue-500" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">课程总数</p>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">学位课 {gpaResult.degreeCourses.length} 门</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">GPA趋势分析</h3>
            <p className="text-sm text-gray-500">查看学期/学年的GPA变化曲线</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTrendType('semester')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  trendType === 'semester'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                学期
              </button>
              <button
                onClick={() => setTrendType('year')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  trendType === 'year'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                学年
              </button>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showCumulative}
                onChange={(e) => setShowCumulative(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              显示累计GPA
            </label>
          </div>
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 30, left: 50, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
              <XAxis 
                dataKey="label" 
                angle={-60} 
                textAnchor="end" 
                tick={{ fontSize: 10, fill: '#6B7280' }}
                height={60}
              />
              <YAxis 
                domain={[yAxisMin, yAxisMax]} 
                tickFormatter={(v) => v.toFixed(2)} 
                tick={{ fontSize: 11, fill: '#6B7280' }}
                allowDecimals={true}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="gpa"
                name="学期GPA"
                stroke="#4F46E5"
                strokeWidth={2.5}
                dot={{ fill: '#4F46E5', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 8 }}
              />
              {showCumulative && cumulativeData.length > 0 && (
                <Line
                  type="monotone"
                  dataKey="gpa"
                  name="累计GPA"
                  data={cumulativeData}
                  stroke="#10B981"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 8 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {trendData.length > 1 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">GPA变化趋势</p>
                <p className={`text-lg font-bold ${
                  trendData[trendData.length - 1].gpa >= trendData[0].gpa 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {trendData[trendData.length - 1].gpa >= trendData[0].gpa ? '↑' : '↓'}
                  {Math.abs(trendData[trendData.length - 1].gpa - trendData[0].gpa).toFixed(3)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">最高GPA</p>
                <p className="text-lg font-bold text-blue-600">
                  {Math.max(...trendData.map(d => d.gpa)).toFixed(3)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">最低GPA</p>
                <p className="text-lg font-bold text-orange-600">
                  {Math.min(...trendData.map(d => d.gpa)).toFixed(3)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="text-primary-500" size={20} />
            <div>
              <h3 className="text-lg font-bold text-gray-900">课程影响权重排名</h3>
              <p className="text-sm text-gray-500">对总GPA影响最大的课程</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {topImpacts.map((impact, index) => (
              <div key={impact.course.id} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{impact.course.name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      impact.course.type === 'degree' 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'bg-green-50 text-green-600'
                    }`}>
                      {impact.course.type === 'degree' ? '学位课' : '非学位课'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all"
                        style={{ width: `${Math.min(impact.impactPercent, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-20 text-right">
                      {impact.impactPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                    <span>{impact.course.score}分</span>
                    <span>{impact.course.credit}学分</span>
                    <span>绩点{impact.course.gradePoint}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {topImpacts.length === 0 && (
            <p className="text-center text-gray-500 py-8">暂无课程数据</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <PieChartIcon className="text-primary-500" size={20} />
            <div>
              <h3 className="text-lg font-bold text-gray-900">课程类型分布</h3>
              <p className="text-sm text-gray-500">学位课与非学位课占比</p>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: '学位课', value: gpaResult.degreeCourses.length, color: '#4F46E5' },
                    { name: '非学位课', value: gpaResult.nonDegreeCourses.length, color: '#10B981' },
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#4F46E5" />
                  <Cell fill="#10B981" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-600">学位课 {gpaResult.degreeCourses.length}门</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-gray-600">非学位课 {gpaResult.nonDegreeCourses.length}门</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="text-amber-500" size={20} />
          <div>
            <h3 className="text-lg font-bold text-gray-900">课程影响详情</h3>
            <p className="text-sm text-gray-500">每门课程对GPA的具体影响</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  课程名称
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  学分
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  成绩
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  绩点
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  影响权重
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  影响分数
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allImpacts.map((impact) => (
                <tr key={impact.course.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{impact.course.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      impact.course.type === 'degree' 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'bg-green-50 text-green-600'
                    }`}>
                      {impact.course.type === 'degree' ? '学位课' : '非学位课'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-600">{impact.course.credit}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-600">{impact.course.score}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-600">{impact.course.gradePoint}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{ 
                            width: `${Math.min(impact.impactPercent, 100)}%`,
                            backgroundColor: getImpactColor(impact.impactPercent)
                          }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${
                        impact.impactPercent > 10 ? 'text-red-600' : impact.impactPercent > 5 ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        {impact.impactPercent.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-600">{impact.weightedScore.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {bottomImpacts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-800 mb-2">
            <AlertTriangle size={18} />
            <span className="font-medium">影响较低的课程</span>
          </div>
          <p className="text-sm text-amber-600">
            以下课程对GPA影响较小，可以适当调整学习策略：
            {bottomImpacts.map(i => i.course.name).join('、')}
          </p>
        </div>
      )}
    </div>
  );
}
