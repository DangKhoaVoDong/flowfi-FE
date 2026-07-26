import React, { useState } from 'react';
import { ScreenId, BudgetMonth } from '../../types';
import { 
  LayoutDashboard, CreditCard, Bot, PieChart, Settings, HelpCircle, 
  Bell, Plus, Download, Calendar, AlertCircle, CheckCircle2, PlusCircle
} from 'lucide-react';

interface BudgetRoadmapScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const BudgetRoadmapScreen: React.FC<BudgetRoadmapScreenProps> = ({ onNavigate }) => {
  const [selectedYear, setSelectedYear] = useState('2024');

  const budgetMonths: BudgetMonth[] = [
    { month: 1, monthName: 'Tháng 1', spent: 78500000, limit: 73100000, status: 'VƯỢT HẠN MỨC' },
    { month: 2, monthName: 'Tháng 2', spent: 62100000, limit: 73100000, status: 'AN TOÀN' },
    { month: 3, monthName: 'Tháng 3', spent: 58450000, limit: 73100000, status: 'AN TOÀN' },
    { month: 4, monthName: 'Tháng 4', spent: 69500000, limit: 73100000, status: 'AN TOÀN' },
    { month: 5, monthName: 'Tháng 5', spent: 32120000, limit: 73100000, status: 'HIỆN TẠI' },
    { month: 6, monthName: 'Tháng 6', spent: 0, limit: 73100000, status: 'CHƯA LẬP' },
    { month: 7, monthName: 'Tháng 7', spent: 0, limit: 73100000, status: 'CHƯA LẬP' },
    { month: 8, monthName: 'Tháng 8', spent: 0, limit: 73100000, status: 'CHƯA LẬP' },
    { month: 9, monthName: 'Tháng 9', spent: 0, limit: 73100000, status: 'CHƯA LẬP' },
    { month: 10, monthName: 'Tháng 10', spent: 0, limit: 73100000, status: 'CHƯA LẬP' },
    { month: 11, monthName: 'Tháng 11', spent: 0, limit: 73100000, status: 'CHƯA LẬP' },
    { month: 12, monthName: 'Tháng 12', spent: 0, limit: 73100000, status: 'CHƯA LẬP' },
  ];

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
            <span>AI Tư vấn</span>
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
          <button className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors">
            <Settings className="w-4 h-4" />
            <span>Cài đặt</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors">
            <HelpCircle className="w-4 h-4" />
            <span>Hỗ trợ</span>
          </button>
        </div>
      </aside>

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <span className="font-bold text-lg text-slate-900">FlowFi</span>

          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-slate-100 text-slate-600 relative">
              <Bell className="w-4 h-4" />
            </button>
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
              alt="Alex Chen"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-100"
            />
            <span className="text-xs font-semibold text-slate-800 hidden sm:inline">Alex Chen</span>
          </div>
        </header>

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Lộ trình Ngân sách {selectedYear}
              </h1>
              <p className="text-xs text-slate-500">
                Tổng quan chi tiêu hàng tháng và kế hoạch tài chính dài hạn.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-2 shadow-sm">
                <Download className="w-4 h-4 text-slate-500" />
                <span>Xuất báo cáo</span>
              </button>

              <button className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-blue-500/20">
                <Plus className="w-4 h-4" />
                <span>Thêm ngân sách</span>
              </button>
            </div>
          </div>

          {/* 12 Months Budget Grid (4x3) */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {budgetMonths.map((m) => {
              if (m.status === 'CHƯA LẬP') {
                return (
                  <div
                    key={m.month}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-2 bg-slate-50/40 hover:bg-slate-50 transition-colors cursor-pointer min-h-[170px]"
                  >
                    <p className="text-xs font-semibold text-slate-400">{m.monthName}</p>
                    <Plus className="w-6 h-6 text-slate-400" />
                    <div>
                      <p className="font-bold text-xs text-slate-800">Lập kế hoạch</p>
                      <p className="text-[10px] text-slate-400">Thiết lập ngân sách</p>
                    </div>
                  </div>
                );
              }

              const isOver = m.status === 'VƯỢT HẠN MỨC';
              const isCurrent = m.status === 'HIỆN TẠI';
              const percentage = Math.round((m.spent / m.limit) * 100);

              return (
                <div
                  key={m.month}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between min-h-[170px] ${
                    isCurrent
                      ? 'bg-blue-50/60 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200/80 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-600">{m.monthName}</span>
                      {isOver && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          VƯỢT HẠN MỨC
                        </span>
                      )}
                      {!isOver && !isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          AN TOÀN
                        </span>
                      )}
                      {isCurrent && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                          HIỆN TẠI
                        </span>
                      )}
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                      {m.spent.toLocaleString('vi-VN')} <span className="text-sm font-semibold">đ</span>
                    </h3>

                    <p className="text-[11px] font-medium mt-1">
                      {isOver && <span className="text-rose-600">Vượt: {(m.spent - m.limit).toLocaleString('vi-VN')} đ</span>}
                      {!isOver && !isCurrent && <span className="text-emerald-600">Dư: {(m.limit - m.spent).toLocaleString('vi-VN')} đ</span>}
                      {isCurrent && <span className="text-slate-500">Còn lại: {(m.limit - m.spent).toLocaleString('vi-VN')} đ</span>}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="pt-3 space-y-1">
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                        className={`h-full ${
                          isOver ? 'bg-rose-500' : isCurrent ? 'bg-blue-600' : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-medium text-slate-400">
                      <span>Hạn mức: {m.limit.toLocaleString('vi-VN')} đ</span>
                      <span className="font-bold">{percentage}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
};
