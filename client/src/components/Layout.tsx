
import React, { useState } from 'react';
import {
  LayoutDashboard,
  QrCode,
  BarChart3,
  Settings,
  Users,
  LogOut,
  ChevronDown,
  Globe,
  Database,
  Server
} from 'lucide-react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <div 
        onClick={() => {
          onClick?.();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors duration-200 ${
          active ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center space-x-3">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        {children && <ChevronDown className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
      </div>
      {isOpen && children && (
        <div className="bg-gray-50 py-2">
          {children}
        </div>
      )}
    </div>
  );
};

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onViewChange, onLogout }) => {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Globe className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-gray-800">LinkOS</span>
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 font-mono">v1.0</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <SidebarItem 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="仪表盘" 
            active={activeView === 'dashboard'} 
            onClick={() => onViewChange('dashboard')}
          />
          <SidebarItem
            icon={<QrCode className="w-5 h-5" />}
            label="我的活码"
            active={activeView === 'live-codes'}
            onClick={() => onViewChange('live-codes')}
          />
          <SidebarItem
            icon={<Server className="w-5 h-5" />}
            label="域名池管理"
            active={activeView === 'domain-pool'}
            onClick={() => onViewChange('domain-pool')}
          />
          <SidebarItem 
            icon={<BarChart3 className="w-5 h-5" />} 
            label="数据统计" 
            active={activeView === 'stats'}
            onClick={() => onViewChange('stats')}
          >
            <div className="pl-12 py-2 text-sm text-gray-500 hover:text-blue-600 cursor-pointer">访问分析</div>
            <div className="pl-12 py-2 text-sm text-gray-500 hover:text-blue-600 cursor-pointer">转化跟踪</div>
          </SidebarItem>
          <SidebarItem 
            icon={<Settings className="w-5 h-5" />} 
            label="系统设置" 
            active={activeView === 'settings'}
            onClick={() => onViewChange('settings')}
          />
          <SidebarItem 
            icon={<Users className="w-5 h-5" />} 
            label="用户管理" 
            active={activeView === 'users'}
            onClick={() => onViewChange('users')}
          />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={onLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">退出登录</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-[#001529] text-white flex items-center justify-between px-6 shadow-md z-10">
          <div className="flex items-center space-x-4">
             <h2 className="text-lg font-medium">LinkOS 管理后台</h2>
          </div>
          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-2 bg-blue-900/50 px-3 py-1 rounded border border-blue-400/30">
               <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
               <span className="text-sm font-mono flex items-center gap-1"><Database className="w-3 h-3"/> OSS: 已连接</span>
             </div>
             <div className="flex items-center space-x-2 bg-green-900/50 px-3 py-1 rounded border border-green-400/30 text-green-300">
                <span className="text-sm font-mono">JSON: 可读写</span>
             </div>
             <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold ring-2 ring-white/20">
               AD
             </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
