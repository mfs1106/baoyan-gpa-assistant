import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { Course } from '@/types';
import { getGradeLevel } from '@/utils/gpaCalculator';

interface GradeDistributionProps {
  courses: Course[];
}

const COLORS = {
  'A+': '#10b981',
  'A': '#3b82f6',
  'A-': '#60a5fa',
  'B+': '#8b5cf6',
  'B': '#a78bfa',
  'B-': '#f59e0b',
  'C+': '#f97316',
  'C': '#fb923c',
  'C-': '#ef4444',
  'D': '#f87171',
  'F': '#9ca3af',
  'F-': '#6b7280',
};

export function GradeDistribution({ courses }: GradeDistributionProps) {
  const gradeCounts: Record<string, number> = {};
  
  courses.forEach((course) => {
    const level = getGradeLevel(course.score);
    gradeCounts[level] = (gradeCounts[level] || 0) + 1;
  });

  const data = Object.entries(gradeCounts).map(([name, value]) => ({
    name,
    value,
    color: COLORS[name as keyof typeof COLORS] || '#9ca3af',
  }));

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">成绩分布</h3>
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <p>暂无数据</p>
          <p className="text-sm mt-1">导入成绩后将显示分布图表</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-100">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-xs text-gray-500">{payload[0].value} 门课程</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">成绩分布</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
