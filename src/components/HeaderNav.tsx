import React from 'react';
import { ScreenId } from '../types';
import { Shield, User, Image, Sparkles, ChevronRight, Layers } from 'lucide-react';

interface HeaderNavProps {
  currentScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  onOpenMockupModal: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentScreen,
  onSelectScreen,
  onOpenMockupModal,
}) => {
  const userScreens: { id: ScreenId; label: string; num: string }[] = [
    { id: 'landing', label: '1. Hướng dẫn & Đăng nhập', num: 'Màn 1' },
    { id: 'dashboard', label: '2. Dashboard Người dùng', num: 'Màn 2' },
    { id: 'transactions', label: '3. Ví & Giao dịch', num: 'Màn 3' },
    { id: 'ai-input', label: '4. Xử lý Giao dịch AI', num: 'Màn 4' },
    { id: 'budget', label: '5. Ngân sách 12 Tháng', num: 'Màn 5' },
  ];

  const adminScreens: { id: ScreenId; label: string; num: string }[] = [
    { id: 'admin-tokens', label: '6. Giám sát Token & Session', num: 'Màn 6' },
    { id: 'admin-users', label: '7. Quản lý Người dùng', num: 'Màn 7' },
    { id: 'admin-audit', label: '8. Nhật ký Hệ thống', num: 'Màn 8' },
  ];

  const isAdminScreen = currentScreen.startsWith('admin');

  return (
    <div className={`border-b transition-colors ${isAdminScreen ? 'bg-[#0F172A] border-slate-800 text-slate-100' : 'bg-slate-900 border-slate-800 text-white'}`}>
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Switcher Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-base tracking-tight text-indigo-400">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
              F
            </div>
            <span>FlowFi Studio</span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          <span className="text-xs text-slate-400 hidden sm:inline-flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Choose Screen:
          </span>
        </div>

        {/* Screen Buttons Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar text-xs">
          {/* User Section */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 flex items-center gap-1">
              <User className="w-3 h-3 text-blue-400" />
              User
            </span>
            {userScreens.map((s) => {
              const active = currentScreen === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelectScreen(s.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                  title={s.label}
                >
                  <span className="text-[10px] opacity-75">{s.num}:</span>
                  <span>{s.label.split('. ')[1]}</span>
                </button>
              );
            })}
          </div>

          {/* Admin Section */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-amber-400 px-1.5 flex items-center gap-1">
              <Shield className="w-3 h-3 text-amber-400" />
              Admin
            </span>
            {adminScreens.map((s) => {
              const active = currentScreen === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelectScreen(s.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                    active
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                  title={s.label}
                >
                  <span className="text-[10px] opacity-75">{s.num}:</span>
                  <span>{s.label.split('. ')[1]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* View Original Mockup Image Button */}
        <button
          onClick={onOpenMockupModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/90 hover:bg-indigo-600 text-white transition-all shadow-sm border border-indigo-500/50"
        >
          <Image className="w-3.5 h-3.5" />
          <span>Xem Ảnh Mẫu</span>
        </button>
      </div>
    </div>
  );
};
