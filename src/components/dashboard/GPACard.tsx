import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface GPACardProps {
  gpa: number;
  change?: number;
}

export function GPACard({ gpa, change }: GPACardProps) {
  const getChangeIcon = () => {
    if (!change) return <Minus className="text-gray-400" size={16} />;
    if (change > 0) return <TrendingUp className="text-green-500" size={16} />;
    return <TrendingDown className="text-red-500" size={16} />;
  };

  const getChangeText = () => {
    if (!change) return '暂无变化';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}`;
  };

  const getChangeColor = () => {
    if (!change) return 'text-gray-400';
    return change > 0 ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div className="bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl p-6 text-white shadow-xl shadow-primary-500/30 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      <div className="relative z-10">
        <p className="text-sm text-white/80 mb-2">加权平均学分绩点</p>
        <div className="flex items-end gap-2">
          <span className="text-5xl font-bold">{gpa.toFixed(3)}</span>
          <span className="text-xl text-white/60 mb-1">/ 4.5</span>
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-4">
            {getChangeIcon()}
            <span className={`text-sm font-medium ${getChangeColor()}`}>
              {getChangeText()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
