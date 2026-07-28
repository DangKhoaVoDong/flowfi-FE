import React, { useState, useEffect, useRef } from 'react';
import { ScreenId } from './types';
import { LandingScreen } from './components/screens/LandingScreen';
import { UserDashboardScreen } from './components/screens/UserDashboardScreen';
import { TransactionsWalletsScreen } from './components/screens/TransactionsWalletsScreen';
import { AIProcessingScreen } from './components/screens/AIProcessingScreen';
import { BudgetRoadmapScreen } from './components/screens/BudgetRoadmapScreen';
import { DebtReminderScreen } from './components/screens/DebtReminderScreen';
import { AdminTokenScreen } from './components/screens/AdminTokenScreen';
import { AdminUserScreen } from './components/screens/AdminUserScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { currentAdminIdentity, getPostAuthScreen } from './services/adminAuth';
import { ApplicationShell } from './components/ApplicationShell';
import { GoalsScreen, NotificationsScreen, ReportsScreen, SettingsScreen, WalletsScreen } from './components/screens/ProductScreens';
import { pathForScreen, screenFromLocation } from './routing';

function ForbiddenScreen({ onNavigate }: { onNavigate: (screen: ScreenId) => void }) {
  return <main className="grid min-h-[70vh] place-items-center p-6 text-center"><div><h1 className="text-3xl font-bold">403 — Không có quyền truy cập</h1><p className="mt-3 text-slate-400">Tài khoản này không có quyền quản trị.</p><button onClick={() => onNavigate('dashboard')} className="mt-6 rounded-xl bg-blue-600 px-4 py-2 font-semibold">Về dashboard</button></div></main>;
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<ScreenId>(() => screenFromLocation());
  const prevAuthRef = useRef<boolean | null>(null);

  // Redirect after login and restore the correct area after a page refresh.
  useEffect(() => {
    if (isLoading) return;

    if (prevAuthRef.current === null) {
      prevAuthRef.current = isAuthenticated;
      if (isAuthenticated && screenFromLocation() === 'landing') {
        const next = getPostAuthScreen();
        window.history.replaceState({ screen: next }, '', pathForScreen(next));
        setCurrentScreen(next);
      }
      return;
    }
    
    // Auth state changed to authenticated
    if (isAuthenticated && !prevAuthRef.current) {
      prevAuthRef.current = true;
      const next = getPostAuthScreen();
      window.history.replaceState({ screen: next }, '', pathForScreen(next));
      setCurrentScreen(next);
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    const onPopState = () => setCurrentScreen(screenFromLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Reset on logout
  useEffect(() => {
    if (!isAuthenticated && !isLoading && prevAuthRef.current === true) {
      prevAuthRef.current = false;
    }
  }, [isAuthenticated, isLoading]);

  // Navigate to specific screen
  const handleNavigate = (screen: ScreenId) => {
    if (screen.startsWith('admin') && !currentAdminIdentity().isAdmin) {
      window.history.pushState({ screen: 'forbidden' }, '', pathForScreen('forbidden'));
      setCurrentScreen('forbidden');
      return;
    }
    window.history.pushState({ screen }, '', pathForScreen(screen));
    setCurrentScreen(screen);
  };

  const screen = (
    <>
      {currentScreen === 'dashboard' && (
        <UserDashboardScreen onNavigate={handleNavigate} />
      )}
      {currentScreen === 'transactions' && (
        <TransactionsWalletsScreen onNavigate={handleNavigate} />
      )}
      {currentScreen === 'ai-input' && (
        <AIProcessingScreen onNavigate={handleNavigate} />
      )}
      {currentScreen === 'budget' && (
        <BudgetRoadmapScreen onNavigate={handleNavigate} />
      )}
      {currentScreen === 'debt-reminders' && (
        <DebtReminderScreen onNavigate={handleNavigate} />
      )}
      {currentScreen === 'goals' && <GoalsScreen />}
      {currentScreen === 'wallets' && <WalletsScreen />}
      {currentScreen === 'reports' && <ReportsScreen />}
      {currentScreen === 'notifications' && <NotificationsScreen />}
      {currentScreen === 'settings' && <SettingsScreen />}
    </>
  );

  return (
    <div className="min-h-screen font-sans selection:bg-[#628141] selection:text-white">
        {currentScreen === 'landing' && (
          <LandingScreen onNavigate={handleNavigate} />
        )}
        {!currentScreen.startsWith('admin') &&
          currentScreen !== 'landing' &&
          currentScreen !== 'forbidden' && (
            <ApplicationShell currentScreen={currentScreen} onNavigate={handleNavigate}>
              {screen}
            </ApplicationShell>
        )}
        {currentScreen === 'admin-tokens' && (
          <AdminTokenScreen onNavigate={handleNavigate} />
        )}
        {currentScreen === 'admin-users' && (
          <AdminUserScreen onNavigate={handleNavigate} />
        )}
        {currentScreen === 'admin-audit' && (
          <AdminTokenScreen onNavigate={handleNavigate} />
        )}
        {currentScreen === 'forbidden' && <ForbiddenScreen onNavigate={handleNavigate} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
