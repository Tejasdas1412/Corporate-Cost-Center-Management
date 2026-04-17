import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, UserRole } from './context/AuthContext';
import Shell from './components/layout/Shell';
import Dashboard from './components/dashboard/Dashboard';
import NewRequest from './components/requests/NewRequest';
import Tracker from './components/requests/Tracker';
import ISPLWorkbench from './components/requests/ISPLWorkbench';
import MonthlyDispatch from './components/admin/MonthlyDispatch';
import MasterData from './components/master/MasterData';
import MasterDataReadOnly from './components/master/MasterDataReadOnly';
import UserManagement from './components/admin/UserManagement';
import { Activity, ShieldCheck, User as UserIcon, Loader2 } from 'lucide-react';

function AppContent() {
  const { user, login, isLoading } = useAuth();
  const [availableUsers, setAvailableUsers] = React.useState<any[]>([]);
  const [fetchingUsers, setFetchingUsers] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setAvailableUsers(data);
        setFetchingUsers(false);
      })
      .catch(() => setFetchingUsers(false));
  }, []);

  if (isLoading || fetchingUsers) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-sidebar">
      <div className="flex flex-col items-center gap-4">
        <Activity className="text-white animate-pulse" size={64} />
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-sidebar p-6">
      <div className="max-w-md w-full text-center space-y-12">
        <div className="flex flex-col items-center gap-6">
           <div className="w-20 h-20 bg-brand-primary rounded-2xl flex items-center justify-center shadow-2xl rotate-12">
              <Activity className="text-white -rotate-12" size={40} />
           </div>
           <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">CC Control Tower</h1>
              <p className="text-white/60 mt-2 font-medium">Enterprise Management Portal</p>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[4px] border border-white/10 space-y-6 shadow-2xl">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#091E42]">Select Employee Account</h2>
            <p className="text-brand-text-subtle text-sm">Select a dummy profile to enter the system.</p>
          </div>
          
          <div className="space-y-3">
            {availableUsers.map((u) => (
              <button 
                key={u.id}
                onClick={() => login({
                  ...u,
                  roles: u.roles ? u.roles.split(',') : []
                })}
                className="w-full flex items-center gap-4 p-4 border border-brand-border rounded-[4px] hover:border-brand-primary hover:bg-brand-bg transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                   <UserIcon size={20} />
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-sm font-bold text-[#091E42] truncate">{u.displayName}</p>
                  <p className="text-[11px] text-brand-text-subtle uppercase font-bold tracking-tight">
                    {u.roles?.split(',').join(' | ') || 'No Roles'}
                  </p>
                </div>
              </button>
            ))}
            {availableUsers.length === 0 && (
              <div className="flex flex-col items-center gap-2 p-8 text-brand-text-subtle">
                <Loader2 className="animate-spin" size={24} />
                <p className="text-xs">Initializing gateway...</p>
              </div>
            )}
          </div>
          
          <div className="pt-4 flex items-center justify-center gap-2 text-brand-text-subtle text-[10px] uppercase font-bold tracking-widest">
            <ShieldCheck size={14} />
            Mock Identity Gateway
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new-request" element={<NewRequest />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/ispl-pm" element={<ISPLWorkbench />} />
          <Route path="/dispatch" element={<MonthlyDispatch />} />
          <Route path="/master-data" element={user?.roles?.includes('ADMIN') ? <MasterData /> : <Navigate to="/" />} />
          <Route path="/master-view" element={<MasterDataReadOnly />} />
          <Route path="/access" element={user?.roles?.includes('ADMIN') ? <UserManagement /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
