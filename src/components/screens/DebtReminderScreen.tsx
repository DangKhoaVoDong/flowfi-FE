import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScreenId } from '../../types';
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
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Pencil,
  Plus,
  SkipForward,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';

interface DebtReminderScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

interface ObligationFormState {
  title: string;
  walletId: string;
  tagId: string;
  amountPerCycle: string;
  cycleCount: string;
  intervalCount: string;
  frequencyUnit: PaymentFrequencyUnit;
  firstDueAt: string;
  reminderDaysBefore: string;
  note: string;
  isActive: boolean;
}

interface ObligationProgress {
  totalCycles: number;
  paidCycles: number;
  remainingCycles: number;
  paidAmount: number;
  remainingAmount: number;
}

type PaymentFrequencyUnit = 'DAILY' | 'MONTHLY' | 'YEARLY';

const FREQUENCY_UNIT_LABELS: Record<PaymentFrequencyUnit, string> = {
  DAILY: 'Ngày',
  MONTHLY: 'Tháng',
  YEARLY: 'Năm',
};

const FREQUENCY_UNIT_DISPLAY: Record<PaymentFrequencyUnit, string> = {
  DAILY: 'ngày',
  MONTHLY: 'tháng',
  YEARLY: 'năm',
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
  amountPerCycle: '',
  cycleCount: '1',
  intervalCount: '1',
  frequencyUnit: 'MONTHLY',
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

const normalizeScheduleForForm = (
  frequency: PaymentObligationFrequency,
  intervalCount?: number
): { intervalCount: string; frequencyUnit: PaymentFrequencyUnit } => {
  const safeInterval = Number(intervalCount || 1);
  const normalizedInterval = safeInterval >= 1 && safeInterval <= 365 ? safeInterval : 1;

  if (frequency === 'WEEKLY') {
    return { intervalCount: '7', frequencyUnit: 'DAILY' };
  }

  if (frequency === 'DAILY' || frequency === 'MONTHLY' || frequency === 'YEARLY') {
    return { intervalCount: String(normalizedInterval), frequencyUnit: frequency };
  }

  return { intervalCount: '1', frequencyUnit: 'MONTHLY' };
};

const formatPaymentFrequency = (
  frequency: PaymentObligationFrequency,
  intervalCount?: number
) => {
  if (frequency === 'ONCE') return 'Một lần';

  const schedule = normalizeScheduleForForm(frequency, intervalCount);
  return `Mỗi ${schedule.intervalCount} ${FREQUENCY_UNIT_DISPLAY[schedule.frequencyUnit]}`;
};

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

const calculateProgress = (
  obligation: PaymentObligationDto,
  payments: PaymentObligationPaymentDto[]
): ObligationProgress => {
  const paidPayments = payments.filter((payment) => payment.status === 'PAID');
  const paidAmount = paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const totalCycles = Number(obligation.cycleCount || payments.length || 0);
  const paidCycles = paidPayments.length;

  return {
    totalCycles,
    paidCycles,
    remainingCycles: Math.max(0, totalCycles - paidCycles),
    paidAmount,
    remainingAmount: Math.max(0, Number(obligation.totalAmount || 0) - paidAmount),
  };
};

export const DebtReminderScreen: React.FC<DebtReminderScreenProps> = () => {
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
  const [processingPaymentIds, setProcessingPaymentIds] = useState<Set<string>>(() => new Set());

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
  const selectedProgress = selectedObligation
    ? calculateProgress(selectedObligation, selectedPayments)
    : null;

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
    const schedule = normalizeScheduleForForm(obligation.frequency, obligation.intervalCount);

    setEditingObligation(obligation);
    setForm({
      title: obligation.title,
      walletId: obligation.walletId,
      tagId: obligation.tagId || '',
      amountPerCycle: String(obligation.amountPerCycle),
      cycleCount: String(obligation.cycleCount),
      intervalCount: schedule.intervalCount,
      frequencyUnit: schedule.frequencyUnit,
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

  const amountPerCycle = Number(form.amountPerCycle);
  const cycleCount = Number(form.cycleCount);
  const intervalCount = Number(form.intervalCount);
  const estimatedTotalAmount = amountPerCycle > 0 && cycleCount > 0 ? amountPerCycle * cycleCount : 0;

  const buildPayload = (): CreatePaymentObligationDto => ({
    walletId: form.walletId,
    tagId: form.tagId || undefined,
    totalAmount: estimatedTotalAmount,
    cycleCount,
    title: form.title.trim(),
    note: form.note.trim() || undefined,
    frequency: form.frequencyUnit,
    intervalCount,
    firstDueAt: toVietnamOffset(form.firstDueAt),
    reminderDaysBefore: Number(form.reminderDaysBefore),
    isActive: form.isActive,
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.walletId || !form.title.trim() || amountPerCycle <= 0) {
      alert('Vui lòng nhập tên khoản nợ, ví và số tiền mỗi kỳ hợp lệ.');
      return;
    }
    if (intervalCount < 1 || intervalCount > 365) {
      alert('Vui lòng nhập chu kỳ trả từ 1 đến 365.');
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
    if (processingPaymentIds.has(payment.id)) return;
    setProcessingPaymentIds((current) => new Set(current).add(payment.id));
    try {
      await paymentObligationService.payPayment(payment.id, { paidAt: new Date().toISOString() });
      await fetchData();
    } catch (error) {
      console.error('Error paying payment obligation:', error);
      alert('Không thể đánh dấu đã trả.');
    } finally {
      setProcessingPaymentIds((current) => {
        const next = new Set(current);
        next.delete(payment.id);
        return next;
      });
    }
  };

  const handleSkip = async (payment: PaymentObligationPaymentDto) => {
    if (processingPaymentIds.has(payment.id)) return;
    setProcessingPaymentIds((current) => new Set(current).add(payment.id));
    try {
      await paymentObligationService.skipPayment(payment.id);
      await fetchData();
    } catch (error) {
      console.error('Error skipping payment obligation:', error);
      alert('Không thể bỏ qua kỳ trả này.');
    } finally {
      setProcessingPaymentIds((current) => {
        const next = new Set(current);
        next.delete(payment.id);
        return next;
      });
    }
  };

  const statusClass = (payment: PaymentObligationPaymentDto) => {
    if (payment.status === 'PAID') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (payment.status === 'SKIPPED') return 'bg-slate-100 text-slate-600 border-slate-200';
    if (payment.status === 'OVERDUE' || daysUntil(payment.dueAt) < 0) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (payment.status === 'REMINDED') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const dueLabel = (value?: string) => {
    const dueIn = daysUntil(value);
    if (dueIn < 0) return `Trễ ${Math.abs(dueIn)} ngày`;
    if (dueIn === 0) return 'Hôm nay';
    return `${dueIn} ngày nữa`;
  };

  const dueLabelClass = (value?: string) => {
    const dueIn = daysUntil(value);
    if (dueIn < 0) return 'text-rose-600';
    if (dueIn <= 7) return 'text-orange-600';
    return 'text-slate-500';
  };

  const paymentDueHint = (value?: string) => {
    const dueIn = daysUntil(value);
    if (dueIn < 0) return `Đã quá hạn ${Math.abs(dueIn)} ngày`;
    if (dueIn === 0) return 'Đến hạn hôm nay';
    return `Còn ${dueIn} ngày`;
  };

  return (
    <div className="min-h-[calc(100vh-70px)] bg-[#f7f9fe] text-[#101828]">
      <main className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[28px] font-black leading-tight tracking-normal text-[#101828] sm:text-[32px]">
              Lịch trả nợ
            </h1>
            <p className="mt-1 text-sm text-[#667085]">
              Theo dõi các khoản nợ, ngày đến hạn và trạng thái từng kỳ.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-[10px] bg-white px-3 py-2 text-sm font-bold text-[#344054] shadow-[0_1px_2px_rgba(16,24,40,0.05)] ring-1 ring-[#e7eaf0]">
            <Calendar className="h-4 w-4 text-[#475467]" />
            <span>Hôm nay: {new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="min-h-[132px] rounded-[14px] bg-gradient-to-br from-[#7c5cff] to-[#4f46e5] p-5 text-white shadow-[0_12px_28px_rgba(91,77,245,0.22)]">
            <div className="flex h-full items-center gap-5">
              <span className="grid h-[58px] w-[58px] shrink-0 place-items-center rounded-[14px] bg-white/95 text-[#5b4df5]">
                <Wallet className="h-7 w-7" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white/85">Tổng dư nợ</p>
                <strong className="mt-2 block truncate text-[28px] font-black leading-tight">
                  {formatMoney(stats.outstanding)}
                </strong>
              </div>
            </div>
          </article>

          <article className="min-h-[132px] rounded-[14px] border border-[#e7eaf0] bg-white p-5 shadow-[0_8px_20px_rgba(16,24,40,0.04)]">
            <div className="flex h-full items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-500">
                <Clock className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-medium text-[#344054]">Đến hạn 7 ngày</p>
                <strong className="mt-2 block text-[28px] font-black leading-none text-[#101828]">
                  {stats.dueSoon}
                </strong>
                <span className="mt-2 block text-xs text-[#667085]">kỳ trả cần chú ý</span>
              </div>
            </div>
          </article>

          <article className="min-h-[132px] rounded-[14px] border border-[#e7eaf0] bg-white p-5 shadow-[0_8px_20px_rgba(16,24,40,0.04)]">
            <div className="flex h-full items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-500">
                <AlertCircle className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-medium text-[#344054]">Quá hạn</p>
                <strong className="mt-2 block text-[28px] font-black leading-none text-rose-600">
                  {stats.overdue}
                </strong>
                <span className="mt-2 block text-xs text-[#667085]">kỳ trả chưa xử lý</span>
              </div>
            </div>
          </article>

          <article className="min-h-[132px] rounded-[14px] border border-[#e7eaf0] bg-white p-5 shadow-[0_8px_20px_rgba(16,24,40,0.04)]">
            <div className="flex h-full items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#eef4ff] text-[#2970ff]">
                <FileText className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-medium text-[#344054]">Đang theo dõi</p>
                <strong className="mt-2 block text-[28px] font-black leading-none text-[#101828]">
                  {stats.activeCount}
                </strong>
                <span className="mt-2 block text-xs text-[#667085]">khoản nợ đang bật nhắc</span>
              </div>
            </div>
          </article>
        </div>

        {isLoading ? (
          <div className="grid min-h-[420px] place-items-center rounded-[14px] border border-[#e7eaf0] bg-white">
            <Loader2 className="h-9 w-9 animate-spin text-[#5b4df5]" />
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(420px,0.96fr)_minmax(520px,1.04fr)]">
            <section className="overflow-hidden rounded-[14px] border border-[#e7eaf0] bg-white shadow-[0_8px_20px_rgba(16,24,40,0.04)]">
              <div className="flex items-start justify-between gap-4 border-b border-[#edf0f5] p-5 sm:p-6">
                <div className="min-w-0">
                  <h2 className="text-xl font-black leading-tight text-[#101828]">Danh sách khoản nợ</h2>
                  <p className="mt-1 text-sm text-[#667085]">Chọn một khoản để xem lịch trả chi tiết.</p>
                </div>
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[9px] border border-[#6f63ff] bg-white px-4 text-sm font-bold text-[#5b4df5] transition hover:bg-[#f4f2ff]"
                >
                  <Plus className="h-5 w-5" />
                  <span>Thêm khoản nợ</span>
                </button>
              </div>

              {obligations.length === 0 ? (
                <div className="grid min-h-[360px] place-items-center px-6 py-12 text-center">
                  <div>
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#f4f2ff] text-[#5b4df5]">
                      <Bell className="h-7 w-7" />
                    </span>
                    <p className="mt-4 text-base font-black text-[#344054]">Chưa có lịch nhắc nợ nào</p>
                    <p className="mt-1 text-sm text-[#667085]">Tạo lịch đầu tiên để FlowFi nhắc bạn trước hạn trả.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-0">
                  {obligations.map((obligation) => {
                    const selected = selectedObligationId === obligation.id;
                    const progress = calculateProgress(
                      obligation,
                      paymentsByObligation[obligation.id] || []
                    );
                    return (
                      <button
                        key={obligation.id}
                        type="button"
                        onClick={() => setSelectedObligationId(obligation.id)}
                        className={`w-full border-b border-[#edf0f5] p-5 text-left transition last:border-b-0 ${
                          selected
                            ? 'border-l-4 border-l-[#6f63ff] bg-[#f7f5ff]'
                            : 'border-l-4 border-l-transparent bg-white hover:bg-[#fafbff]'
                        }`}
                      >
                        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                          <div className="flex min-w-0 gap-4">
                            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-[11px] ${
                              selected ? 'bg-[#7c5cff] text-white' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              <Wallet className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                              <div className="flex min-w-0 items-center gap-2">
                                <h3 className="truncate text-base font-black text-[#101828]">{obligation.title}</h3>
                                {!obligation.isActive && (
                                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">
                                    Tắt
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 truncate text-sm text-[#667085]">
                                {getWalletName(obligation.walletId)} · {getTagName(obligation.tagId)}
                              </p>
                              <p className="mt-1 truncate text-xs text-[#667085]">
                                Nhắc trước {obligation.reminderDaysBefore} ngày · {formatPaymentFrequency(obligation.frequency, obligation.intervalCount)}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-[1fr_auto] items-end gap-6 md:min-w-[230px]">
                            <div className="text-right">
                              <strong className="block text-base font-black text-[#101828]">
                                {formatMoney(obligation.totalAmount)}
                              </strong>
                              <span className="mt-1 block text-sm text-[#667085]">
                                {obligation.cycleCount} kỳ × {formatMoney(obligation.amountPerCycle)}
                              </span>
                            </div>
                            <div className="min-w-[82px] text-right">
                              <strong className={`block text-sm font-black ${dueLabelClass(obligation.nextDueAt)}`}>
                                {dueLabel(obligation.nextDueAt)}
                              </strong>
                              <span className="mt-1 block text-sm text-[#667085]">{formatDate(obligation.nextDueAt)}</span>
                            </div>
                          </div>
                        </div>
                        {selected && (
                          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-[9px] border border-[#e4e0ff] bg-white/80 px-3 py-2 text-xs font-bold text-[#475467] shadow-[0_4px_12px_rgba(91,77,245,0.06)]">
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Đã trả: {formatMoney(progress.paidAmount)}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-[#d0d5dd]" />
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-orange-600">
                              <Clock className="h-3.5 w-3.5" />
                              Còn lại: {formatMoney(progress.remainingAmount)}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-[#d0d5dd]" />
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[#475467]">
                              {progress.paidCycles}/{progress.totalCycles} kỳ đã trả
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-[14px] border border-[#e7eaf0] bg-white shadow-[0_8px_20px_rgba(16,24,40,0.04)]">
              <div className="flex items-start justify-between gap-4 border-b border-[#edf0f5] p-5 sm:p-6">
                <div className="min-w-0">
                  <h2 className="text-xl font-black leading-tight text-[#101828]">Kỳ trả</h2>
                  <p className="mt-1 truncate text-sm text-[#667085]">
                    {selectedObligation ? selectedObligation.title : 'Chọn một khoản nợ để xem lịch'}
                  </p>
                </div>
                {selectedObligation && (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(selectedObligation)}
                      className="grid h-9 w-9 place-items-center rounded-[9px] text-[#475467] transition hover:bg-[#f2f4f7] hover:text-[#5b4df5]"
                      title="Sửa lịch nhắc"
                      aria-label="Sửa lịch nhắc"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(selectedObligation)}
                      className="grid h-9 w-9 place-items-center rounded-[9px] text-rose-500 transition hover:bg-rose-50"
                      title="Xóa lịch nhắc"
                      aria-label="Xóa lịch nhắc"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              {!selectedObligation ? (
                <div className="grid min-h-[360px] place-items-center px-6 py-12 text-center">
                  <div>
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#eef4ff] text-[#2970ff]">
                      <Calendar className="h-7 w-7" />
                    </span>
                    <p className="mt-3 text-sm text-[#667085]">Chưa có kỳ trả nào để hiển thị.</p>
                  </div>
                </div>
              ) : (
                <div className="max-h-[660px] space-y-3 overflow-y-auto p-4 sm:p-5">
                  {selectedProgress && (
                    <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                      <article className="flex min-h-[76px] items-center gap-3 rounded-[10px] border border-[#e7eaf0] bg-white p-3 shadow-[0_4px_12px_rgba(16,24,40,0.03)]">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[#f4f2ff] text-[#5b4df5]">
                          <Calendar className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-[#667085]">Kỳ còn lại</p>
                          <strong className="mt-1 block text-lg font-black text-[#101828]">
                            {selectedProgress.remainingCycles}
                            <span className="ml-1 text-xs font-bold text-[#667085]">/ {selectedProgress.totalCycles} kỳ</span>
                          </strong>
                        </div>
                      </article>

                      <article className="flex min-h-[76px] items-center gap-3 rounded-[10px] border border-[#e7eaf0] bg-white p-3 shadow-[0_4px_12px_rgba(16,24,40,0.03)]">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-orange-50 text-orange-500">
                          <FileText className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-[#667085]">Còn phải trả</p>
                          <strong className="mt-1 block truncate text-sm font-black text-[#101828]">
                            {formatMoney(selectedProgress.remainingAmount)}
                          </strong>
                        </div>
                      </article>

                      <article className="flex min-h-[76px] items-center gap-3 rounded-[10px] border border-[#e7eaf0] bg-white p-3 shadow-[0_4px_12px_rgba(16,24,40,0.03)]">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-emerald-50 text-emerald-600">
                          <CheckCircle2 className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-[#667085]">Kỳ đã trả</p>
                          <strong className="mt-1 block text-lg font-black text-[#101828]">
                            {selectedProgress.paidCycles}
                            <span className="ml-1 text-xs font-bold text-[#667085]">/ {selectedProgress.totalCycles} kỳ</span>
                          </strong>
                        </div>
                      </article>

                      <article className="flex min-h-[76px] items-center gap-3 rounded-[10px] border border-[#e7eaf0] bg-white p-3 shadow-[0_4px_12px_rgba(16,24,40,0.03)]">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-emerald-50 text-emerald-600">
                          <Wallet className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-[#667085]">Đã trả</p>
                          <strong className="mt-1 block truncate text-sm font-black text-[#101828]">
                            {formatMoney(selectedProgress.paidAmount)}
                          </strong>
                        </div>
                      </article>
                    </div>
                  )}

                  {selectedPayments.length === 0 ? (
                    <div className="grid min-h-[280px] place-items-center text-center">
                      <p className="text-sm text-[#667085]">Chưa có dữ liệu kỳ trả.</p>
                    </div>
                  ) : (
                    selectedPayments.map((payment) => {
                      const open = isOpenPayment(payment.status);
                      const paid = payment.status === 'PAID';
                      const processing = processingPaymentIds.has(payment.id);
                      return (
                        <article
                          key={payment.id}
                          className="rounded-[14px] border border-[#e7eaf0] bg-white p-4 shadow-[0_5px_14px_rgba(16,24,40,0.035)]"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <strong className="block text-lg font-black text-[#101828]">
                                {formatMoney(payment.amount)}
                              </strong>
                              <p className="mt-1 text-sm text-[#475467]">Hạn trả: {formatDate(payment.dueAt)}</p>
                              {open && (
                                <p className={`mt-2 text-sm font-bold ${dueLabelClass(payment.dueAt)}`}>
                                  {paymentDueHint(payment.dueAt)}
                                </p>
                              )}
                              {payment.remindedAt && (
                                <p className="mt-2 text-xs text-[#667085]">Đã nhắc: {formatDate(payment.remindedAt)}</p>
                              )}
                              {payment.paidAt && (
                                <p className="mt-2 text-xs font-bold text-emerald-600">Đã trả: {formatDate(payment.paidAt)}</p>
                              )}
                            </div>
                            <span className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black ${statusClass(payment)}`}>
                              {paid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                              {STATUS_LABELS[payment.status]}
                            </span>
                          </div>

                          {paid ? (
                            <div className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-[9px] border border-emerald-200 bg-emerald-50 text-sm font-black text-emerald-700">
                              <CheckCircle2 className="h-5 w-5" />
                              <span>Đã đánh dấu đã trả</span>
                            </div>
                          ) : open ? (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              <button
                                type="button"
                                onClick={() => handlePay(payment)}
                                disabled={processing}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[9px] bg-[#5b4df5] px-4 text-sm font-black text-white shadow-[0_7px_16px_rgba(91,77,245,0.2)] transition hover:bg-[#4f46e5] disabled:cursor-wait disabled:opacity-60"
                              >
                                {processing ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-5 w-5" />
                                )}
                                <span>{processing ? 'Đang xử lý...' : 'Đánh dấu đã trả'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSkip(payment)}
                                disabled={processing}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[9px] border border-[#d0d5dd] bg-white px-4 text-sm font-bold text-[#475467] transition hover:bg-[#f8fafc] disabled:cursor-wait disabled:opacity-60"
                              >
                                {processing ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                  <SkipForward className="h-5 w-5" />
                                )}
                                <span>{processing ? 'Đang xử lý...' : 'Bỏ qua kỳ này'}</span>
                              </button>
                            </div>
                          ) : null}
                        </article>
                      );
                    })
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-[720px] overflow-y-auto rounded-[14px] bg-white shadow-[0_24px_80px_rgba(16,24,40,0.28)]">
            <div className="flex items-center justify-between border-b border-[#edf0f5] p-5 sm:p-6">
              <div>
                <h3 className="text-lg font-black text-[#101828]">
                  {editingObligation ? 'Sửa lịch nhắc nợ' : 'Thêm lịch nhắc nợ'}
                </h3>
                <p className="mt-1 text-sm text-[#667085]">Thiết lập số tiền, chu kỳ và thời điểm FlowFi cần nhắc bạn.</p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="grid h-9 w-9 place-items-center rounded-[9px] text-[#667085] transition hover:bg-[#f2f4f7]"
                aria-label="Đóng form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-[11px] font-black uppercase tracking-wide text-[#98a2b3]">Tên khoản nợ</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    placeholder="Ví dụ: Trả góp laptop, khoản vay gia đình..."
                    className="h-11 w-full rounded-[9px] border border-[#d0d5dd] bg-[#f8fafc] px-4 text-sm text-[#344054] outline-none transition focus:border-[#6f63ff] focus:bg-white focus:ring-3 focus:ring-[#ebe9ff]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-black uppercase tracking-wide text-[#98a2b3]">Ví thanh toán</label>
                  <select
                    value={form.walletId}
                    onChange={(event) => setForm({ ...form, walletId: event.target.value })}
                    className="h-11 w-full rounded-[9px] border border-[#d0d5dd] bg-[#f8fafc] px-4 text-sm text-[#344054] outline-none transition focus:border-[#6f63ff] focus:bg-white focus:ring-3 focus:ring-[#ebe9ff]"
                    required
                  >
                    <option value="">Chọn ví</option>
                    {wallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>{wallet.name} ({wallet.currency})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-black uppercase tracking-wide text-[#98a2b3]">Danh mục</label>
                  <select
                    value={form.tagId}
                    onChange={(event) => setForm({ ...form, tagId: event.target.value })}
                    className="h-11 w-full rounded-[9px] border border-[#d0d5dd] bg-[#f8fafc] px-4 text-sm text-[#344054] outline-none transition focus:border-[#6f63ff] focus:bg-white focus:ring-3 focus:ring-[#ebe9ff]"
                  >
                    <option value="">Không gắn tag</option>
                    {tags.map((tag) => (
                      <option key={tag.id} value={tag.id}>{tag.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-black uppercase tracking-wide text-[#98a2b3]">Số tiền mỗi kỳ</label>
                  <input
                    type="number"
                    min="1"
                    value={form.amountPerCycle}
                    onChange={(event) => setForm({ ...form, amountPerCycle: event.target.value })}
                    placeholder="5000000"
                    className="h-11 w-full rounded-[9px] border border-[#d0d5dd] bg-[#f8fafc] px-4 text-sm text-[#344054] outline-none transition focus:border-[#6f63ff] focus:bg-white focus:ring-3 focus:ring-[#ebe9ff]"
                    required
                  />
                  <p className="inline-flex rounded-full bg-[#f4f2ff] px-3 py-1 text-xs font-bold text-[#5b4df5]">
                    Tổng dự kiến: {formatMoney(estimatedTotalAmount)}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-black uppercase tracking-wide text-[#98a2b3]">Số kỳ trả</label>
                  <input
                    type="number"
                    min="1"
                    max="240"
                    value={form.cycleCount}
                    onChange={(event) => setForm({ ...form, cycleCount: event.target.value })}
                    className="h-11 w-full rounded-[9px] border border-[#d0d5dd] bg-[#f8fafc] px-4 text-sm text-[#344054] outline-none transition focus:border-[#6f63ff] focus:bg-white focus:ring-3 focus:ring-[#ebe9ff]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-black uppercase tracking-wide text-[#98a2b3]">Chu kỳ trả</label>
                  <div className="grid grid-cols-[0.95fr_1.05fr] gap-3">
                    <label className="space-y-1">
                      <span className="block text-xs font-bold text-[#667085]">Mỗi</span>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={form.intervalCount}
                        onChange={(event) => setForm({ ...form, intervalCount: event.target.value })}
                        className="h-11 w-full rounded-[9px] border border-[#d0d5dd] bg-[#f8fafc] px-4 text-sm text-[#344054] outline-none transition focus:border-[#6f63ff] focus:bg-white focus:ring-3 focus:ring-[#ebe9ff]"
                        required
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="block text-xs font-bold text-[#667085]">Đơn vị</span>
                      <select
                        value={form.frequencyUnit}
                        onChange={(event) => setForm({ ...form, frequencyUnit: event.target.value as PaymentFrequencyUnit })}
                        className="h-11 w-full rounded-[9px] border border-[#d0d5dd] bg-[#f8fafc] px-4 text-sm text-[#344054] outline-none transition focus:border-[#6f63ff] focus:bg-white focus:ring-3 focus:ring-[#ebe9ff]"
                      >
                        {Object.entries(FREQUENCY_UNIT_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="text-xs font-medium text-[#667085]">
                    Ví dụ: 10 ngày / kỳ, 2 tháng / kỳ, 1 năm / kỳ
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-black uppercase tracking-wide text-[#98a2b3]">Ngày đến hạn đầu tiên</label>
                  <input
                    type="date"
                    value={form.firstDueAt}
                    onChange={(event) => setForm({ ...form, firstDueAt: event.target.value })}
                    className="h-11 w-full rounded-[9px] border border-[#d0d5dd] bg-[#f8fafc] px-4 text-sm text-[#344054] outline-none transition focus:border-[#6f63ff] focus:bg-white focus:ring-3 focus:ring-[#ebe9ff]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-black uppercase tracking-wide text-[#98a2b3]">Nhắc trước</label>
                  <select
                    value={form.reminderDaysBefore}
                    onChange={(event) => setForm({ ...form, reminderDaysBefore: event.target.value })}
                    className="h-11 w-full rounded-[9px] border border-[#d0d5dd] bg-[#f8fafc] px-4 text-sm text-[#344054] outline-none transition focus:border-[#6f63ff] focus:bg-white focus:ring-3 focus:ring-[#ebe9ff]"
                  >
                    {[0, 1, 2, 3, 5, 7, 14, 30].map((day) => (
                      <option key={day} value={day}>{day === 0 ? 'Đúng ngày đến hạn' : `${day} ngày trước hạn`}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-[11px] font-black uppercase tracking-wide text-[#98a2b3]">Ghi chú</label>
                  <textarea
                    value={form.note}
                    onChange={(event) => setForm({ ...form, note: event.target.value })}
                    placeholder="Thêm thông tin người nhận, điều kiện trả nợ hoặc ghi chú cá nhân..."
                    rows={3}
                    className="w-full resize-none rounded-[9px] border border-[#d0d5dd] bg-[#f8fafc] px-4 py-3 text-sm text-[#344054] outline-none transition focus:border-[#6f63ff] focus:bg-white focus:ring-3 focus:ring-[#ebe9ff]"
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-[9px] border border-[#d0d5dd] bg-[#f8fafc] p-3 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                    className="h-4 w-4 accent-[#5b4df5]"
                  />
                  <span className="text-sm font-bold text-[#344054]">Bật nhắc nợ cho lịch này</span>
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  className="min-h-11 rounded-[9px] border border-[#d0d5dd] bg-white px-5 text-sm font-bold text-[#475467] transition hover:bg-[#f8fafc]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[9px] bg-[#5b4df5] px-5 text-sm font-black text-white shadow-[0_7px_16px_rgba(91,77,245,0.2)] transition hover:bg-[#4f46e5] disabled:cursor-wait disabled:opacity-60"
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
