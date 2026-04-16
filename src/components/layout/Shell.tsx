import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  FilePlus, 
  ListFilter, 
  Mail, 
  Settings, 
  Database,
  Search,
  LogOut,
  User,
  Activity,
  ShieldHalf
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Shell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { to: '/', icon: BarChart3, label: 'Dashboard' },
    { to: '/new-request', icon: FilePlus, label: 'New Request' },
    { to: '/tracker', icon: ListFilter, label: 'Request Tracker' },
    { to: '/ispl-pm', icon: Search, label: 'ISPL Workbench' },
    { to: '/dispatch', icon: Mail, label: 'Monthly Dispatch' },
    { to: '/master-data', icon: Database, label: 'Master Data' },
  ];

  if (user?.roles?.includes('ADMIN')) {
    navItems.push({ to: '/access', icon: ShieldHalf, label: 'Access Management' });
  }

  return (
    <div className="min-h-screen flex text-gray-800">
      {/* Sidebar */}
      <aside className="w-[240px] bg-brand-sidebar text-white flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <Activity className="text-white" size={24} />
          <span className="text-xl font-black tracking-tight uppercase">CC Control Tower</span>
        </div>
        
        <nav className="flex-1 py-4 space-y-0">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-6 py-3 transition-all
                ${isActive ? 'bg-white/15 opacity-100 border-l-[4px] border-white' : 'text-white/80 hover:bg-white/10 hover:opacity-100'}
              `}
            >
              <item.icon size={18} />
              <span className="font-medium text-[14px]">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10">
          <div className="flex items-center gap-3 text-white/70">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
              <User size={16} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[13px] font-bold text-white truncate">{user?.displayName || user?.email?.split('@')[0]}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                {user?.roles?.join(' | ') || 'User'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-0 py-3 mt-4 text-white/60 hover:text-white transition-colors cursor-pointer text-sm font-medium"
          >
            <LogOut size={16} />
            <span>Switch Account</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[240px] p-8 bg-brand-bg min-h-screen">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-[24px] font-semibold text-[#091E42]">Performance Workspace</h1>
            <p className="text-brand-text-subtle mt-1 text-[13px]">Manage and monitor cost center lifecycle requests</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100 uppercase tracking-widest">
                v1.0.0
             </div>
          </div>
        </header>
        
        <Outlet />
      </main>
    </div>
  );
}
