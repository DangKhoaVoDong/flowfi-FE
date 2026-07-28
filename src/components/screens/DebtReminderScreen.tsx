import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScreenId } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { paymentObligationService, tagService, walletService } from '../../services';
import type {
  CreatePaymentObligationDto,
  PaymentObligationDto,
  PaymentObligationFrequency,
  PaymentObligationPaymentDto,
  PaymentObligationPaymentStatus,
  TagDto,
  WalletDto,
} from '../../types/api';
import {
  LayoutDashboard, CreditCard, Bot, PieChart, Settings, HelpCircle,
  Bell, Plus, Calendar, X, Trash2, Loader2, Pencil, CheckCircle2,
  Clock, AlertCircle, DollarSign, Wallet, SkipForward, FileText
} from 'lucide-react';

interface DebtReminderScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

interface ObligationFormState {
  title: string;
  walletId: string;
  tagId: string;
  totalAmount: string;
  cycleCount: string;
  frequency: PaymentObligationFrequency;
  firstDueAt: string;
  reminderDaysBefore: string;
  note: string;
  isActive: boolean;
}

const FREQUENCY_LABELS: Record<PaymentObligationFrequency, string> = {
  ONCE: 'Một lần',
  WEEKLY: 'Hàng tuần',
  MONTHLY: 'Hàng tháng',
  YEARLY: 'Hàng năm',
};

const STATUS_LABELS: Record<PaymentObligationPaymentStatus, string> = {
  PENDING: 'Đang chờ',
  REMINDED: 'Đã nhắc',
  PAID: 'Đã trả',
  OVERDUE: 'Quá hạn',
  SKIPPED: 'Bỏ qua',
};

const emptyForm = (walletId = ''): ObligationFormState => ({
  title: '',
  walletId,
  tagId: '',
  totalAmount: '',
  cycleCount: '1',
  frequency: 'ONCE',
  firstDueAt: new Date().toISOString().split('T')[0],
  reminderDaysBefore: '3',
  note: '',
  isActive: true,
});

const toDateInput = (value?: string) => {
  if (!value) return new Date().toISOString().split('T')[0];
  return new Date(value).toISOString().split('T')[0];
};

const toVietnamOffset = (date: string) => `${date}T00:00:00+07:00`;

const formatMoney = (amount: number) => `${Number(amount || 0).toLocaleString('vi-VN')} đ`;

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có';

const daysUntil = (value?: string) => {
  if (!value) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
};

const isOpenPayment = (status: PaymentObligationPaymentStatus) =>
  status !== 'PAID' && status !== 'SKIPPED';

export const DebtReminderScreen: React.FC<DebtReminderScreenProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [obligations, setObligations] = useState<PaymentObligationDto[]>([]);
  const [paymentsByObligation, setPaymentsByObligation] = useState<Record<string, PaymentObligationPaymentDto[]>>({});
  const [wallets, setWallets] = useState<WalletDto[]>([]);
  const [tags, setTags] = useState<TagDto[]>([]);
  const [selectedObligationId, setSelectedObligationId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingObligation, setEditingObligation] = useState<PaymentObligationDto | null>(null);
  const [form, setForm] = useState<ObligationFormState>(emptyForm());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [obligationsRes, walletsRes, tagsRes] = await Promise.allSettled([
        paymentObligationService.getAll(),
        walletService.getAll(),
        tagService.getAll(),
      ]);

      const nextObligations =
        obligationsRes.status === 'fulfilled' && Array.isArray(obligationsRes.value)
          ? obligationsRes.value
          : [];
      const nextWallets =
        walletsRes.status === 'fulfilled' && Array.isArray(walletsRes.value)
          ? walletsRes.value
          : [];
      const nextTags =
        tagsRes.status === 'fulfilled' && Array.isArray(tagsRes.value)
          ? tagsRes.value
          : [];

      setObligations(nextObligations);
      setWallets(nextWallets);
      setTags(nextTags);
      setSelectedObligationId((current) =>
        current && nextObligations.some((item) => item.id === current)
          ? current
          : nextObligations[0]?.id || ''
      );

      const paymentResults = await Promise.allSettled(
        nextObligations.map((item) => paymentObligationService.getPayments(item.id))
      );
      const nextPayments: Record<string, PaymentObligationPaymentDto[]> = {};
      paymentResults.forEach((result, index) => {
        const obligationId = nextObligations[index]?.id;
        if (!obligationId) return;
        nextPayments[obligationId] =
          result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : [];
      });
      setPaymentsByObligation(nextPayments);
    } catch (error) {
      console.error('Error fetching payment obligations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const allPayments = useMemo(
    () => Object.values(paymentsByObligation).flat(),
    [paymentsByObligation]
  );

  const stats = useMemo(() => {
    const paidAmountByObligation = allPayments.reduce<Record<string, number>>((acc, payment) => {
      if (payment.status === 'PAID') {
        acc[payment.obligationId] = (acc[payment.obligationId] || 0) + Number(payment.amount || 0);
      }
      return acc;
    }, {});

    const outstanding = obligations
      .filter((item) => item.isActive)
      .reduce((sum, item) => {
        const paid = paidAmountByObligation[item.id] || 0;
        return sum + Math.max(0, Number(item.totalAmount || 0) - paid);
      }, 0);

    const dueSoon = allPayments.filter((payment) => {
      const dueIn = daysUntil(payment.dueAt);
      return isOpenPayment(payment.status) && dueIn >= 0 && dueIn <= 7;
    }).length;

    const overdue = allPayments.filter((payment) =>
      isOpenPayment(payment.status) &&
      (payment.status === 'OVERDUE' || daysUntil(payment.dueAt) < 0)
    ).length;

    const activeCount = obligations.filter((item) => item.isActive).length;
    return { outstanding, dueSoon, overdue, activeCount };
  }, [allPayments, obligations]);

  const selectedObligation = obligations.find((item) => item.id === selectedObligationId) || null;
  const selectedPayments = [...(selectedObligation ? paymentsByObligation[selectedObligation.id] || [] : [])]
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

  const getWalletName = (walletId: string) =>
    wallets.find((wallet) => wallet.id === walletId)?.name || 'Ví không xác định';

  const getTagName = (tagId?: string) =>
    tagId ? tags.find((tag) => tag.id === tagId)?.name || 'Danh mục' : 'Không gắn tag';

  const openCreateForm = () => {
    setEditingObligation(null);
    setForm(emptyForm(wallets[0]?.id || ''));
    setShowForm(true);
  };

  const openEditForm = (obligation: PaymentObligationDto) => {
    setEditingObligation(obligation);
    setForm({
      title: obligation.title,
      walletId: obligation.walletId,
      tagId: obligation.tagId || '',
      totalAmount: String(obligation.totalAmount),
      cycleCount: String(obligation.cycleCount),
      frequency: obligation.frequency,
      firstDueAt: toDateInput(obligation.firstDueAt),
      reminderDaysBefore: String(obligation.reminderDaysBefore),
      note: obligation.note || '',
      isActive: obligation.isActive,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingObligation(null);
    setForm(emptyForm(wallets[0]?.id || ''));
  };

  const buildPayload = (): CreatePaymentObligationDto => ({
    walletId: form.walletId,
    tagId: form.tagId || undefined,
    totalAmount: Number(form.totalAmount),
    cycleCount: Number(form.cycleCount),
    title: form.title.trim(),
    note: form.note.trim() || undefined,
    frequency: form.frequency,
    firstDueAt: toVietnamOffset(form.firstDueAt),
    reminderDaysBefore: Number(form.reminderDaysBefore),
    isActive: form.isActive,
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.walletId || !form.title.trim() || Number(form.totalAmount) <= 0) {
      alert('Vui lòng nhập tên khoản nợ, ví và số tiền hợp lệ.');
      return;
    }
    if (Number(form.cycleCount) > 1 && form.frequency === 'ONCE') {
      alert('Khoản trả nhiều kỳ cần chọn tần suất hàng tuần, hàng tháng hoặc hàng năm.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildPayload();
      if (editingObligation) {
        await paymentObligationService.update(editingObligation.id, payload);
      } else {
        await paymentObligationService.create(payload);
      }
      closeForm();
      await fetchData();
    } catch (error) {
      console.error('Error saving payment obligation:', error);
      alert('Không thể lưu lịch nhắc nợ. Vui lòng kiểm tra dữ liệu và thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (obligation: PaymentObligationDto) => {
    if (!confirm(`Xóa lịch nhắc "${obligation.title}"?`)) return;
    try {
      await paymentObligationService.delete(obligation.id);
      await fetchData();
    } catch (error) {
      console.error('Error deleting payment obligation:', error);
      alert('Không thể xóa lịch nhắc nợ.');
    }
  };

  const handlePay = async (payment: PaymentObligationPaymentDto) => {
    try {
      await paymentObligationService.payPayment(payment.id, { paidAt: new Date().toISOString() });
      await fetchData();
    } catch (error) {
      console.error('Error paying payment obligation:', error);
      alert('Không thể đánh dấu đã trả.');
    }
  };

  const handleSkip = async (payment: PaymentObligationPaymentDto) => {
    try {
      await paymentObligationService.skipPayment(payment.id);
      await fetchData();
    } catch (error) {
      console.error('Error skipping payment obligation:', error);
      alert('Không thể bỏ qua kỳ trả này.');
    }
  };

  const statusClass = (payment: PaymentObligationPaymentDto) => {
    if (payment.status === 'PAID') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (payment.status === 'SKIPPED') return 'bg-slate-100 text-slate-600 border-slate-200';
    if (payment.status === 'OVERDUE' || daysUntil(payment.dueAt) < 0) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (payment.status === 'REMINDED') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-900 font-sans flex">
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
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <PieChart className="w-4 h-4" />
            <span>Ngân sách</span>
          </button>
          <button
            onClick={() => onNavigate('debt-reminders')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 shadow-sm shadow-blue-500/20"
          >
            <Bell className="w-4 h-4" />
            <span>Nhắc nợ</span>
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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 truncate">Nhắc trả nợ</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-slate-100 text-slate-600 relative">
              <Bell className="w-4 h-4" />
              {stats.dueSoon > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />}
            </button>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-100" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold ring-2 ring-blue-100">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            )}
            <span className="text-xs font-semibold text-slate-800 hidden sm:inline">{user?.fullName || 'Người dùng'}</span>
            <button
              onClick={openCreateForm}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-sm shadow-blue-500/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm lịch nhắc</span>
            </button>
          </div>
        </header>

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Lịch nợ & kỳ trả</h2>
              <p className="text-xs text-slate-500">Theo dõi khoản phải trả, ngày đến hạn và trạng thái từng kỳ.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Hôm nay: {new Date().toLocaleDateString('vi-VN')}</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <div className="bg-blue-600 text-white p-5 rounded-2xl shadow-lg shadow-blue-500/15 min-h-[126px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-blue-100">Dư nợ còn lại</p>
                <DollarSign className="w-5 h-5 text-blue-100" />
              </div>
              <h3 className="text-2xl font-black tracking-tight">{formatMoney(stats.outstanding)}</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm min-h-[126px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Đến hạn 7 ngày</p>
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">{stats.dueSoon}</h3>
              <p className="text-[11px] text-slate-400">kỳ trả cần chú ý</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm min-h-[126px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Quá hạn</p>
                <AlertCircle className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="text-2xl font-black text-rose-600">{stats.overdue}</h3>
              <p className="text-[11px] text-slate-400">kỳ trả chưa xử lý</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm min-h-[126px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Khoản đang theo dõi</p>
                <FileText className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">{stats.activeCount}</h3>
              <p className="text-[11px] text-slate-400">lịch nhắc đang bật</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid xl:grid-cols-12 gap-5">
              <section className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Danh sách khoản nợ</h3>
                    <p className="text-xs text-slate-400">Chọn một khoản để xem lịch trả chi tiết.</p>
                  </div>
                  <button
                    onClick={openCreateForm}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tạo mới</span>
                  </button>
                </div>

                {obligations.length === 0 ? (
                  <div className="p-10 text-center text-slate-400">
                    <Bell className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="font-semibold text-slate-500">Chưa có lịch nhắc nợ nào</p>
                    <p className="text-xs mt-1">Tạo lịch đầu tiên để FlowFi nhắc bạn trước hạn trả.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {obligations.map((obligation) => {
                      const dueIn = daysUntil(obligation.nextDueAt);
                      const selected = selectedObligationId === obligation.id;
                      return (
                        <button
                          key={obligation.id}
                          onClick={() => setSelectedObligationId(obligation.id)}
                          className={`w-full text-left p-5 hover:bg-slate-50 transition-colors ${selected ? 'bg-blue-50/60' : 'bg-white'}`}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                                selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                                <Wallet className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-sm text-slate-900 truncate">{obligation.title}</h4>
                                  {!obligation.isActive && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                                      TẮT
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500">
                                  {getWalletName(obligation.walletId)} • {getTagName(obligation.tagId)}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-1">
                                  Nhắc trước {obligation.reminderDaysBefore} ngày • {FREQUENCY_LABELS[obligation.frequency]}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between lg:justify-end gap-5">
                              <div className="text-right">
                                <p className="text-sm font-black text-slate-900">{formatMoney(obligation.totalAmount)}</p>
                                <p className="text-[11px] text-slate-400">
                                  {obligation.cycleCount} kỳ × {formatMoney(obligation.amountPerCycle)}
                                </p>
                              </div>
                              <div className="text-right min-w-[96px]">
                                <p className={`text-xs font-bold ${dueIn < 0 ? 'text-rose-600' : dueIn <= 7 ? 'text-amber-600' : 'text-slate-700'}`}>
                                  {dueIn < 0 ? `Trễ ${Math.abs(dueIn)} ngày` : dueIn === 0 ? 'Hôm nay' : `Còn ${dueIn} ngày`}
                                </p>
                                <p className="text-[11px] text-slate-400">{formatDate(obligation.nextDueAt)}</p>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-bold text-base text-slate-900">Kỳ trả</h3>
                    <p className="text-xs text-slate-400 truncate">
                      {selectedObligation ? selectedObligation.title : 'Chọn một khoản nợ để xem lịch'}
                    </p>
                  </div>
                  {selectedObligation && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditForm(selectedObligation)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                        title="Sửa lịch nhắc"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(selectedObligation)}
                        className="p-2 rounded-lg hover:bg-rose-50 text-rose-500"
                        title="Xóa lịch nhắc"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {!selectedObligation ? (
                  <div className="p-10 text-center text-slate-400">
                    <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="text-xs">Chưa có kỳ trả nào để hiển thị.</p>
                  </div>
                ) : (
                  <div className="p-5 space-y-3 max-h-[620px] overflow-y-auto">
                    {selectedPayments.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-8">Chưa có dữ liệu kỳ trả.</p>
                    ) : (
                      selectedPayments.map((payment) => {
                        const dueIn = daysUntil(payment.dueAt);
                        const open = isOpenPayment(payment.status);
                        return (
                          <div key={payment.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-bold text-sm text-slate-900">{formatMoney(payment.amount)}</p>
                                <p className="text-xs text-slate-500">Hạn trả: {formatDate(payment.dueAt)}</p>
                                {open && (
                                  <p className={`text-[11px] font-semibold mt-1 ${dueIn < 0 ? 'text-rose-600' : dueIn <= 7 ? 'text-amber-600' : 'text-slate-400'}`}>
                                    {dueIn < 0 ? `Đã quá hạn ${Math.abs(dueIn)} ngày` : dueIn === 0 ? 'Đến hạn hôm nay' : `Còn ${dueIn} ngày`}
                                  </p>
                                )}
                              </div>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusClass(payment)}`}>
                                {payment.status === 'PAID' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {STATUS_LABELS[payment.status]}
                              </span>
                            </div>

                            {payment.remindedAt && (
                              <p className="text-[11px] text-slate-400">Đã nhắc: {formatDate(payment.remindedAt)}</p>
                            )}
                            {payment.paidAt && (
                              <p className="text-[11px] text-emerald-600 font-medium">Đã trả: {formatDate(payment.paidAt)}</p>
                            )}

                            {open && (
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                  onClick={() => handlePay(payment)}
                                  className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Đã trả</span>
                                </button>
                                <button
                                  onClick={() => handleSkip(payment)}
                                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5"
                                >
                                  <SkipForward className="w-4 h-4" />
                                  <span>Bỏ qua</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  {editingObligation ? 'Sửa lịch nhắc nợ' : 'Thêm lịch nhắc nợ'}
                </h3>
                <p className="text-xs text-slate-400">Thiết lập số tiền, chu kỳ và thời điểm FlowFi cần nhắc bạn.</p>
              </div>
              <button onClick={closeForm} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tên khoản nợ</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    placeholder="Ví dụ: Trả góp laptop, khoản vay gia đình..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ví thanh toán</label>
                  <select
                    value={form.walletId}
                    onChange={(event) => setForm({ ...form, walletId: event.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600"
                    required
                  >
                    <option value="">Chọn ví</option>
                    {wallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>{wallet.name} ({wallet.currency})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Danh mục</label>
                  <select
                    value={form.tagId}
                    onChange={(event) => setForm({ ...form, tagId: event.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600"
                  >
                    <option value="">Không gắn tag</option>
                    {tags.map((tag) => (
                      <option key={tag.id} value={tag.id}>{tag.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng số tiền</label>
                  <input
                    type="number"
                    min="1"
                    value={form.totalAmount}
                    onChange={(event) => setForm({ ...form, totalAmount: event.target.value })}
                    placeholder="5000000"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Số kỳ trả</label>
                  <input
                    type="number"
                    min="1"
                    max="240"
                    value={form.cycleCount}
                    onChange={(event) => setForm({
                      ...form,
                      cycleCount: event.target.value,
                      frequency: Number(event.target.value) > 1 && form.frequency === 'ONCE' ? 'MONTHLY' : form.frequency,
                    })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tần suất</label>
                  <select
                    value={form.frequency}
                    onChange={(event) => setForm({ ...form, frequency: event.target.value as PaymentObligationFrequency })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600"
                  >
                    <option value="ONCE">Một lần</option>
                    <option value="WEEKLY">Hàng tuần</option>
                    <option value="MONTHLY">Hàng tháng</option>
                    <option value="YEARLY">Hàng năm</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ngày đến hạn đầu tiên</label>
                  <input
                    type="date"
                    value={form.firstDueAt}
                    onChange={(event) => setForm({ ...form, firstDueAt: event.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nhắc trước</label>
                  <select
                    value={form.reminderDaysBefore}
                    onChange={(event) => setForm({ ...form, reminderDaysBefore: event.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600"
                  >
                    {[0, 1, 2, 3, 5, 7, 14, 30].map((day) => (
                      <option key={day} value={day}>{day === 0 ? 'Đúng ngày đến hạn' : `${day} ngày trước hạn`}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ghi chú</label>
                  <textarea
                    value={form.note}
                    onChange={(event) => setForm({ ...form, note: event.target.value })}
                    placeholder="Thêm thông tin người nhận, điều kiện trả nợ hoặc ghi chú cá nhân..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600 resize-none"
                  />
                </div>

                <label className="md:col-span-2 flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-700">Bật nhắc nợ cho lịch này</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingObligation ? 'Lưu thay đổi' : 'Tạo lịch nhắc'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
