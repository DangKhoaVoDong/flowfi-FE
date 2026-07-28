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
import { AdminAuditScreen } from './components/screens/AdminAuditScreen';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('landing');
  const prevAuthRef = useRef<boolean | null>(null);

  // Redirect to dashboard when authenticated (watch for auth state changes)
  useEffect(() => {
    // Skip initial render
    if (prevAuthRef.current === null) {
      prevAuthRef.current = isAuthenticated;
      return;
    }
    
    // Auth state changed to authenticated
    if (isAuthenticated && !isLoading && !prevAuthRef.current) {
      prevAuthRef.current = true;
      setCurrentScreen('dashboard');
    }
  }, [isAuthenticated, isLoading]);

  // Reset on logout
  useEffect(() => {
    if (!isAuthenticated && !isLoading && prevAuthRef.current === true) {
      prevAuthRef.current = false;
    }
  }, [isAuthenticated, isLoading]);

  // Navigate to specific screen
  const handleNavigate = (screen: ScreenId) => {
    setCurrentScreen(screen);
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Minimal Header with Logo */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md">
              F
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">FLOWFI</span>
          </div>
        </div>
      </header>

      {/* Main Screen View */}
      <div className="flex-1 min-w-0">
        {currentScreen === 'landing' && (
          <LandingScreen onNavigate={handleNavigate} />
        )}
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
        {currentScreen === 'admin-tokens' && (
          <AdminTokenScreen onNavigate={handleNavigate} />
        )}
        {currentScreen === 'admin-users' && (
          <AdminUserScreen onNavigate={handleNavigate} />
        )}
        {currentScreen === 'admin-audit' && (
          <AdminAuditScreen onNavigate={handleNavigate} />
        )}
      </div>
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
