import React, { useState } from 'react';
import { ScreenId, Transaction } from '../../types';
import { 
  LayoutDashboard, CreditCard, Bot, PieChart, Settings, HelpCircle, 
  Search, Bell, Plus, Wallet, TrendingUp, TrendingDown, MoreHorizontal, 
  Download, PiggyBank, Award, Landmark, AlertCircle, ShoppingBag, Car, DollarSign, Laptop
} from 'lucide-react';

interface UserDashboardScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const UserDashboardScreen: React.FC<UserDashboardScreenProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<ScreenId>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New transaction modal state
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('Ăn uống');

  // Initial transactions from design
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'tx-1',
      date: '24 Th10, 2023',
      description: 'Siêu thị WinMart',
      category: 'Ăn uống',
      amount: -142300,
      icon: 'shopping'
    },
    {
      id: 'tx-2',
      date: '23 Th10, 2023',
      description: 'Chuyến đi Grab',
      category: 'Di chuyển',
      amount: -24500,
      icon: 'car'
    },
    {
      id: 'tx-3',
      date: '22 Th10, 2023',
      description: 'Lương tháng',
      category: 'Lương',
      amount: 8500000,
      icon: 'salary'
    },
    {
      id: 'tx-4',
      date: '21 Th10, 2023',
      description: 'Cửa hàng Apple',
      category: 'Công nghệ',
      amount: -2499000,
      icon: 'apple'
    },
  ]);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc || !newAmount) return;

    const parsedAmt = parseFloat(newAmount);
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      date: 'Hôm nay',
      description: newDesc,
      category: newCategory,
      amount: parsedAmt,
    };

    setTransactions([newTx, ...transactions]);
    setNewDesc('');
    setNewAmount('');
    setShowAddModal(false);
  };

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
                alt="Alex Rivera"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-100"
              />
            </div>

            {/* Add Transaction Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-sm shadow-blue-500/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Giao dịch mới</span>
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Welcome subtitle */}
          <p className="text-xs text-slate-500 font-medium -mt-2">
            Chào mừng bạn trở lại. Sức khỏe tài chính của bạn hôm nay rất ổn định.
          </p>

          {/* Top 3 Summary Cards */}
          <div className="grid md:grid-cols-3 gap-5">
            {/* Primary Blue Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg shadow-blue-500/15 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
              <Wallet className="w-24 h-24 text-white/10 absolute -right-4 -bottom-4 pointer-events-none" />
              <div>
                <p className="text-xs font-semibold text-blue-100 mb-1">Tổng số dư</p>
                <h2 className="text-3xl font-extrabold tracking-tight">124.592.000 đ</h2>
              </div>
              <div className="pt-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  +2.4% so với tháng trước
                </span>
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
                <h2 className="text-2xl font-bold text-slate-900">12.450.000 đ</h2>
                <div className="mt-3 space-y-1">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[75%]" />
                  </div>
                  <p className="text-[11px] text-slate-400">Đạt 75% mục tiêu thu nhập</p>
                </div>
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
                <h2 className="text-2xl font-bold text-slate-900">4.821.500 đ</h2>
                <div className="mt-3 space-y-1">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full w-[39%]" />
                  </div>
                  <p className="text-[11px] text-slate-400">Đã dùng 39% ngân sách tháng</p>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Grid: Cashflow Chart + Monthly Budget */}
          <div className="grid lg:grid-cols-12 gap-5">
            {/* Cashflow Chart (8 cols) */}
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Xu hướng dòng tiền</h3>
                  <p className="text-xs text-slate-400">Thu nhập vs Chi tiêu hàng ngày</p>
                </div>
                <select className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none">
                  <option>7 ngày qua</option>
                  <option>30 ngày qua</option>
                  <option>Tháng này</option>
                </select>
              </div>

              {/* Bar Chart Representation */}
              <div className="h-48 flex items-end justify-between gap-3 px-2 pt-4 border-b border-slate-100 pb-2">
                {[
                  { day: 'T2', income: 80, expense: 40 },
                  { day: 'T3', income: 90, expense: 30 },
                  { day: 'T4', income: 85, expense: 45 },
                  { day: 'T5', income: 75, expense: 50 },
                  { day: 'T6', income: 95, expense: 60 },
                  { day: 'T7', income: 80, expense: 35 },
                  { day: 'CN', income: 60, expense: 30 },
                ].map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full flex items-end justify-center gap-1 h-36">
                      {/* Income Bar (Light Blue) */}
                      <div 
                        style={{ height: `${item.income}%` }} 
                        className="w-1/2 bg-blue-200 rounded-t-sm group-hover:bg-blue-300 transition-all" 
                        title={`Thu nhập: ${item.income}`}
                      />
                      {/* Expense Bar (Dark Blue) */}
                      <div 
                        style={{ height: `${item.expense}%` }} 
                        className="w-1/2 bg-blue-600 rounded-t-sm group-hover:bg-blue-700 transition-all" 
                        title={`Chi tiêu: ${item.expense}`}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">{item.day}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-6 pt-4 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-blue-200" />
                  <span>Thu nhập</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-blue-600" />
                  <span>Chi tiêu</span>
                </div>
              </div>
            </div>

            {/* Monthly Budget (4 cols) */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base text-slate-900">Ngân sách tháng</h3>
                  <button className="text-slate-400 hover:text-slate-600">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Category 1: Giải trí */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800">Giải trí</span>
                      <span className="text-rose-600 font-bold">92%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full w-[92%]" />
                    </div>
                    <p className="text-[11px] text-rose-500 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" />
                      Còn lại 80.000 đ
                    </p>
                  </div>

                  {/* Category 2: Ăn uống */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800">Ăn uống</span>
                      <span className="text-slate-500">45%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[45%]" />
                    </div>
                    <p className="text-[11px] text-slate-400">Đã dùng 1.200k trên 2.500k</p>
                  </div>

                  {/* Category 3: Nhà ở & Hóa đơn */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800">Nhà ở & Hóa đơn</span>
                      <span className="text-slate-500">60%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full w-[60%]" />
                    </div>
                    <p className="text-[11px] text-slate-400">Đã dùng 3.000k trên 5.000k</p>
                  </div>
                </div>
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
                        <td className={`py-4 px-6 text-right font-bold text-sm whitespace-nowrap ${isExpense ? 'text-slate-900' : 'text-emerald-600'}`}>
                          {isExpense ? '' : '+'}{tx.amount.toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Financial Ratios */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <PiggyBank className="w-4 h-4" />
              </div>
              <p className="text-[11px] font-medium text-slate-500 mb-0.5">Tỷ lệ tiết kiệm</p>
              <h4 className="text-2xl font-black text-slate-900">32%</h4>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <Award className="w-4 h-4" />
              </div>
              <p className="text-[11px] font-medium text-slate-500 mb-0.5">Điểm tín dụng</p>
              <h4 className="text-2xl font-black text-slate-900">784</h4>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                <Landmark className="w-4 h-4" />
              </div>
              <p className="text-[11px] font-medium text-slate-500 mb-0.5">Giá trị tài sản ròng</p>
              <h4 className="text-2xl font-black text-slate-900">2.4 tỷ</h4>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2">
                <TrendingDown className="w-4 h-4" />
              </div>
              <p className="text-[11px] font-medium text-slate-500 mb-0.5">Tỷ lệ nợ</p>
              <h4 className="text-2xl font-black text-slate-900">12%</h4>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Số tiền (VNĐ) - Dấu (-) nếu là chi tiêu</label>
                <input
                  type="number"
                  placeholder="-50000"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600"
                  required
                />
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
    </div>
  );
};
