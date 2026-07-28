import type { ReactNode } from 'react';
import { BrainCircuit, LogOut, Shield, Users } from 'lucide-react';
import type { ScreenId } from '../../types';
import { useAuth } from '../../context/AuthContext';

export function AdminLayout({ active, onNavigate, children }: { active: 'users' | 'ai'; onNavigate: (screen: ScreenId) => void; children: ReactNode }) {
  const { logout } = useAuth();
  const item = (key: 'users' | 'ai', label: string, icon: ReactNode, screen: ScreenId) => (
    <button onClick={() => onNavigate(screen)} className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm transition ${active === key ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      {icon}{label}
    </button>
  );
  return <div className="admin-light min-h-screen bg-slate-50 text-slate-900 md:flex">
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6"><span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-600"><Shield className="h-4 w-4" /></span><div><p className="text-sm font-bold">Cổng quản trị</p><p className="text-[10px] text-slate-400">FlowFi Admin</p></div></div>
      <nav className="flex-1 space-y-1 p-4">{item('users', 'Quản lý người dùng', <Users className="h-4 w-4" />, 'admin-users')}{item('ai', 'Quản trị AI', <BrainCircuit className="h-4 w-4" />, 'admin-tokens')}</nav>
      <div className="border-t border-slate-200 p-4">
        <button onClick={async () => { await logout(); onNavigate('landing'); }} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50">
          <LogOut className="h-4 w-4" />Đăng xuất
        </button>
      </div>
    </aside>
    <main className="min-w-0 flex-1">{children}</main>
  </div>;
}
