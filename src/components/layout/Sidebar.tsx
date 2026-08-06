import { Home, Upload, Calculator, BookOpen, Calendar, TrendingUp, GraduationCap, Award } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/import', icon: Upload, label: '成绩导入' },
  { path: '/predict', icon: Calculator, label: '成绩预测' },
  { path: '/courses', icon: BookOpen, label: '课程管理' },
  { path: '/analysis', icon: TrendingUp, label: '成绩分析' },
  { path: '/recommendation', icon: GraduationCap, label: '保研预测' },
  { path: '/ranking', icon: Award, label: '保研排名' },
  { path: '/timetable', icon: Calendar, label: '我的课表' },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onToggle}
      />
      <aside
        className={`fixed left-0 top-16 bottom-0 w-64 bg-gray-50 border-r border-gray-200 z-50 transition-transform md:translate-x-0 md:relative md:top-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onToggle}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/25'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}
