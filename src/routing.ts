import type { ScreenId } from './types';

const screenPaths: Partial<Record<ScreenId, string>> = {
  landing: '/',
  dashboard: '/dashboard',
  transactions: '/transactions',
  wallets: '/wallets',
  'ai-input': '/transactions/quick-add',
  'ai-image': '/transactions/import-image',
  budget: '/budgets',
  goals: '/goals',
  reports: '/reports',
  notifications: '/notifications',
  settings: '/settings',
  'debt-reminders': '/debt-reminders',
  'admin-tokens': '/admin/tokens',
  'admin-users': '/admin/users',
  'admin-audit': '/admin/audit',
  forbidden: '/forbidden',
};

export const pathForScreen = (screen: ScreenId) => screenPaths[screen] ?? '/dashboard';

export const screenFromLocation = (
  location: Pick<Location, 'pathname' | 'search'> = window.location,
): ScreenId => {
  const path = location.pathname.replace(/\/+$/, '') || '/';

  // Compatibility for the old budget URL: /?year=2026&month=7
  if (path === '/' && new URLSearchParams(location.search).has('year')) return 'budget';
  if (path === '/') return 'landing';
  if (path === '/dashboard') return 'dashboard';
  if (path === '/transactions/import-image') return 'ai-image';
  if (path === '/transactions/quick-add') return 'ai-input';
  if (path === '/transactions') return 'transactions';
  if (path === '/wallets') return 'wallets';
  if (path === '/budgets' || path.startsWith('/budgets/')) return 'budget';
  if (path === '/goals') return 'goals';
  if (path === '/reports') return 'reports';
  if (path === '/notifications') return 'notifications';
  if (path === '/settings') return 'settings';
  if (path === '/debt-reminders') return 'debt-reminders';
  if (path === '/admin/tokens') return 'admin-tokens';
  if (path === '/admin/users') return 'admin-users';
  if (path === '/admin/audit') return 'admin-audit';
  if (path === '/forbidden') return 'forbidden';
  return 'dashboard';
};
