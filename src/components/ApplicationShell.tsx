import React, { useState } from 'react';
import {
  Bell,
  Bot,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PieChart,
  Plus,
  Search,
  Settings,
  BarChart3,
  Target,
  WalletCards,
  X,
  Crown,
} from 'lucide-react';
import { ScreenId } from '../types';
import { useAuth } from '../context/AuthContext';

interface ApplicationShellProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  children: React.ReactNode;
}

const navigation = [
  { id: 'dashboard' as ScreenId, label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'transactions' as ScreenId, label: 'Giao dịch', icon: CreditCard },
  { id: 'wallets' as ScreenId, label: 'Ví', icon: WalletCards },
  { id: 'budget' as ScreenId, label: 'Ngân sách', icon: PieChart },
  { id: 'goals' as ScreenId, label: 'Mục tiêu', icon: Target },
  { id: 'reports' as ScreenId, label: 'Báo cáo', icon: BarChart3 },
];

const pageNames: Partial<Record<ScreenId, string>> = {
  dashboard: 'Tổng quan',
  transactions: 'Giao dịch & Ví',
  wallets: 'Ví',
  'ai-input': 'Nhập giao dịch nhanh',
  budget: 'Ngân sách',
  goals: 'Mục tiêu tài chính',
  reports: 'Báo cáo & Insights',
  notifications: 'Thông báo',
  settings: 'Cài đặt',
  'debt-reminders': 'Nhắc nhở',
};

export function ApplicationShell({
  currentScreen,
  onNavigate,
  children,
}: ApplicationShellProps) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navigate = (screen: ScreenId) => {
    onNavigate(screen);
    setDrawerOpen(false);
  };

  const sidebar = (
    <>
      <div className="flowfi-brand">
        <div className="flowfi-logo-mark">F</div>
        {!collapsed && (
          <div className="flowfi-brand-copy">
            <strong>FlowFi</strong>
            <span>Tài chính nhẹ nhàng</span>
          </div>
        )}
        <button
          className="flowfi-sidebar-toggle"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </button>
      </div>

      <button className="flowfi-add-button" onClick={() => navigate('ai-input')}>
        <Plus />
        {!collapsed && <span>Thêm giao dịch</span>}
      </button>

      <nav className="flowfi-navigation" aria-label="Điều hướng chính">
        {navigation.map((item, index) => {
          const Icon = item.icon;
          const isActive =
            currentScreen === item.id &&
            (item.label !== 'Ví' || index === 1);
          return (
            <button
              key={`${item.label}-${item.id}`}
              className={isActive ? 'active' : ''}
              onClick={() => navigate(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <Icon />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="flowfi-sidebar-footer">
        {!collapsed && (
          <div className="flowfi-upgrade-card">
            <Crown />
            <strong>Nâng cấp tài khoản</strong>
            <span>Mở khóa nhiều tính năng<br />nâng cao hơn</span>
            <button>Nâng cấp ngay</button>
          </div>
        )}
        <button onClick={() => navigate('settings')} title={collapsed ? 'Cài đặt' : undefined}>
          <Settings />
          {!collapsed && <span>Cài đặt</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className={`flowfi-shell ${collapsed ? 'is-collapsed' : ''} ${currentScreen === 'budget' ? 'budget-mode' : ''}`}>
      <aside className="flowfi-sidebar">{sidebar}</aside>

      {drawerOpen && (
        <div className="flowfi-drawer-layer" role="dialog" aria-modal="true">
          <button
            className="flowfi-drawer-backdrop"
            onClick={() => setDrawerOpen(false)}
            aria-label="Đóng menu"
          />
          <aside className="flowfi-mobile-drawer">
            <button
              className="flowfi-drawer-close"
              onClick={() => setDrawerOpen(false)}
              aria-label="Đóng menu"
            >
              <X />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flowfi-workspace">
        <header className="flowfi-header">
          <div className="flowfi-header-title">
            <button
              className="flowfi-mobile-menu"
              onClick={() => setDrawerOpen(true)}
              aria-label="Mở menu"
            >
              <Menu />
            </button>
            <div>
              <span>Không gian tài chính</span>
              <strong>{pageNames[currentScreen] ?? 'FlowFi'}</strong>
            </div>
          </div>

          <div className="flowfi-header-actions">
            <label className="flowfi-search">
              <Search />
              <input aria-label="Tìm kiếm" placeholder="Tìm giao dịch, ví..." />
              <kbd>⌘ K</kbd>
            </label>
            <button className="flowfi-icon-button" aria-label="Thông báo" onClick={() => navigate('notifications')}>
              <Bell />
              <span className="flowfi-notification-dot" />
            </button>
            <div className="flowfi-user">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" />
              ) : (
                <span>{user?.fullName?.charAt(0)?.toUpperCase() || 'U'}</span>
              )}
              <div>
                <strong>{user?.fullName || 'Người dùng FlowFi'}</strong>
                <small>{user?.email || 'Tài khoản cá nhân'}</small>
              </div>
              <ChevronRight />
            </div>
          </div>
        </header>

        <div className="flowfi-shell-content">{children}</div>
      </div>
    </div>
  );
}
