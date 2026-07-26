import React, { useState } from 'react';
import { ScreenId } from './types';
import { HeaderNav } from './components/HeaderNav';
import { OriginalImageModal } from './components/OriginalImageModal';
import { LandingScreen } from './components/screens/LandingScreen';
import { UserDashboardScreen } from './components/screens/UserDashboardScreen';
import { TransactionsWalletsScreen } from './components/screens/TransactionsWalletsScreen';
import { AIProcessingScreen } from './components/screens/AIProcessingScreen';
import { BudgetRoadmapScreen } from './components/screens/BudgetRoadmapScreen';
import { AdminTokenScreen } from './components/screens/AdminTokenScreen';
import { AdminUserScreen } from './components/screens/AdminUserScreen';
import { AdminAuditScreen } from './components/screens/AdminAuditScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('landing');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Persistent Navigation Header to switch between all 8 FlowFi screens */}
      <HeaderNav
        currentScreen={currentScreen}
        onSelectScreen={setCurrentScreen}
        onOpenMockupModal={() => setIsModalOpen(true)}
      />

      {/* Main Screen View */}
      <div className="flex-1 min-w-0">
        {currentScreen === 'landing' && (
          <LandingScreen onNavigate={setCurrentScreen} />
        )}
        {currentScreen === 'dashboard' && (
          <UserDashboardScreen onNavigate={setCurrentScreen} />
        )}
        {currentScreen === 'transactions' && (
          <TransactionsWalletsScreen onNavigate={setCurrentScreen} />
        )}
        {currentScreen === 'ai-input' && (
          <AIProcessingScreen onNavigate={setCurrentScreen} />
        )}
        {currentScreen === 'budget' && (
          <BudgetRoadmapScreen onNavigate={setCurrentScreen} />
        )}
        {currentScreen === 'admin-tokens' && (
          <AdminTokenScreen onNavigate={setCurrentScreen} />
        )}
        {currentScreen === 'admin-users' && (
          <AdminUserScreen onNavigate={setCurrentScreen} />
        )}
        {currentScreen === 'admin-audit' && (
          <AdminAuditScreen onNavigate={setCurrentScreen} />
        )}
      </div>

      {/* Original Screenshot Reference Modal */}
      <OriginalImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentScreen={currentScreen}
      />
    </div>
  );
}
