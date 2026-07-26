import React, { useState } from 'react';
import { ScreenId, Wallet } from '../../types';
import { 
  LayoutDashboard, CreditCard, Bot, PieChart, Settings, HelpCircle, 
  Search, Bell, Plus, ArrowLeftRight, Download, Filter, Calendar, 
  Cloud, DollarSign, Coffee, ChevronLeft, ChevronRight, CheckCircle2, Clock
} from 'lucide-react';

interface TransactionsWalletsScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const TransactionsWalletsScreen: React.FC<TransactionsWalletsScreenProps> = ({ onNavigate }) => {
  const [filterType, setFilterType] = useState('Tất cả loại');
  const [filterDate, setFilterDate] = useState('30 ngày qua');
  const [filterWallet, setFilterWallet] = useState('Tất cả thẻ');
  const [showAddWallet, setShowAddWallet] = useState(false);

  // Wallets data
  const [wallets, setWallets] = useState<Wallet[]>([
    {
      id: 'w-1',
      name: 'Chase Platinum',
      type: 'Tiết kiệm chính',
      balance: 142850,
      currency: 'VNĐ',
      color: 'bg-blue-600 text-white',
      isPrimary: true
    },
    {
      id: 'w-2',
      name: 'Brex Corporate',
      type: 'Chi phí vận hành',
      balance: 28402.15,
      currency: 'VNĐ',
      color: 'bg-white border border-slate-200 text-slate-900',
    },
    {
      id: 'w-3',
      name: 'Coinbase Prime',
      type: 'Tài sản số',
      balance: 4.825,
      currency: 'BTC',
      color: 'bg-white border border-slate-200 text-slate-900',
    }
  ]);

  // Transactions list
  const txHistory = [
    {
      id: 'h-1',
      date: '24 thg 10, 2023',
      vendor: 'Dịch vụ đám mây AWS',
      sub: 'Chi phí hạ tầng',
      wallet: 'Brex Corporate',
      status: 'HOÀN THÀNH',
      amount: -2140.00,
      icon: 'cloud'
    },
    {
      id: 'h-2',
      date: '22 thg 10, 2023',
      vendor: 'Thanh toán Stripe',
      sub: 'Doanh thu SaaS',
      wallet: 'Chase Platinum',
      status: 'HOÀN THÀNH',
      amount: 14200.50,
      icon: 'stripe'
    },
    {
      id: 'h-3',
      date: '20 thg 10, 2023',
      vendor: 'Blue Bottle Coffee',
      sub: 'Chi phí Ăn uống & Đi lại',
      wallet: 'Brex Corporate',
      status: 'ĐANG CHỜ',
      amount: -14.50,
      icon: 'coffee'
    }
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
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 shadow-sm shadow-blue-500/20"
          >
            <CreditCard className="w-4 h-4" />
            <span>Giao dịch</span>
          </button>

          <button
            onClick={() => onNavigate('ai-input')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <Bot className="w-4 h-4" />
            <span>Đầu vào AI</span>
          </button>

          <button
            onClick={() => onNavigate('budget')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
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
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
              alt="Alex Rivera"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-100"
            />
            <span className="text-xs font-semibold text-slate-800 hidden sm:inline">Alex Rivera</span>
          </div>
        </header>

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Section Header with Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Giao dịch & Ví</h1>
              <p className="text-xs text-slate-500">Quản lý tính thanh khoản và theo dõi biến động lịch sử của bạn.</p>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-slate-600" />
                <span>Chuyển khoản nội bộ</span>
              </button>

              <button 
                onClick={() => setShowAddWallet(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Ví</span>
              </button>
            </div>
          </div>

          {/* Wallets Row */}
          <div className="grid md:grid-cols-3 gap-5">
            {wallets.map((w) => (
              <div 
                key={w.id} 
                className={`p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[150px] ${w.color}`}
              >
                <div>
                  <p className={`text-xs font-semibold mb-1 ${w.isPrimary ? 'text-blue-100' : 'text-slate-500'}`}>
                    {w.type}
                  </p>
                  <h3 className="text-xl font-bold tracking-tight mb-4">{w.name}</h3>
                </div>

                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight">
                    {w.balance.toLocaleString('vi-VN')} <span className="text-sm font-semibold">{w.currency}</span>
                  </h2>
                </div>
              </div>
            ))}
          </div>

          {/* Advanced History */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="font-bold text-base text-slate-900">Lịch sử nâng cao</h3>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-transparent outline-none cursor-pointer"
                  >
                    <option>Tất cả loại</option>
                    <option>Chi tiêu</option>
                    <option>Thu nhập</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <select 
                    value={filterDate} 
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="bg-transparent outline-none cursor-pointer"
                  >
                    <option>30 ngày qua</option>
                    <option>7 ngày qua</option>
                    <option>Tháng này</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <select 
                    value={filterWallet} 
                    onChange={(e) => setFilterWallet(e.target.value)}
                    className="bg-transparent outline-none cursor-pointer"
                  >
                    <option>Tất cả thẻ</option>
                    <option>Brex Corporate</option>
                    <option>Chase Platinum</option>
                  </select>
                </div>

                <button className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium text-xs rounded-xl flex items-center gap-1.5 transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Ngày</th>
                    <th className="py-3 px-4">Đơn vị / Người nhận</th>
                    <th className="py-3 px-4">Ví</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {txHistory.map((row) => {
                    const isExpense = row.amount < 0;
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4 text-slate-500 font-mono whitespace-nowrap">{row.date}</td>
                        <td className="py-4 px-4 font-semibold text-slate-900 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                            {row.icon === 'cloud' && <Cloud className="w-4 h-4 text-blue-600" />}
                            {row.icon === 'stripe' && <DollarSign className="w-4 h-4 text-emerald-600" />}
                            {row.icon === 'coffee' && <Coffee className="w-4 h-4 text-amber-600" />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{row.vendor}</div>
                            <div className="text-[11px] text-slate-400 font-normal">{row.sub}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600 font-semibold">{row.wallet}</td>
                        <td className="py-4 px-4">
                          {row.status === 'HOÀN THÀNH' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              HOÀN THÀNH
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              ĐANG CHỜ
                            </span>
                          )}
                        </td>
                        <td className={`py-4 px-4 text-right font-black text-sm whitespace-nowrap ${isExpense ? 'text-slate-900' : 'text-emerald-600'}`}>
                          {isExpense ? '' : '+'}{row.amount.toLocaleString('vi-VN', { minimumFractionDigits: 2 })} đ
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Hiển thị 1-10 của 124 giao dịch</span>
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Wallet Modal */}
      {showAddWallet && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Thêm Ví mới</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên ví / Ngân hàng</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Vietcombank, Momo..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Số dư ban đầu (VNĐ)</label>
                <input
                  type="number"
                  placeholder="10000000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowAddWallet(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-600"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    setWallets([...wallets, {
                      id: `w-${Date.now()}`,
                      name: 'Momo Wallet',
                      type: 'Ví điện tử',
                      balance: 10000000,
                      currency: 'VNĐ',
                      color: 'bg-white border border-slate-200 text-slate-900'
                    }]);
                    setShowAddWallet(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs"
                >
                  Thêm Ví
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
