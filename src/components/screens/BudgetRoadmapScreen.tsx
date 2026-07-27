import React, { useState, useEffect, useCallback } from 'react';
import { ScreenId } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { budgetService } from '../../services';
import type { BudgetDto, BudgetProgressDto } from '../../types/api';
import {
  LayoutDashboard, CreditCard, Bot, PieChart, Settings,
  Bell, Plus, Calendar, X, Trash2, Loader2, Pencil, Check
} from 'lucide-react';

interface BudgetRoadmapScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

const VIETNAMESE_MONTHS = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

export const BudgetRoadmapScreen: React.FC<BudgetRoadmapScreenProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [isLoading, setIsLoading] = useState(true);
  const [budgets, setBudgets] = useState<BudgetDto[]>([]);
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgressDto[]>([]);

  // Modal states
  const [showMonthDetailModal, setShowMonthDetailModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  // New budget form (chỉ tên + tiền, không có ngày)
  const [newBudgetName, setNewBudgetName] = useState('');
  const [newBudgetAmount, setNewBudgetAmount] = useState('');

  // Edit state (dùng chung cho danh sách chính và modal tháng)
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');

  // Trong modal tháng, có thể thêm budget từ danh sách đã có
  const [showAddBudgetToMonth, setShowAddBudgetToMonth] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [budgetsRes, progressRes] = await Promise.allSettled([
        budgetService.getAll(),
        budgetService.getAllProgress(),
      ]);

      if (budgetsRes.status === 'fulfilled') {
        setBudgets(Array.isArray(budgetsRes.value) ? budgetsRes.value : []);
      }
      if (progressRes.status === 'fulfilled') {
        setBudgetProgress(Array.isArray(progressRes.value) ? progressRes.value : []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getProgressForBudget = (budgetId: string) => {
    return budgetProgress.find(p => p.budgetId === budgetId) || null;
  };

  const resetForm = () => {
    setNewBudgetName('');
    setNewBudgetAmount('');
  };

  // Tính tháng có budget dựa trên khoảng ngày
  const getMonthsContainingBudget = (budget: BudgetDto): number[] => {
    const start = new Date(budget.startDate);
    const end = new Date(budget.endDate);
    const year = parseInt(selectedYear);
    const months: number[] = [];

    if (start.getFullYear() > year || end.getFullYear() < year) return months;

    const startMonth = start.getFullYear() === year ? start.getMonth() + 1 : 1;
    const endMonth = end.getFullYear() === year ? end.getMonth() + 1 : 12;

    for (let m = startMonth; m <= endMonth; m++) {
      months.push(m);
    }
    return months;
  };

  // Lấy danh sách budget hiển thị trong tháng (chỉ những budget có chứa tháng đó)
  const getBudgetsForMonth = (month: number) => {
    return budgets.filter(b => getMonthsContainingBudget(b).includes(month));
  };

  const getMonthTotals = (month: number) => {
    const monthBudgets = getBudgetsForMonth(month);
    let totalBudget = 0;
    let totalSpent = 0;
    let overCount = 0;

    monthBudgets.forEach(b => {
      totalBudget += b.budgetAmount;
      const progress = getProgressForBudget(b.id);
      if (progress) {
        totalSpent += progress.spentAmount;
        if (progress.isOverBudget) overCount++;
      }
    });

    return { totalBudget, totalSpent, count: monthBudgets.length, overCount };
  };

  // Tạo budget mới
  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudgetName || !newBudgetAmount) return;

    try {
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;
      await budgetService.create({
        name: newBudgetName,
        budgetAmount: parseFloat(newBudgetAmount),
        startDate,
        endDate,
        periodType: 'MONTHLY',
        warningThresholdPercent: 80,
        currencyCode: 'VND',
      });

      await fetchData();
      resetForm();
    } catch (error) {
      console.error('Error creating budget:', error);
      alert('Không thể tạo ngân sách.');
    }
  };

  // Cập nhật budget
  const handleUpdateBudget = async (budgetId: string) => {
    const budget = budgets.find(b => b.id === budgetId);
    if (!budget) return;

    try {
      await budgetService.update(budgetId, {
        name: editName || budget.name,
        budgetAmount: parseFloat(editAmount) || budget.budgetAmount,
        startDate: budget.startDate,
        endDate: budget.endDate,
        periodType: budget.periodType,
        warningThresholdPercent: budget.warningThresholdPercent,
        currencyCode: budget.currencyCode,
      });

      setEditingBudgetId(null);
      await fetchData();
    } catch (error) {
      console.error('Error updating budget:', error);
      alert('Không thể cập nhật ngân sách.');
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('Bạn có chắc muốn xóa ngân sách này?')) return;
    try {
      await budgetService.delete(budgetId);
      await fetchData();
    } catch (error) {
      console.error('Error deleting budget:', error);
      alert('Không thể xóa ngân sách.');
    }
  };

  // Hiển thị 1 budget card với CRUD (dùng chung)
  const renderBudgetCard = (budget: BudgetDto, inMonthModal = false) => {
    const progress = getProgressForBudget(budget.id);
    const isOver = progress?.isOverBudget || false;
    const spent = progress?.spentAmount || 0;
    const percent = budget.budgetAmount > 0 ? Math.round((spent / budget.budgetAmount) * 100) : 0;

    if (editingBudgetId === budget.id) {
      return (
        <div key={budget.id} className="bg-slate-50 rounded-xl p-4 space-y-3">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Tên ngân sách"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
          />
          <input
            type="number"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            placeholder="Số tiền"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleUpdateBudget(budget.id)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              Lưu
            </button>
            <button
              onClick={() => setEditingBudgetId(null)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-300"
            >
              Hủy
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={budget.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-semibold text-slate-800">{budget.name}</h4>
            <p className="text-lg font-bold text-slate-900">
              {budget.budgetAmount.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">đ</span>
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setEditingBudgetId(budget.id);
                setEditName(budget.name);
                setEditAmount(budget.budgetAmount.toString());
              }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              title="Sửa"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteBudget(budget.id)}
              className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-500"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Đã chi: {spent.toLocaleString('vi-VN')} đ</span>
            <span className={isOver ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
              {percent}%
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.min(percent, 100)}%` }}
              className={`h-full ${isOver ? 'bg-rose-500' : 'bg-emerald-500'}`}
            />
          </div>
          {isOver && (
            <p className="text-xs text-rose-500 font-medium">
              Đã vượt {Math.abs(spent - budget.budgetAmount).toLocaleString('vi-VN')} đ
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-900 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 hidden md:flex">
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
            F
          </div>
          <span className="font-bold text-xl tracking-tight text-blue-600">FlowFi</span>
        </div>

        <div className="p-4 space-y-1 flex-1">
          <button
            onClick={() => onNavigate('dashboard')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
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
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 shadow-sm shadow-blue-500/20"
          >
            <PieChart className="w-4 h-4" />
            <span>Ngân sách</span>
          </button>
        </div>

        <div className="p-4 border-t border-slate-100 space-y-1">
          <button
            onClick={async () => {
              if (confirm('Bạn có chắc muốn đăng xuất?')) {
                await logout();
                onNavigate('landing');
              }
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">Lộ trình Ngân sách</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-slate-100 text-slate-600 relative">
              <Bell className="w-4 h-4" />
            </button>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-100" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold ring-2 ring-blue-100">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            )}
          </div>
        </header>

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Year Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedYear((prev) => (parseInt(prev) - 1).toString())}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <span className="text-slate-600">←</span>
              </button>
              <span className="text-2xl font-bold text-slate-900">{selectedYear}</span>
              <button
                onClick={() => setSelectedYear((prev) => (parseInt(prev) + 1).toString())}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <span className="text-slate-600">→</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            /* 12 Months Grid */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {VIETNAMESE_MONTHS.map((monthName, idx) => {
                const month = idx + 1;
                const isCurrentMonth = month === currentMonth && parseInt(selectedYear) === currentYear;
                const totals = getMonthTotals(month);
                const percent = totals.totalBudget > 0 ? Math.round((totals.totalSpent / totals.totalBudget) * 100) : 0;
                const hasBudgets = totals.count > 0;
                const hasOver = totals.overCount > 0;

                if (!hasBudgets) {
                  return (
                    <div
                      key={month}
                      onClick={() => { setSelectedMonth(month); setShowMonthDetailModal(true); setShowAddBudgetToMonth(true); }}
                      className="border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-2 bg-slate-50/40 hover:bg-slate-100 hover:border-blue-400 transition-all cursor-pointer min-h-[180px]"
                    >
                      <Calendar className="w-6 h-6 text-slate-400" />
                      <p className="text-sm font-bold text-slate-500">{monthName}</p>
                      <p className="text-xs text-slate-400">Chưa có ngân sách</p>
                      <p className="text-xs text-blue-500 font-medium">+ Bấm để thêm</p>
                    </div>
                  );
                }

                return (
                  <div
                    key={month}
                    onClick={() => { setSelectedMonth(month); setShowMonthDetailModal(true); }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer min-h-[180px] flex flex-col ${
                      isCurrentMonth
                        ? 'bg-blue-50/60 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                        : hasOver
                        ? 'bg-rose-50/60 border-rose-400 shadow-sm'
                        : 'bg-emerald-50/60 border-emerald-400 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-slate-600">{monthName}</span>
                      <div className="flex items-center gap-2">
                        {isCurrentMonth && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                            HIỆN TẠI
                          </span>
                        )}
                        {hasOver && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                            VƯỢT
                          </span>
                        )}
                        {!hasOver && !isCurrentMonth && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                            OK
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-black text-slate-900">
                        {totals.totalSpent.toLocaleString('vi-VN')}
                      </h3>
                      <p className="text-[11px] text-slate-500 mb-3">
                        / {totals.totalBudget.toLocaleString('vi-VN')} đ
                      </p>

                      <div className="w-full bg-white/50 h-3 rounded-full overflow-hidden mb-2">
                        <div
                          style={{ width: `${Math.min(percent, 100)}%` }}
                          className={`h-full ${hasOver ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        />
                      </div>

                      <div className="flex justify-between text-[11px]">
                        <span className={`font-bold ${hasOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {percent}%
                        </span>
                        <span className="text-slate-400">
                          {totals.count} ngân sách
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Month Detail Modal */}
      {showMonthDetailModal && selectedMonth !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">
                {VIETNAMESE_MONTHS[selectedMonth - 1]} {selectedYear}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddBudgetToMonth(true)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm ngân sách
                </button>
                <button onClick={() => { setShowMonthDetailModal(false); setShowAddBudgetToMonth(false); }} className="p-1 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Tổng quan tháng */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
              {(() => {
                const totals = getMonthTotals(selectedMonth);
                const percent = totals.totalBudget > 0 ? Math.round((totals.totalSpent / totals.totalBudget) * 100) : 0;
                return (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500">Tổng cộng: </span>
                      <span className="font-bold text-slate-900">
                        {totals.totalBudget.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Đã chi: </span>
                      <span className={`font-bold ${totals.totalSpent > totals.totalBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {totals.totalSpent.toLocaleString('vi-VN')} đ ({percent}%)
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {getBudgetsForMonth(selectedMonth).length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Không có ngân sách nào cho tháng này</p>
                  <p className="text-xs mt-1">Bấm "Thêm ngân sách" để chọn từ danh sách</p>
                </div>
              ) : (
                getBudgetsForMonth(selectedMonth).map(budget => renderBudgetCard(budget, true))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal chọn budget để thêm vào tháng */}
      {showAddBudgetToMonth && selectedMonth !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">Thêm vào {VIETNAMESE_MONTHS[selectedMonth - 1]}</h2>
              <button onClick={() => setShowAddBudgetToMonth(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {budgets.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <p>Bạn chưa tạo ngân sách nào.</p>
                  <p className="text-xs mt-1">Đóng và tạo ngân sách trước nhé.</p>
                </div>
              ) : (
                budgets.map(budget => {
                  const alreadyInMonth = getBudgetsForMonth(selectedMonth).some(b => b.id === budget.id);
                  const monthsCovered = getMonthsContainingBudget(budget);
                  const inThisMonth = monthsCovered.includes(selectedMonth);

                  return (
                    <div
                      key={budget.id}
                      className={`p-3 rounded-xl border ${alreadyInMonth ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-blue-300'} transition-all`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800">{budget.name}</h4>
                          <p className="text-xs text-slate-500">
                            {budget.budgetAmount.toLocaleString('vi-VN')} đ
                          </p>
                          {!inThisMonth && !alreadyInMonth && (
                            <p className="text-xs text-amber-500 mt-1">
                              ⚠ Budget này không có tháng {selectedMonth}
                            </p>
                          )}
                        </div>
                        {alreadyInMonth ? (
                          <span className="text-xs text-slate-400 font-medium">Đã có</span>
                        ) : (
                          <button
                            onClick={async () => {
                              // Gọi update để thêm tháng vào khoảng ngày
                              try {
                                const start = new Date(budget.startDate);
                                const end = new Date(budget.endDate);
                                const targetYear = parseInt(selectedYear);
                                const newStart = new Date(Math.min(start.getTime(), new Date(targetYear, selectedMonth - 1, 1).getTime()));
                                const newEnd = new Date(Math.max(end.getTime(), new Date(targetYear, selectedMonth, 0).getTime()));

                                await budgetService.update(budget.id, {
                                  name: budget.name,
                                  budgetAmount: budget.budgetAmount,
                                  startDate: newStart.toISOString().split('T')[0],
                                  endDate: newEnd.toISOString().split('T')[0],
                                  periodType: budget.periodType,
                                  warningThresholdPercent: budget.warningThresholdPercent,
                                  currencyCode: budget.currencyCode,
                                });

                                await fetchData();
                              } catch (err) {
                                console.error(err);
                                alert('Không thể cập nhật.');
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Thêm
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Form tạo mới */}
              <div className="border-t border-slate-100 pt-4 mt-4">
                <p className="text-xs text-slate-500 mb-2 font-medium">Hoặc tạo ngân sách mới:</p>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newBudgetName || !newBudgetAmount) return;
                  try {
                    const start = new Date(parseInt(selectedYear), selectedMonth - 1, 1);
                    const end = new Date(parseInt(selectedYear), selectedMonth, 0);
                    await budgetService.create({
                      name: newBudgetName,
                      budgetAmount: parseFloat(newBudgetAmount),
                      startDate: start.toISOString().split('T')[0],
                      endDate: end.toISOString().split('T')[0],
                      periodType: 'MONTHLY',
                      warningThresholdPercent: 80,
                      currencyCode: 'VND',
                    });
                    await fetchData();
                    resetForm();
                  } catch (err) {
                    console.error(err);
                    alert('Không thể tạo.');
                  }
                }} className="space-y-2">
                  <input
                    type="text"
                    value={newBudgetName}
                    onChange={(e) => setNewBudgetName(e.target.value)}
                    placeholder="Tên ngân sách"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                  <input
                    type="number"
                    value={newBudgetAmount}
                    onChange={(e) => setNewBudgetAmount(e.target.value)}
                    placeholder="Số tiền"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                  <button
                    type="submit"
                    className="w-full px-3 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600"
                  >
                    Tạo ngân sách mới
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};