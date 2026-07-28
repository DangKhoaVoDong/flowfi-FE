import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, Bell, Check, ChevronRight, CircleDollarSign, Edit3, Flag,
  Lightbulb, Loader2, Plus, RefreshCw, Settings, Sparkles, Target, Trash2,
  TrendingDown, TrendingUp, WalletCards, X,
} from 'lucide-react';
import { analyticsService, summaryService } from '../../services/analyticsService';
import { transactionService } from '../../services/financeService';
import { walletService } from '../../services/financeService';
import { notificationService } from '../../services/notificationService';
import { authService } from '../../services/authService';
import { goalService } from '../../services/goalService';
import { useAuth } from '../../context/AuthContext';
import type {
  FinancialGoalDto, FinancialGoalRequest, NotificationDto,
  UpdateNotificationPreferenceRequest, WalletDto,
} from '../../types/api';

const money = (value: number, currency = 'VND') =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value || 0);

const notificationContent = (item: NotificationDto) => item.content || 'Không có nội dung chi tiết.';

function StatePanel({ loading, error, empty, onRetry, children }: {
  loading: boolean; error: string; empty?: boolean; onRetry: () => void; children: React.ReactNode;
}) {
  if (loading) return <div className="product-state"><Loader2 className="animate-spin" /><strong>Đang tải dữ liệu</strong><span>FlowFi đang chuẩn bị thông tin cho bạn.</span></div>;
  if (error) return <div className="product-state error"><AlertCircle /><strong>Chưa thể tải dữ liệu</strong><span>{error}</span><button onClick={onRetry}><RefreshCw /> Thử lại</button></div>;
  if (empty) return <div className="product-state"><Sparkles /><strong>Chưa có dữ liệu</strong><span>Hãy tạo dữ liệu đầu tiên để bắt đầu theo dõi.</span></div>;
  return <>{children}</>;
}

export function WalletsScreen() {
  const [wallets, setWallets] = useState<WalletDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', walletType: 'CASH', currency: 'VND', balance: 0 });
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setWallets(await walletService.getAll()); } catch { setError('Không thể tải danh sách ví.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const byCurrency = useMemo(() => wallets.reduce<Record<string, number>>((all, item) => {
    all[item.currency] = (all[item.currency] || 0) + item.balance; return all;
  }, {}), [wallets]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try { await walletService.create(form); setShowForm(false); await load(); }
    catch { setError('Không thể tạo ví mới.'); }
  };
  const labels: Record<string,string> = { CASH: 'Tiền mặt', BANK: 'Ngân hàng', CREDIT_CARD: 'Thẻ tín dụng', E_WALLET: 'Ví điện tử' };
  return <main className="product-page">
    <div className="product-heading"><div><span className="eyebrow">Tài sản của bạn</span><h1>Ví</h1><p>Theo dõi số dư theo từng nguồn tiền và loại tiền tệ.</p></div><button className="primary-action" onClick={() => setShowForm(true)}><Plus /> Thêm ví</button></div>
    <section className="product-kpis three"><article><CircleDollarSign /><div><span>Tổng số dư</span><strong>{Object.entries(byCurrency).map(([currency,value]) => money(Number(value),currency)).join(' · ') || money(0)}</strong><small>Không cộng chéo nhiều loại tiền</small></div></article><article><WalletCards /><div><span>Số lượng ví</span><strong>{wallets.length}</strong><small>{wallets.filter(x => x.isActive).length} ví đang hoạt động</small></div></article><article><TrendingUp /><div><span>Cập nhật gần nhất</span><strong>{wallets[0] ? new Date(wallets[0].updatedAt).toLocaleDateString('vi-VN') : '—'}</strong><small>Dữ liệu đồng bộ từ backend</small></div></article></section>
    <StatePanel loading={loading} error={error} empty={!wallets.length} onRetry={load}><section className="wallet-grid">{wallets.map((wallet,index) => <article className={`wallet-card tone-${index % 3}`} key={wallet.id}><div className="wallet-card-top"><span><WalletCards />{labels[wallet.walletType] || wallet.walletType}</span><i className={wallet.isActive ? 'active' : ''}>{wallet.isActive ? 'Hoạt động' : 'Tạm dừng'}</i></div><h2>{wallet.name}</h2><small>Số dư khả dụng</small><strong>{money(wallet.balance,wallet.currency)}</strong><div><span>{wallet.currency}</span><time>Cập nhật {new Date(wallet.updatedAt).toLocaleDateString('vi-VN')}</time></div></article>)}</section></StatePanel>
    {showForm && <div className="product-modal"><button className="modal-backdrop" onClick={() => setShowForm(false)} /><form onSubmit={submit}><div className="modal-title"><div><span className="eyebrow">Nguồn tiền mới</span><h2>Thêm ví</h2></div><button type="button" onClick={() => setShowForm(false)}><X /></button></div><label>Tên ví<input required value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Ví dụ: Tiền mặt" /></label><label>Loại ví<select value={form.walletType} onChange={e => setForm({...form,walletType:e.target.value})}><option value="CASH">Tiền mặt</option><option value="BANK">Ngân hàng</option><option value="E_WALLET">Ví điện tử</option><option value="CREDIT_CARD">Thẻ tín dụng</option></select></label><div className="form-row"><label>Tiền tệ<select value={form.currency} onChange={e => setForm({...form,currency:e.target.value})}><option>VND</option><option>USD</option><option>EUR</option></select></label><label>Số dư ban đầu<input type="number" value={form.balance || ''} onChange={e => setForm({...form,balance:Number(e.target.value)})} /></label></div><div className="modal-actions"><button type="button" onClick={() => setShowForm(false)}>Hủy</button><button className="primary-action">Tạo ví</button></div></form></div>}
  </main>;
}

export function GoalsScreen() {
  const [goals, setGoals] = useState<FinancialGoalDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FinancialGoalRequest>({
    name: '', description: '', targetAmount: 0, currentAmount: 0,
    currencyCode: 'VND', status: 'Active',
  });

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setGoals(await goalService.getAll()); }
    catch { setError('Không thể kết nối dịch vụ mục tiêu tài chính.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try { await goalService.create(form); setShowForm(false); await load(); }
    catch { setError('Không thể lưu mục tiêu. Vui lòng kiểm tra dữ liệu và thử lại.'); }
    finally { setSaving(false); }
  };

  const totalTarget = goals.reduce((sum, item) => sum + item.targetAmount, 0);
  const totalCurrent = goals.reduce((sum, item) => sum + item.currentAmount, 0);

  return <main className="product-page">
    <div className="product-heading">
      <div><span className="eyebrow">Kế hoạch tương lai</span><h1>Mục tiêu tài chính</h1><p>Biến những dự định lớn thành các bước nhỏ có thể theo dõi.</p></div>
      <button className="primary-action" onClick={() => setShowForm(true)}><Plus /> Tạo mục tiêu</button>
    </div>
    <section className="product-kpis three">
      <article><Target /><div><span>Tổng mục tiêu</span><strong>{money(totalTarget)}</strong><small>{goals.length} kế hoạch</small></div></article>
      <article><WalletCards /><div><span>Đã tích lũy</span><strong>{money(totalCurrent)}</strong><small>{totalTarget ? Math.round(totalCurrent / totalTarget * 100) : 0}% tổng kế hoạch</small></div></article>
      <article><Flag /><div><span>Đã hoàn thành</span><strong>{goals.filter(x => x.status === 'Completed').length}</strong><small>Tiếp tục duy trì nhịp độ</small></div></article>
    </section>
    <StatePanel loading={loading} error={error} empty={!goals.length} onRetry={load}>
      <section className="goal-grid">
        {goals.map(goal => <article className="goal-card" key={goal.id}>
          <div className="goal-card-top"><span className={`status-pill ${goal.status.toLowerCase()}`}>{goal.status === 'Active' ? 'Đang thực hiện' : goal.status === 'Completed' ? 'Hoàn thành' : 'Đã hủy'}</span><button aria-label="Xóa" onClick={async () => { await goalService.delete(goal.id); await load(); }}><Trash2 /></button></div>
          <div className="goal-icon"><Target /></div>
          <h2>{goal.name}</h2><p>{goal.description || 'Một bước gần hơn tới mục tiêu của bạn.'}</p>
          <div className="goal-values"><strong>{money(goal.currentAmount, goal.currencyCode)}</strong><span>/ {money(goal.targetAmount, goal.currencyCode)}</span></div>
          <div className="progress-track"><i style={{ width: `${Math.min(100, goal.progressPercent)}%` }} /></div>
          <div className="goal-meta"><span>{Math.round(goal.progressPercent)}% hoàn thành</span><span>{goal.deadline ? `Hạn ${new Date(goal.deadline).toLocaleDateString('vi-VN')}` : 'Không giới hạn'}</span></div>
          {goal.status === 'Active' && <button className="soft-action" onClick={async () => { const raw = prompt('Số tiền muốn đóng góp'); const amount = Number(raw); if (amount > 0) { await goalService.contribute(goal.id, amount); await load(); } }}>+ Đóng góp</button>}
        </article>)}
      </section>
    </StatePanel>
    {showForm && <div className="product-modal"><button className="modal-backdrop" onClick={() => setShowForm(false)} /><form onSubmit={submit}>
      <div className="modal-title"><div><span className="eyebrow">Kế hoạch mới</span><h2>Tạo mục tiêu tài chính</h2></div><button type="button" onClick={() => setShowForm(false)}><X /></button></div>
      <label>Tên mục tiêu<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ví dụ: Quỹ khẩn cấp" /></label>
      <label>Mô tả<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Mục tiêu này có ý nghĩa gì với bạn?" /></label>
      <div className="form-row"><label>Số tiền mục tiêu<input required min="1" type="number" value={form.targetAmount || ''} onChange={e => setForm({ ...form, targetAmount: Number(e.target.value) })} /></label><label>Đã có<input min="0" type="number" value={form.currentAmount || ''} onChange={e => setForm({ ...form, currentAmount: Number(e.target.value) })} /></label></div>
      <label>Thời hạn<input type="date" onChange={e => setForm({ ...form, deadline: e.target.value || undefined })} /></label>
      <div className="modal-actions"><button type="button" onClick={() => setShowForm(false)}>Hủy</button><button className="primary-action" disabled={saving}>{saving && <Loader2 className="animate-spin" />} Lưu mục tiêu</button></div>
    </form></div>}
  </main>;
}

export function ReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);
  const [data, setData] = useState<{ cashflow: Awaited<ReturnType<typeof analyticsService.getDailyCashflow>>; summary: Awaited<ReturnType<typeof summaryService.getCurrentMonth>>; transactions: Awaited<ReturnType<typeof transactionService.getAll>> } | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [cashflow, summary, transactions] = await Promise.all([
        analyticsService.getDailyCashflow(days), summaryService.getCurrentMonth(), transactionService.getAll({ pageSize: 50 }),
      ]);
      setData({ cashflow, summary, transactions });
    } catch { setError('Dữ liệu phân tích đang tạm thời không khả dụng.'); }
    finally { setLoading(false); }
  }, [days]);
  useEffect(() => { void load(); }, [load]);
  const dailyData = data?.cashflow.dailyData ?? [];
  const max = Math.max(1, ...dailyData.flatMap(x => [x.income, x.expense]));
  const topExpenses = useMemo(() => (data?.transactions.items || []).filter(x => x.type === 'EXPENSE').sort((a, b) => b.amount - a.amount).slice(0, 5), [data]);
  return <main className="product-page">
    <div className="product-heading"><div><span className="eyebrow">Phân tích tài chính</span><h1>Báo cáo & Insights</h1><p>Hiểu dòng tiền để đưa ra quyết định tự tin hơn.</p></div><select value={days} onChange={e => setDays(Number(e.target.value))}><option value={7}>7 ngày</option><option value={30}>30 ngày</option><option value={90}>90 ngày</option></select></div>
    <StatePanel loading={loading} error={error} onRetry={load}>
      {data && <><section className="product-kpis three">
        <article><TrendingUp /><div><span>Thu nhập</span><strong>{money(data.cashflow.totalIncome)}</strong><small>Trong {days} ngày</small></div></article>
        <article><TrendingDown /><div><span>Chi tiêu</span><strong>{money(data.cashflow.totalExpense)}</strong><small>{data.summary.transactionCount} giao dịch trong kỳ</small></div></article>
        <article><CircleDollarSign /><div><span>Dòng tiền ròng</span><strong>{money(data.cashflow.netCashflow)}</strong><small>{data.cashflow.netCashflow >= 0 ? 'Dòng tiền đang tích cực' : 'Cần cân đối chi tiêu'}</small></div></article>
      </section>
      <section className="report-grid"><article className="product-card chart-card"><div className="card-title"><div><h2>Xu hướng thu & chi</h2><p>So sánh dòng tiền theo ngày</p></div><span className="legend"><i /> Thu <i /> Chi</span></div><div className="bar-chart">{dailyData.map(point => <div className="bar-group" key={point.date} title={`${point.date}: Thu ${money(point.income)}, chi ${money(point.expense)}`}><div><i className="income" style={{ height: `${point.income / max * 100}%` }} /><i className="expense" style={{ height: `${point.expense / max * 100}%` }} /></div><small>{new Date(point.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</small></div>)}</div></article>
      <article className="product-card insight-card"><div className="card-title"><div><span className="ai-label"><Sparkles /> Gợi ý AI</span><h2>Điểm đáng chú ý</h2></div></div><Lightbulb /><p>{data.cashflow.totalExpense > data.cashflow.totalIncome ? 'Chi tiêu đang cao hơn thu nhập trong kỳ. Bạn có thể xem lại các giao dịch lớn bên dưới.' : `Bạn đang giữ lại ${money(data.cashflow.netCashflow)} trong kỳ. Hãy cân nhắc chuyển một phần sang mục tiêu tài chính.`}</p><button className="soft-action">Xem chi tiết <ChevronRight /></button></article></section>
      <section className="product-card"><div className="card-title"><div><h2>Top giao dịch chi tiêu</h2><p>Các khoản tác động nhiều nhất tới báo cáo</p></div></div><div className="simple-list">{topExpenses.map(item => <div key={item.id}><span><strong>{item.title}</strong><small>{item.tagName || 'Chưa phân loại'} · {new Date(item.transactionDate).toLocaleDateString('vi-VN')}</small></span><b>-{money(item.amount, item.currencyCode)}</b></div>)}</div></section></>}
    </StatePanel>
  </main>;
}

export function NotificationsScreen() {
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [selected, setSelected] = useState<NotificationDto | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const response = await notificationService.getAll({ pageSize: 50, isRead: filter === 'unread' ? false : undefined }); setItems(response.items || []); }
    catch { setError('Không thể tải thông báo.'); } finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { void load(); }, [load]);
  const open = async (item: NotificationDto) => { setSelected(item); if (!item.isRead) { await notificationService.markAsRead(item.id); setItems(value => value.map(x => x.id === item.id ? { ...x, isRead: true } : x)); } };
  return <main className="product-page"><div className="product-heading"><div><span className="eyebrow">Trung tâm cập nhật</span><h1>Thông báo</h1><p>Theo dõi cảnh báo ngân sách, giao dịch và nhắc nhở.</p></div><button className="soft-action" onClick={async () => { await notificationService.markAllAsRead(); await load(); }}><Check /> Đánh dấu tất cả đã đọc</button></div>
    <div className="filter-tabs"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Tất cả</button><button className={filter === 'unread' ? 'active' : ''} onClick={() => setFilter('unread')}>Chưa đọc</button></div>
    <StatePanel loading={loading} error={error} empty={!items.length} onRetry={load}><section className="notification-layout"><div className="notification-list">{items.map(item => <button key={item.id} className={`${!item.isRead ? 'unread' : ''} ${selected?.id === item.id ? 'selected' : ''}`} onClick={() => void open(item)}><span className="notification-icon"><Bell /></span><span><strong>{item.title}</strong><small>{notificationContent(item)}</small><time>{new Date(item.createdAt).toLocaleString('vi-VN')}</time></span>{!item.isRead && <i />}</button>)}</div><article className="product-card notification-detail">{selected ? <><span className="notification-icon"><Bell /></span><h2>{selected.title}</h2><time>{new Date(selected.createdAt).toLocaleString('vi-VN')}</time><p>{notificationContent(selected)}</p><button className="danger-link" onClick={async () => { await notificationService.delete(selected.id); setSelected(null); await load(); }}><Trash2 /> Xóa thông báo</button></> : <div className="product-state"><Bell /><strong>Chọn một thông báo</strong><span>Nội dung chi tiết sẽ xuất hiện tại đây.</span></div>}</article></section></StatePanel>
  </main>;
}

export function SettingsScreen() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState<'profile' | 'appearance' | 'notifications'>('profile');
  const [name, setName] = useState(user?.fullName || '');
  const [currency, setCurrency] = useState(user?.currencyCode || 'VND');
  const [preferences, setPreferences] = useState<UpdateNotificationPreferenceRequest>({ budgetWarning: true, transactionNotifications: true, weeklySummary: true, timezone: 'Asia/Ho_Chi_Minh' });
  const [saved, setSaved] = useState(false);
  useEffect(() => { notificationService.getPreferences().then(setPreferences).catch(() => undefined); }, []);
  const save = async () => {
    if (tab === 'profile') { await authService.updateProfile({ fullName: name }); await authService.updatePreferences({ currencyCode: currency }); await refreshUser(); }
    if (tab === 'notifications') await notificationService.updatePreferences(preferences);
    setSaved(true); window.setTimeout(() => setSaved(false), 2200);
  };
  return <main className="product-page"><div className="product-heading"><div><span className="eyebrow">Cá nhân hóa</span><h1>Cài đặt</h1><p>Quản lý hồ sơ, giao diện và cách FlowFi liên hệ với bạn.</p></div>{saved && <span className="saved-pill"><Check /> Đã lưu</span>}</div>
    <section className="settings-layout"><nav><button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}><Edit3 /> Hồ sơ</button><button className={tab === 'appearance' ? 'active' : ''} onClick={() => setTab('appearance')}><Sparkles /> Giao diện</button><button className={tab === 'notifications' ? 'active' : ''} onClick={() => setTab('notifications')}><Bell /> Thông báo</button></nav><div className="product-card settings-panel">
      {tab === 'profile' && <><div className="card-title"><div><h2>Thông tin cá nhân</h2><p>Thông tin dùng để cá nhân hóa trải nghiệm.</p></div></div><label>Họ và tên<input value={name} onChange={e => setName(e.target.value)} /></label><label>Email<input value={user?.email || ''} disabled /></label><label>Tiền tệ mặc định<select value={currency} onChange={e => setCurrency(e.target.value)}><option>VND</option><option>USD</option><option>EUR</option></select></label></>}
      {tab === 'appearance' && <><div className="card-title"><div><h2>Giao diện</h2><p>Chọn cách FlowFi hiển thị trên thiết bị.</p></div></div><div className="theme-options"><button className="active"><span className="theme-preview light" />Sáng <Check /></button><button><span className="theme-preview dark" />Tối</button><button><span className="theme-preview system" />Theo hệ thống</button></div></>}
      {tab === 'notifications' && <><div className="card-title"><div><h2>Tùy chọn thông báo</h2><p>Chỉ nhận những cập nhật thực sự hữu ích.</p></div></div>{([['transactionNotifications','Thông báo giao dịch'],['budgetWarning','Cảnh báo ngân sách'],['dailyReminder','Nhắc nhập chi tiêu mỗi ngày'],['weeklySummary','Tổng kết tuần'],['monthlySummary','Tổng kết tháng'],['savingsTip','Mẹo tiết kiệm']] as const).map(([key,label]) => <label className="switch-row" key={key}><span><strong>{label}</strong><small>Bật hoặc tắt loại thông báo này.</small></span><input type="checkbox" checked={!!preferences[key]} onChange={e => setPreferences({ ...preferences, [key]: e.target.checked })} /></label>)}</>}
      <div className="settings-actions"><button className="primary-action" onClick={() => void save()}><Settings /> Lưu thay đổi</button></div>
    </div></section>
  </main>;
}
