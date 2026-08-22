import { GraduationCap, Menu, X, LogOut } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  userEmail?: string;
  onSignOut?: () => void;
}

export function Header({ onToggleSidebar, isSidebarOpen, userEmail, onSignOut }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <GraduationCap className="text-white" size={22} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900">保研绩点助手</h1>
              <p className="text-xs text-gray-500">绩点 · 保研 · 课表</p>
            </div>
          </div>
        </div>
        {userEmail && onSignOut && (
          <button onClick={onSignOut} title="退出登录" className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
            <span className="max-w-40 truncate">{userEmail}</span>
            <LogOut size={17} />
          </button>
        )}
      </div>
    </header>
  );
}
