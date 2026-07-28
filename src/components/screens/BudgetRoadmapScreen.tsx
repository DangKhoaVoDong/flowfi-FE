import React, { useState, useEffect, useCallback } from 'react';
import { ScreenId } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { budgetService, tagService } from '../../services';
import type { BudgetDetailsDto, BudgetDto, BudgetProgressDto, BudgetTargetRequest, TagDto } from '../../types/api';
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
  const [budgetDetails, setBudgetDetails] = useState<Record<string, BudgetDetailsDto>>({});
  const [tags, setTags] = useState<TagDto[]>([]);

  // Modal states
  const [showMonthDetailModal, setShowMonthDetailModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  // New budget form
  const [newBudgetTargets, setNewBudgetTargets] = useState<BudgetTargetRequest[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [budgetFormError, setBudgetFormError] = useState('');
  const defaultBudgetName = selectedMonth
    ? `${VIETNAMESE_MONTHS[selectedMonth - 1]} ${selectedYear}`
    : '';

  // Edit state (dùng chung cho danh sách chính và modal tháng)
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Create budget modal
  const [showAddBudgetToMonth, setShowAddBudgetToMonth] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [budgetsRes, progressRes, tagsRes] = await Promise.allSettled([
        budgetService.getAll(),
        budgetService.getAllProgress(),
        tagService.getAll(),
      ]);

      if (budgetsRes.status === 'fulfilled') {
        const loadedBudgets = Array.isArray(budgetsRes.value) ? budgetsRes.value : [];
        setBudgets(loadedBudgets);
        const detailsResults = await Promise.allSettled(
          loadedBudgets.map(budget => budgetService.getDetails(budget.id))
        );
        const detailsById: Record<string, BudgetDetailsDto> = {};
        detailsResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            detailsById[result.value.id] = result.value;
          }
        });
        setBudgetDetails(detailsById);
      }
      if (progressRes.status === 'fulfilled') {
        setBudgetProgress(Array.isArray(progressRes.value) ? progressRes.value : []);
      }
      if (tagsRes.status === 'fulfilled') {
        setTags(Array.isArray(tagsRes.value) ? tagsRes.value.filter(tag => tag.type === 'EXPENSE') : []);
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
    setNewBudgetTargets(tags.map(tag => ({
      name: tag.name,
      targetAmount: 0,
      tagId: tag.id,
      tagName: tag.name,
    })));
    setNewTagName('');
    setShowNewTagInput(false);
    setBudgetFormError('');
  };

  const openBudgetSetup = (month: number) => {
    setSelectedMonth(month);
    setNewBudgetTargets(tags.map(tag => ({
      name: tag.name,
      targetAmount: 0,
      tagId: tag.id,
      tagName: tag.name,
    })));
    setBudgetFormError('');
    setShowAddBudgetToMonth(true);
  };

  // Budget mới thuộc đúng một tháng/năm.
  const getMonthsContainingBudget = (budget: BudgetDto): number[] => {
    return budget.year === parseInt(selectedYear) ? [budget.month] : [];
  };

  // Lấy danh sách budget của tháng đang xem.
  const getBudgetsForMonth = (month: number) => {
    return budgets.filter(b => getMonthsContainingBudget(b).includes(month));
  };

  const getMonthTotals = (month: number) => {
    const monthBudgets = getBudgetsForMonth(month);
    let totalBudget = 0;
    let totalSpent = 0;
    let overCount = 0;

    monthBudgets.forEach(b => {
      totalBudget += b.totalTargetAmount;
      const progress = getProgressForBudget(b.id);
      if (progress) {
        totalSpent += progress.spentAmount;
        if (progress.isOverBudget) overCount++;
      }
    });

    return { totalBudget, totalSpent, count: monthBudgets.length, overCount };
  };

  // Cập nhật budget
  const handleUpdateBudget = async (budgetId: string) => {
    const budget = budgets.find(b => b.id === budgetId);
    if (!budget) return;

    try {
      await budgetService.update(budgetId, {
        name: editName || budget.name,
        month: budget.month,
        year: budget.year,
        warningThresholdPercent: budget.warningThresholdPercent,
        currencyCode: budget.currencyCode,
        targets: budget.targets.map(({ tagId, tagName, name, targetAmount }) => ({
          tagId,
          tagName,
          name,
          targetAmount,
        })),
        status: budget.status,
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
    const details = budgetDetails[budget.id];
    const isOver = progress?.isOverBudget || false;
    const spent = details?.spentAmount ?? progress?.spentAmount ?? 0;
    const percent = budget.totalTargetAmount > 0 ? Math.round((spent / budget.totalTargetAmount) * 100) : 0;

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
              {budget.totalTargetAmount.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">đ</span>
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setEditingBudgetId(budget.id);
                setEditName(budget.name);
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
              Đã vượt {Math.abs(spent - budget.totalTargetAmount).toLocaleString('vi-VN')} đ
            </p>
          )}
        </div>

        {inMonthModal && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
            <p className="text-xs font-semibold text-slate-600">Tiến trình theo mục tiêu</p>
            {(details?.targets ?? budget.targets).map(target => {
              const targetSpent = 'spentAmount' in target ? target.spentAmount : 0;
              const targetPercent = target.targetAmount > 0
                ? Math.round((targetSpent / target.targetAmount) * 100)
                : 0;
              const targetOver = targetSpent > target.targetAmount;

              return (
                <div key={target.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-slate-700 truncate">
                      {target.tagName || target.name}
                    </span>
                    <span className={targetOver ? 'font-semibold text-rose-600' : 'text-slate-500'}>
                      {targetSpent.toLocaleString('vi-VN')} / {target.targetAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(targetPercent, 100)}%` }}
                      className={`h-full transition-all ${targetOver ? 'bg-rose-500' : 'bg-blue-500'}`}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Còn lại: {Math.max(0, target.targetAmount - targetSpent).toLocaleString('vi-VN')} đ</span>
                    <span className={targetOver ? 'text-rose-500 font-semibold' : ''}>{targetPercent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

          <button
            onClick={() => onNavigate('debt-reminders')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span>Nhắc nợ</span>
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
                      onClick={() => { setShowMonthDetailModal(true); openBudgetSetup(month); }}
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
                  onClick={() => openBudgetSetup(selectedMonth)}
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
              <div>
                <h2 className="text-lg font-bold text-slate-900">Thiết lập ngân sách</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {VIETNAMESE_MONTHS[selectedMonth - 1]} {selectedYear}
                </p>
              </div>
              <button onClick={() => setShowAddBudgetToMonth(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-2">
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const fundedTargets = newBudgetTargets.filter(target => target.targetAmount > 0);
                  if (!defaultBudgetName || fundedTargets.length === 0) {
                    setBudgetFormError('Vui lòng nhập số tiền lớn hơn 0 cho ít nhất một danh mục.');
                    return;
                  }
                  setBudgetFormError('');
                  try {
                    const createdBudget = await budgetService.create({
                      name: defaultBudgetName,
                      month: selectedMonth,
                      year: parseInt(selectedYear),
                      warningThresholdPercent: 80,
                      currencyCode: 'VND',
                      targets: fundedTargets.map(target => ({
                        ...target,
                        name: target.name.trim(),
                      })),
                    });
                    setBudgets(current => [
                      ...current.filter(budget => budget.id !== createdBudget.id),
                      createdBudget,
                    ]);
                    const createdDetails = await budgetService.getDetails(createdBudget.id).catch(() => null);
                    if (createdDetails) {
                      setBudgetDetails(current => ({
                        ...current,
                        [createdDetails.id]: createdDetails,
                      }));
                    }
                    resetForm();
                    setShowAddBudgetToMonth(false);
                  } catch (err) {
                    console.error(err);
                    alert('Không thể tạo.');
                  }
                }} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tháng</label>
                  <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium">
                    {VIETNAMESE_MONTHS[selectedMonth - 1]} {selectedYear}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tên ngân sách</label>
                  <input
                    type="text"
                    value={defaultBudgetName}
                    readOnly
                    aria-readonly="true"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-sm cursor-not-allowed"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-600">Phân bổ theo danh mục</label>
                    <button
                      type="button"
                      onClick={() => setShowNewTagInput(true)}
                      className="text-xs text-blue-600 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm danh mục
                    </button>
                  </div>

                  {showNewTagInput && (
                    <div className="flex gap-2 p-3 rounded-xl border border-blue-200 bg-blue-50">
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Tên danh mục mới"
                        autoFocus
                        className="min-w-0 flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
                      />
                      <button
                        type="button"
                        disabled={isCreatingTag || !newTagName.trim()}
                        onClick={async () => {
                          if (!newTagName.trim()) return;
                          setIsCreatingTag(true);
                          try {
                            const createdTag = await tagService.create({
                              name: newTagName.trim(),
                              type: 'EXPENSE',
                            });
                            setTags(currentTags => [...currentTags, createdTag]);
                            setNewBudgetTargets(targets => [
                              ...targets,
                              {
                                name: createdTag.name,
                                targetAmount: 0,
                                tagId: createdTag.id,
                                tagName: createdTag.name,
                              },
                            ]);
                            setNewTagName('');
                            setShowNewTagInput(false);
                          } catch (error) {
                            console.error('Error creating tag:', error);
                            setBudgetFormError('Không thể tạo danh mục mới.');
                          } finally {
                            setIsCreatingTag(false);
                          }
                        }}
                        className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium disabled:opacity-50"
                      >
                        {isCreatingTag ? 'Đang thêm...' : 'Thêm'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowNewTagInput(false); setNewTagName(''); }}
                        className="p-2 rounded-lg text-slate-500 hover:bg-white"
                        title="Hủy"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {newBudgetTargets.length === 0 && (
                    <p className="py-4 text-center text-xs text-slate-400">
                      Chưa có danh mục chi tiêu. Hãy thêm danh mục mới.
                    </p>
                  )}

                  {newBudgetTargets.map((target, index) => (
                    <div
                      key={target.tagId ?? index}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {target.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                        {target.name}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={target.targetAmount}
                        onChange={(e) => setNewBudgetTargets(targets => targets.map((item, i) =>
                          i === index ? { ...item, targetAmount: Number(e.target.value) } : item
                        ))}
                        aria-label={`Ngân sách cho ${target.name}`}
                        className="w-32 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-right text-sm font-medium"
                      />
                      <span className="text-xs text-slate-400">đ</span>
                    </div>
                  ))}
                </div>

                {budgetFormError && (
                  <p className="text-xs font-medium text-rose-600">{budgetFormError}</p>
                )}

                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-blue-50 text-sm">
                  <span className="text-blue-700">Tổng ngân sách (tự động)</span>
                  <span className="font-bold text-blue-700">
                    {newBudgetTargets.reduce((sum, target) => sum + (target.targetAmount || 0), 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>

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
      )}
    </div>
  );
};
