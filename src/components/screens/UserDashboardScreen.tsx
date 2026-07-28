import React, { useState, useEffect, useCallback } from 'react';
import { ScreenId, Transaction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { currentAdminIdentity } from '../../services/adminAuth';
import { walletService, transactionService, summaryService, budgetService, analyticsService, tagService } from '../../services';
import type { WalletDto, TransactionDto, FinancialSummaryDto, MonthlyBudgetOverviewDto, TagDto } from '../../types/api';
import type { CashflowResponse } from '../../services/analyticsService';
import {
  LayoutDashboard, CreditCard, Bot, PieChart, Settings, HelpCircle, Shield,
  Search, Bell, Plus, Wallet as WalletIcon, TrendingUp, TrendingDown, MoreHorizontal,
  Download, PiggyBank, AlertCircle, ShoppingBag, Car, DollarSign, Laptop,
  Loader2, Tag, Pencil, Trash2, X, LogOut
} from 'lucide-react';

interface UserDashboardScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

const localDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const buildCashflowFromTransactions = (
  items: TransactionDto[],
  days: number,
): CashflowResponse['dailyData'] => {
  const normalizedDays = Math.max(1, days);
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - normalizedDays + 1);
  start.setHours(0, 0, 0, 0);

  const totals = new Map<string, { income: number; expense: number }>();
  items
    .filter(item => item.status === 'CONFIRMED')
    .forEach(item => {
      const transactionDate = new Date(item.transactionDate);
      if (Number.isNaN(transactionDate.getTime()) || transactionDate < start || transactionDate > end) return;
      const key = localDateKey(transactionDate);
      const current = totals.get(key) || { income: 0, expense: 0 };
      const amount = Math.abs(Number(item.amount) || 0);
      if (item.type === 'INCOME') current.income += amount;
      if (item.type === 'EXPENSE') current.expense += amount;
      totals.set(key, current);
    });

  return Array.from({ length: normalizedDays }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = localDateKey(date);
    const value = totals.get(key) || { income: 0, expense: 0 };
    return { date: key, ...value };
  });
};

export const UserDashboardScreen: React.FC<UserDashboardScreenProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const isAdmin = currentAdminIdentity().isAdmin;
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cashflowDays, setCashflowDays] = useState(7);

  // Data from API
  const [wallets, setWallets] = useState<WalletDto[]>([]);
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [summary, setSummary] = useState<FinancialSummaryDto | null>(null);
  const [monthlyBudget, setMonthlyBudget] = useState<MonthlyBudgetOverviewDto | null>(null);
  const [cashflow, setCashflow] = useState<CashflowResponse['dailyData']>([]);
  const [tags, setTags] = useState<TagDto[]>([]);

  // New transaction modal state
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('Ăn uống');
  const [selectedWalletId, setSelectedWalletId] = useState('');

  // Tag CRUD state
  const [showTagForm, setShowTagForm] = useState(false);
  const [editingTag, setEditingTag] = useState<TagDto | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagType, setNewTagType] = useState('EXPENSE');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const rangeStart = new Date(today);
      rangeStart.setDate(today.getDate() - Math.max(1, cashflowDays) + 1);
      rangeStart.setHours(0, 0, 0, 0);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const [walletsRes, transactionsRes, cashflowTransactionsRes, monthlyTransactionsRes, summaryRes, cashflowRes, budgetRes, tagsRes] = await Promise.allSettled([
        walletService.getAll(),
        transactionService.getAll({ pageSize: 5, status: 'CONFIRMED' }),
        transactionService.getAll({
          pageSize: 100,
          status: 'CONFIRMED',
          from: rangeStart.toISOString(),
          to: today.toISOString(),
        }),
        transactionService.getAll({
          pageSize: 100,
          status: 'CONFIRMED',
          from: monthStart.toISOString(),
          to: today.toISOString(),
        }),
        summaryService.getCurrentMonth(),
        analyticsService.getDailyCashflow(cashflowDays),
        budgetService.getMonthlyOverview(today.getFullYear(), today.getMonth() + 1),
        tagService.getAll(),
      ]);

      // Services return data directly (no ApiResponse wrapper)
      if (walletsRes.status === 'fulfilled') {
        // walletsRes.value IS the WalletDto[] array directly
        setWallets(Array.isArray(walletsRes.value) ? walletsRes.value : []);
        if (Array.isArray(walletsRes.value) && walletsRes.value.length > 0 && !selectedWalletId) {
          setSelectedWalletId(walletsRes.value[0].id);
        }
      }
      const transactionItems = transactionsRes.status === 'fulfilled'
        ? transactionsRes.value?.items || []
        : [];
      const cashflowTransactionItems = cashflowTransactionsRes.status === 'fulfilled'
        ? cashflowTransactionsRes.value?.items || []
        : [];
      if (transactionsRes.status === 'fulfilled') {
        // BE returns PagedTransactionsResponse: { items, page, pageSize, total }
        setTransactions(Array.isArray(transactionItems) ? transactionItems.slice(0, 5) : []);
      }
      const monthlyPage = monthlyTransactionsRes.status === 'fulfilled'
        ? monthlyTransactionsRes.value
        : null;
      const monthlyItems = Array.isArray(monthlyPage?.items) ? monthlyPage.items : [];
      const hasCompleteMonthlyFinanceData = monthlyPage !== null && monthlyPage.total <= monthlyItems.length;
      const monthlyIncome = monthlyItems
        .filter(item => item.status === 'CONFIRMED' && item.type === 'INCOME')
        .reduce((sum, item) => sum + Math.abs(Number(item.amount) || 0), 0);
      const monthlyExpense = monthlyItems
        .filter(item => item.status === 'CONFIRMED' && item.type === 'EXPENSE')
        .reduce((sum, item) => sum + Math.abs(Number(item.amount) || 0), 0);
      if (summaryRes.status === 'fulfilled') {
        const apiSummary = summaryRes.value;
        const budgetTarget = budgetRes.status === 'fulfilled'
          ? budgetRes.value?.summary.targetAmount || 0
          : apiSummary.totalBudget;
        const totalIncome = hasCompleteMonthlyFinanceData ? monthlyIncome : apiSummary.totalIncome;
        const totalExpense = hasCompleteMonthlyFinanceData ? monthlyExpense : apiSummary.totalExpense;
        setSummary({
          ...apiSummary,
          totalIncome,
          totalExpense,
          netSaving: totalIncome - totalExpense,
          totalBudget: budgetTarget,
          usedBudget: totalExpense,
          budgetUsagePercent: budgetTarget > 0 ? totalExpense / budgetTarget * 100 : 0,
          transactionCount: hasCompleteMonthlyFinanceData ? monthlyItems.length : apiSummary.transactionCount,
        });
      } else if (hasCompleteMonthlyFinanceData) {
        const budgetTarget = budgetRes.status === 'fulfilled'
          ? budgetRes.value?.summary.targetAmount || 0
          : 0;
        setSummary({
          id: '',
          userId: '',
          periodType: 'MONTHLY',
          periodStartDate: monthStart.toISOString(),
          periodEndDate: today.toISOString(),
          month: today.getMonth() + 1,
          year: today.getFullYear(),
          totalIncome: monthlyIncome,
          totalExpense: monthlyExpense,
          netSaving: monthlyIncome - monthlyExpense,
          totalBudget: budgetTarget,
          usedBudget: monthlyExpense,
          budgetUsagePercent: budgetTarget > 0 ? monthlyExpense / budgetTarget * 100 : 0,
          transactionCount: monthlyItems.length,
          calculatedAt: today.toISOString(),
        });
      }
      if (cashflowRes.status === 'fulfilled') {
        // BE returns CashflowResponse directly: { dailyData, totalIncome, totalExpense, netCashflow }
        const cashflowResponse = cashflowRes.value;
        const apiDailyData = Array.isArray(cashflowResponse?.dailyData) ? cashflowResponse.dailyData : [];
        const fallbackDailyData = buildCashflowFromTransactions(cashflowTransactionItems, cashflowDays);
        const apiHasActivity = apiDailyData.some(item => Number(item.income) > 0 || Number(item.expense) > 0);
        const fallbackHasActivity = fallbackDailyData.some(item => item.income > 0 || item.expense > 0);
        setCashflow(apiHasActivity || !fallbackHasActivity ? apiDailyData : fallbackDailyData);
      } else {
        setCashflow(buildCashflowFromTransactions(cashflowTransactionItems, cashflowDays));
      }
      setMonthlyBudget(budgetRes.status === 'fulfilled' ? budgetRes.value : null);
      if (tagsRes.status === 'fulfilled') {
        setTags(Array.isArray(tagsRes.value) ? tagsRes.value : []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWalletId, cashflowDays]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate total balance from wallets
  const totalBalance = (wallets || []).reduce((sum, w) => sum + (Number(w.balance) || 0), 0);

  // Use real data if available
  const displayTransactions = transactions.length > 0
    ? transactions.map(t => ({
        id: t.id,
        date: t.transactionDate ? new Date(t.transactionDate).toLocaleDateString('vi-VN') : '',
        description: t.title || '',
        category: t.tagName || (t.type === 'INCOME' ? 'Thu nhập' : 'Chi tiêu'),
        amount: t.type === 'EXPENSE' ? -(t.amount ?? 0) : (t.amount ?? 0),
        walletId: t.walletId,
        icon: 'default'
      }))
    : [];

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc || !newAmount || !selectedWalletId) return;

    try {
      const parsedAmt = Math.abs(parseFloat(newAmount));
      const isExpense = newCategory !== 'Lương';

      await transactionService.create({
        walletId: selectedWalletId,
        amount: parsedAmt,
        type: isExpense ? 'EXPENSE' : 'INCOME',
        title: newDesc,
        source: 'MANUAL',
        transactionDate: new Date().toISOString(),
      });

      // Refresh data
      await fetchData();

      setNewDesc('');
      setNewAmount('');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Không thể tạo giao dịch. Vui lòng thử lại.');
    }
  };

  // Tag CRUD Handlers
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName) {
      alert('Vui lòng nhập tên danh mục.');
      return;
    }

    try {
      if (editingTag) {
        await tagService.update(editingTag.id, {
          name: newTagName,
          type: newTagType,
          color: newTagColor,
        });
      } else {
        await tagService.create({
          name: newTagName,
          type: newTagType,
          color: newTagColor,
        });
      }

      setShowTagForm(false);
      setEditingTag(null);
      setNewTagName('');
      setNewTagType('EXPENSE');
      setNewTagColor('#3B82F6');

      const tagsRes = await tagService.getAll();
      setTags(Array.isArray(tagsRes) ? tagsRes : []);
    } catch (error) {
      console.error('Error saving tag:', error);
      alert('Lỗi khi lưu danh mục. Vui lòng thử lại.');
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;

    try {
      await tagService.delete(tagId);
      const tagsRes = await tagService.getAll();
      setTags(Array.isArray(tagsRes) ? tagsRes : []);
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert('Lỗi khi xóa danh mục. Vui lòng thử lại.');
    }
  };

  const filteredTransactions = displayTransactions.filter(t =>
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const money = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
  const chartWidth = 720;
  const chartHeight = 240;
  const chartLeft = 72;
  const chartRight = 18;
  const chartTop = 14;
  const chartBottom = 30;
  const chartBaseY = chartHeight - chartBottom;
  const cashflowMax = Math.max(
    1,
    ...cashflow.flatMap(item => [Number(item.income || 0), Number(item.expense || 0)]),
  );
  const formatChartMoney = (value: number) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr`;
    if (value >= 1_000) return `${(value / 1_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}K`;
    return value.toLocaleString('vi-VN');
  };
  const chartPoints = (key: 'income' | 'expense') => cashflow.map((item, index) => {
    const x = cashflow.length <= 1
      ? (chartLeft + chartWidth - chartRight) / 2
      : chartLeft + index / (cashflow.length - 1) * (chartWidth - chartLeft - chartRight);
    const y = chartBaseY - Number(item[key] || 0) / cashflowMax * (chartBaseY - chartTop);
    return `${x},${y}`;
  }).join(' ');
  const chartLabelIndexes = cashflow
    .map((_, index) => index)
    .filter(index => cashflow.length <= 8 || index % Math.ceil(cashflow.length / 7) === 0 || index === cashflow.length - 1);
  const budgetSummary = monthlyBudget?.summary;
  const budgetPercent = Math.max(0, budgetSummary?.percentUsed || 0);
  const budgetTone = budgetPercent >= 100
    ? 'bg-rose-500'
    : budgetPercent >= (budgetSummary?.warningThresholdPercent || 80)
      ? 'bg-amber-500'
      : 'bg-[#635BFF]';

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-900 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 hidden md:flex">
        {/* Logo */}
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-sm shadow-blue-200">
            F
          </div>
          <span className="font-bold text-xl tracking-tight text-blue-600">FlowFi</span>
        </div>

        {/* Primary Navigation */}
        <div className="p-4 space-y-1 flex-1">
          <button
            onClick={() => onNavigate('dashboard')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 shadow-sm shadow-blue-500/20"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Tổng quan</span>
          </button>

          <button
            onClick={() => onNavigate('transactions')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            <span>Giao dịch</span>
          </button>

          <button
            onClick={() => onNavigate('ai-input')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <Bot className="w-4 h-4" />
            <span>Trợ lý AI</span>
          </button>

          <button
            onClick={() => onNavigate('budget')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <PieChart className="w-4 h-4" />
            <span>Ngân sách</span>
          </button>

          <button
            onClick={() => onNavigate('debt-reminders')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span>Nhắc nợ</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => onNavigate('admin-users')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>Khu quản trị</span>
            </button>
          )}
        </div>

        {/* Secondary Navigation */}
        <div className="p-4 border-t border-slate-100 space-y-1">
          <button className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors">
            <Settings className="w-4 h-4" />
            <span>Cài đặt</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors">
            <HelpCircle className="w-4 h-4" />
            <span>Hỗ trợ</span>
          </button>
          <button
            onClick={async () => {
              if (confirm('Bạn có chắc muốn đăng xuất?')) {
                await logout();
                onNavigate('landing');
              }
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 truncate">Bảng điều khiển tài chính</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative hidden lg:block w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm thông tin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-100/80 border border-transparent text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>

            {/* Bell Notification */}
            <button className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
            </button>

            {/* Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-100"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center ring-2 ring-blue-100">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
              )}
            </div>

            {/* User Name */}
            <span className="text-xs font-semibold text-slate-800 hidden lg:inline">
              {user?.fullName || 'Người dùng'}
            </span>

            {/* Giao dịch mới Button */}
            <button
              onClick={() => {
                setEditingTag(null);
                setNewTagName('');
                setNewTagType('EXPENSE');
                setNewTagColor('#3B82F6');
                setShowTagForm(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-sm shadow-blue-500/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm tag</span>
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Welcome subtitle */}
          <p className="text-xs text-slate-500 font-medium -mt-2">
            Chào mừng bạn trở lại{user?.fullName ? `, ${user.fullName}` : ''}.
          </p>

          {/* Top Summary Cards */}
          <div className="grid md:grid-cols-3 gap-5">
            {/* Primary Blue Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg shadow-blue-500/15 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
              <WalletIcon className="w-24 h-24 text-white/10 absolute -right-4 -bottom-4 pointer-events-none" />
              <div>
                <p className="text-xs font-semibold text-blue-100 mb-1">Tổng số dư</p>
                <h2 className="text-3xl font-extrabold tracking-tight">
                  {isLoading ? '...' : Number(totalBalance).toLocaleString('vi-VN')} đ
                </h2>
              </div>
              <div className="pt-3">
                {summary && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    {(summary.netSaving ?? 0) >= 0 ? '+' : ''}{(summary.netSaving ?? 0).toLocaleString('vi-VN')} đ tiết kiệm
                  </span>
                )}
              </div>
            </div>

            {/* Income Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Thu nhập tháng này</p>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {isLoading ? '...' : (summary?.totalIncome || 0).toLocaleString('vi-VN')} đ
                </h2>
                {summary && (
                  <div className="mt-3 space-y-1">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${Math.min(((summary.totalIncome ?? 0) / (summary.totalBudget || 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">Thu nhập tháng</p>
                  </div>
                )}
              </div>
            </div>

            {/* Expense Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Chi tiêu tháng này</p>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-rose-600">
                  {isLoading ? '...' : `-${Math.abs(summary?.totalExpense || 0).toLocaleString('vi-VN')} đ`}
                </h2>
                {summary && (
                  <div className="mt-3 space-y-1">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-full"
                        style={{ width: `${Math.min((summary.budgetUsagePercent ?? 0), 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {(summary.budgetUsagePercent ?? 0)}% ngân sách
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Middle Grid: Cashflow Chart + Monthly Budget */}
          <div className="grid lg:grid-cols-12 gap-5">
            {/* Cashflow Chart (8 cols) */}
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Xu hướng dòng tiền</h3>
                  <p className="text-xs text-slate-500 mt-1">So sánh thu nhập và chi tiêu đã xác nhận theo ngày</p>
                </div>
                <select
                  value={cashflowDays}
                  onChange={(event) => setCashflowDays(Number(event.target.value))}
                  className="h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#635BFF]"
                >
                  <option value={7}>7 ngày qua</option>
                  <option value={30}>30 ngày qua</option>
                  <option value={new Date().getDate()}>Tháng này</option>
                </select>
              </div>

              {cashflow.length > 0 ? (
                <div>
                  <div className="relative h-[270px] rounded-xl bg-slate-50/60 border border-slate-100 p-3">
                    <svg
                      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                      preserveAspectRatio="xMidYMid meet"
                      className="w-full h-full overflow-visible"
                      aria-label="Biểu đồ xu hướng dòng tiền"
                    >
                      <defs>
                        <linearGradient id="dashboard-income-area" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#12B76A" stopOpacity="0.22" />
                          <stop offset="100%" stopColor="#12B76A" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="dashboard-expense-area" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F04438" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#F04438" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {[0, 0.25, 0.5, 0.75, 1].map(level => {
                        const y = chartBaseY - level * (chartBaseY - chartTop);
                        return (
                          <g key={level}>
                            <line
                              x1={chartLeft}
                              x2={chartWidth - chartRight}
                              y1={y}
                              y2={y}
                              stroke="#E7EAF0"
                              strokeDasharray="4 5"
                              vectorEffect="non-scaling-stroke"
                            />
                            <text
                              x={chartLeft - 10}
                              y={y + 4}
                              textAnchor="end"
                              fill="#98A2B3"
                              fontSize="10"
                              fontWeight="600"
                            >
                              {formatChartMoney(cashflowMax * level)}
                            </text>
                          </g>
                        );
                      })}
                      <line
                        x1={chartLeft}
                        x2={chartLeft}
                        y1={chartTop}
                        y2={chartBaseY}
                        stroke="#D0D5DD"
                        vectorEffect="non-scaling-stroke"
                      />
                      <line
                        x1={chartLeft}
                        x2={chartWidth - chartRight}
                        y1={chartBaseY}
                        y2={chartBaseY}
                        stroke="#D0D5DD"
                        vectorEffect="non-scaling-stroke"
                      />
                      <polygon
                        points={`${chartLeft},${chartBaseY} ${chartPoints('income')} ${chartWidth - chartRight},${chartBaseY}`}
                        fill="url(#dashboard-income-area)"
                      />
                      <polygon
                        points={`${chartLeft},${chartBaseY} ${chartPoints('expense')} ${chartWidth - chartRight},${chartBaseY}`}
                        fill="url(#dashboard-expense-area)"
                      />
                      <polyline
                        points={chartPoints('income')}
                        fill="none"
                        stroke="#12B76A"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                      <polyline
                        points={chartPoints('expense')}
                        fill="none"
                        stroke="#F04438"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                      {chartLabelIndexes.map(index => {
                        const item = cashflow[index];
                        const x = cashflow.length <= 1
                          ? (chartLeft + chartWidth - chartRight) / 2
                          : chartLeft + index / (cashflow.length - 1) * (chartWidth - chartLeft - chartRight);
                        return (
                          <text
                            key={item.date}
                            x={x}
                            y={chartHeight - 8}
                            textAnchor="middle"
                            fill="#98A2B3"
                            fontSize="10"
                            fontWeight="600"
                          >
                            {new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          </text>
                        );
                      })}
                    </svg>
                  </div>
                  <div className="flex items-center justify-center gap-7 pt-4 text-xs font-semibold text-slate-600">
                    <span className="flex items-center gap-2"><i className="w-3 h-3 rounded-full bg-[#12B76A]" /> Thu nhập</span>
                    <span className="flex items-center gap-2"><i className="w-3 h-3 rounded-full bg-[#F04438]" /> Chi tiêu</span>
                  </div>
                </div>
              ) : (
                <div className="h-[285px] rounded-xl border border-dashed border-slate-300 bg-slate-50/60 flex flex-col items-center justify-center text-center">
                  <TrendingUp className="w-8 h-8 text-[#635BFF] mb-3" />
                  <strong className="text-sm text-slate-700">Chưa có dữ liệu dòng tiền</strong>
                  <p className="text-xs text-slate-400 mt-1">Giao dịch đã xác nhận sẽ được hiển thị tại đây.</p>
                </div>
              )}
            </div>

            {/* Monthly Budget (4 cols) */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      Ngân sách tháng {budgetSummary?.month || new Date().getMonth() + 1}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Tiến độ tổng và từng mục tiêu</p>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                {budgetSummary ? (
                  <div className="space-y-5">
                    <div className="rounded-xl border border-[#E7EAF0] bg-[#F7F8FC] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold text-slate-500">Đã sử dụng</p>
                          <p className="mt-1 text-lg font-extrabold text-slate-900">
                            {money(budgetSummary.spentAmount)}
                            <span className="ml-1 text-xs font-medium text-slate-500">
                              / {money(budgetSummary.targetAmount)}
                            </span>
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          budgetPercent >= 100
                            ? 'bg-rose-50 text-rose-600'
                            : budgetPercent >= budgetSummary.warningThresholdPercent
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-[#F1EFFF] text-[#5147E5]'
                        }`}>
                          {budgetPercent.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%
                        </span>
                      </div>
                      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#EAECF0]">
                        <div
                          className={`h-full rounded-full transition-all ${budgetTone}`}
                          style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3 text-[11px]">
                        <span className="text-slate-500">{budgetSummary.transactionCount} giao dịch đã xác nhận</span>
                        <strong className={budgetSummary.remainingAmount < 0 ? 'text-rose-600' : 'text-emerald-700'}>
                          {budgetSummary.remainingAmount < 0
                            ? `Vượt ${money(Math.abs(budgetSummary.remainingAmount))}`
                            : `Còn ${money(budgetSummary.remainingAmount)}`}
                        </strong>
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900">Tiến độ từng target</h4>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {monthlyBudget?.allocations.length || 0} mục tiêu
                        </span>
                      </div>
                      <div className="max-h-[180px] space-y-3 overflow-y-auto pr-1">
                        {monthlyBudget?.allocations.length ? monthlyBudget.allocations.map((target) => {
                          const percent = Math.max(0, target.usagePercent || 0);
                          const isOver = percent >= 100;
                          const isWarning = !isOver && percent >= budgetSummary.warningThresholdPercent;
                          return (
                            <div key={target.id} className="rounded-xl border border-slate-100 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <span className="truncate text-xs font-bold text-slate-800">
                                  {target.name || target.tagName || 'Mục tiêu'}
                                </span>
                                <span className={`text-xs font-bold ${isOver ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-[#5147E5]'}`}>
                                  {percent.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%
                                </span>
                              </div>
                              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EAECF0]">
                                <div
                                  className={`h-full rounded-full ${isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-[#635BFF]'}`}
                                  style={{ width: `${Math.min(percent, 100)}%` }}
                                />
                              </div>
                              <div className="mt-1.5 flex justify-between text-[10px] font-medium text-slate-500">
                                <span>Đã dùng {money(target.spentAmount)}</span>
                                <span>Mục tiêu {money(target.targetAmount)}</span>
                              </div>
                            </div>
                          );
                        }) : (
                          <p className="rounded-xl bg-slate-50 px-3 py-5 text-center text-xs text-slate-400">
                            Chưa có target ngân sách.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <PiggyBank className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-400">Chưa có ngân sách nào</p>
                      <p className="text-xs text-slate-400 mt-1">Tạo ngân sách để theo dõi chi tiêu</p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => onNavigate('budget')}
                className="w-full mt-6 py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors text-center"
              >
                Xem tất cả ngân sách
              </button>
            </div>
          </div>

          {/* Recent Transactions Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Giao dịch gần đây</h3>
              <button className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                <Download className="w-3.5 h-3.5" /> Tải xuống CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-6">Ngày</th>
                    <th className="py-3 px-6">Mô tả</th>
                    <th className="py-3 px-6">Danh mục</th>
                    <th className="py-3 px-6">Ví</th>
                    <th className="py-3 px-6 text-right">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredTransactions.map((tx) => {
                    const isExpense = tx.amount < 0;
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 text-slate-500 whitespace-nowrap">{tx.date}</td>
                        <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                            {tx.category === 'Ăn uống' && <ShoppingBag className="w-4 h-4 text-emerald-600" />}
                            {tx.category === 'Di chuyển' && <Car className="w-4 h-4 text-blue-600" />}
                            {tx.category === 'Lương' && <DollarSign className="w-4 h-4 text-emerald-600" />}
                            {tx.category === 'Công nghệ' && <Laptop className="w-4 h-4 text-slate-700" />}
                            {!['Ăn uống', 'Di chuyển', 'Lương', 'Công nghệ'].includes(tx.category) && <CreditCard className="w-4 h-4" />}
                          </div>
                          <span>{tx.description}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            tx.category === 'Ăn uống' ? 'bg-emerald-50 text-emerald-700' :
                            tx.category === 'Di chuyển' ? 'bg-blue-50 text-blue-700' :
                            tx.category === 'Lương' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {tx.category}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs text-slate-500">{wallets.find(w => w.id === tx.walletId)?.name || '—'}</span>
                        </td>
                        <td className={`py-4 px-6 text-right font-bold text-sm whitespace-nowrap ${isExpense ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {isExpense ? '' : '+'}{tx.amount.toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Add Transaction */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Thêm giao dịch mới</h3>
            <form onSubmit={handleAddTransaction} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả giao dịch</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cà phê Highland, Mua siêu thị..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Số tiền (VNĐ)</label>
                <input
                  type="number"
                  placeholder="50000"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ví</label>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600"
                  required
                >
                  <option value="">Chọn ví</option>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Danh mục</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600"
                >
                  <option>Ăn uống</option>
                  <option>Di chuyển</option>
                  <option>Lương</option>
                  <option>Công nghệ</option>
                  <option>Giải trí</option>
                  <option>Khác</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  Lưu giao dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tag Form Modal */}
      {showTagForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">
                {editingTag ? 'Sửa danh mục' : 'Thêm danh mục mới'}
              </h3>
              <button
                onClick={() => {
                  setShowTagForm(false);
                  setEditingTag(null);
                }}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTag} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  TÊN DANH MỤC
                </label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Ví dụ: Ăn uống, Di chuyển..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  LOẠI
                </label>
                <select
                  value={newTagType}
                  onChange={(e) => setNewTagType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600"
                >
                  <option value="EXPENSE">Chi tiêu</option>
                  <option value="INCOME">Thu nhập</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  MÀU SẮC
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <input
                    type="text"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTagForm(false);
                    setEditingTag(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  {editingTag ? 'Lưu thay đổi' : 'Tạo danh mục'}
                </button>
              </div>
            </form>

            {/* Tags List Preview */}
            {tags.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-2">Danh mục hiện có:</p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-white"
                      style={{ backgroundColor: tag.color || '#3B82F6' }}
                    >
                      <span>{tag.name}</span>
                      <button
                        onClick={() => {
                          setEditingTag(tag);
                          setNewTagName(tag.name);
                          setNewTagType(tag.type);
                          setNewTagColor(tag.color || '#3B82F6');
                          setShowTagForm(true);
                        }}
                        className="p-0.5 hover:bg-white/20 rounded"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className="p-0.5 hover:bg-white/20 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
