import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, CalendarDays, ChevronDown, CircleDollarSign,
  CreditCard, MoreVertical, Plus, Search, SlidersHorizontal, WalletCards,
} from 'lucide-react';
import { ScreenId } from '../../types';
import { transactionService, walletService } from '../../services';
import type { TransactionDto, WalletDto } from '../../types/api';

interface Props { onNavigate: (screen: ScreenId) => void }
type FilterType = 'ALL' | 'INCOME' | 'EXPENSE';

const money = (value: number) =>
  `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Math.abs(value || 0))} ₫`;

const localCategory = (name?: string) => {
  const map: Record<string, string> = {
    food: 'Ăn uống', dining: 'Ăn uống', transport: 'Di chuyển', shopping: 'Mua sắm',
    health: 'Sức khỏe', gift: 'Quà tặng', salary: 'Lương', bonus: 'Thưởng',
    entertainment: 'Giải trí', utilities: 'Hóa đơn', refund: 'Hoàn tiền',
  };
  return name ? map[name.trim().toLowerCase()] || name : 'Chưa phân loại';
};

export const TransactionsWalletsScreen: React.FC<Props> = ({ onNavigate }) => {
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [sortNewest, setSortNewest] = useState(true);
  const [amountDescending, setAmountDescending] = useState(true);
  const [search, setSearch] = useState('');
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [wallets, setWallets] = useState<WalletDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllIncome, setShowAllIncome] = useState(false);
  const [showAllExpense, setShowAllExpense] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const [year, selectedMonth] = month.split('-').map(Number);
    const from = new Date(Date.UTC(year, selectedMonth - 1, 1)).toISOString();
    const to = new Date(Date.UTC(year, selectedMonth, 0, 23, 59, 59, 999)).toISOString();
    try {
      const [transactionResult, walletResult] = await Promise.all([
        transactionService.getAll({ page: 1, pageSize: 100, from, to }),
        walletService.getAll(),
      ]);
      setTransactions(Array.isArray(transactionResult?.items) ? transactionResult.items : []);
      setWallets(Array.isArray(walletResult) ? walletResult : []);
    } catch {
      setError('Không thể tải danh sách giao dịch. Vui lòng thử lại.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { void load(); }, [load]);

  const visibleTransactions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return transactions
      .filter(item => filter === 'ALL' || item.type === filter)
      .filter(item => !term || `${item.title} ${item.note || ''} ${item.tagName || ''}`.toLowerCase().includes(term))
      .sort((a, b) => {
        const dateOrder = new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();
        if (dateOrder !== 0) return sortNewest ? dateOrder : -dateOrder;
        const amountOrder = Number(b.amount) - Number(a.amount);
        return amountDescending ? amountOrder : -amountOrder;
      });
  }, [amountDescending, filter, search, sortNewest, transactions]);

  const income = visibleTransactions.filter(item => item.type === 'INCOME');
  const expenses = visibleTransactions.filter(item => item.type === 'EXPENSE');
  const totalIncome = transactions.filter(item => item.type === 'INCOME').reduce((sum, item) => sum + Number(item.amount), 0);
  const totalExpense = transactions.filter(item => item.type === 'EXPENSE').reduce((sum, item) => sum + Number(item.amount), 0);
  const net = totalIncome - totalExpense;
  const walletName = (walletId: string) => wallets.find(item => item.id === walletId)?.name || 'Ví chính';

  return <main className="transactions-page">
    <div className="transactions-breadcrumb"><button onClick={() => onNavigate('dashboard')}>Trang chủ</button><span>/</span><b>Giao dịch</b></div>
    <header className="transactions-heading">
      <div><h1>Giao dịch</h1><p>Quản lý các khoản thu và chi của bạn</p></div>
    </header>

    <section className="transaction-toolbar">
      <div className="transaction-tabs" role="tablist">
        <button className={filter === 'ALL' ? 'active' : ''} onClick={() => setFilter('ALL')}>Tất cả</button>
        <button className={`income ${filter === 'INCOME' ? 'active' : ''}`} onClick={() => setFilter('INCOME')}><ArrowUp/> Thu</button>
        <button className={`expense ${filter === 'EXPENSE' ? 'active' : ''}`} onClick={() => setFilter('EXPENSE')}><ArrowDown/> Chi</button>
      </div>
      <div className="transaction-filters">
        <label className="month-filter"><CalendarDays/><input type="month" value={month} onChange={event => setMonth(event.target.value)}/><ChevronDown/></label>
        <button onClick={() => setSortNewest(value => !value)}><CalendarDays/> Sắp xếp ngày: {sortNewest ? 'Mới nhất' : 'Cũ nhất'} <ChevronDown/></button>
        <button onClick={() => setAmountDescending(value => !value)}><ArrowUpDown/> Số tiền: {amountDescending ? 'Giảm dần' : 'Tăng dần'} <ChevronDown/></button>
        <label className="transaction-search"><Search/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm giao dịch..."/></label>
        <button className="add-transaction" onClick={() => onNavigate('ai-input')}><Plus/> Thêm giao dịch</button>
      </div>
    </section>

    <section className="transaction-kpis">
      <TransactionKpi tone="income" icon={<ArrowUp/>} label="Tổng thu" value={`+${money(totalIncome)}`} detail={`${income.length} khoản thu`} />
      <TransactionKpi tone="expense" icon={<ArrowDown/>} label="Tổng chi" value={`-${money(totalExpense)}`} detail={`${expenses.length} khoản chi`} />
      <TransactionKpi tone="count" icon={<CreditCard/>} label="Số giao dịch" value={String(transactions.length)} detail={`${transactions.filter(x => x.type === 'INCOME').length} thu · ${transactions.filter(x => x.type === 'EXPENSE').length} chi`} />
      <TransactionKpi tone={net >= 0 ? 'net' : 'expense'} icon={<CircleDollarSign/>} label="Dòng tiền ròng" value={`${net >= 0 ? '+' : '-'}${money(net)}`} detail={net >= 0 ? 'Dòng tiền đang dương' : 'Chi đang lớn hơn thu'} />
    </section>

    {error && <div className="transaction-error"><span><AlertTriangle/>{error}</span><button onClick={() => void load()}>Thử lại</button></div>}
    {!error && <section className="transaction-columns">
      <TransactionColumn title="Thu nhập" tone="income" total={totalIncome} items={showAllIncome ? income : income.slice(0, 8)} wallets={walletName} loading={loading} onMore={() => setShowAllIncome(true)} canMore={!showAllIncome && income.length > 8} onAdd={() => onNavigate('ai-input')}/>
      <TransactionColumn title="Chi tiêu" tone="expense" total={totalExpense} items={showAllExpense ? expenses : expenses.slice(0, 8)} wallets={walletName} loading={loading} onMore={() => setShowAllExpense(true)} canMore={!showAllExpense && expenses.length > 8} onAdd={() => onNavigate('ai-input')}/>
    </section>}
  </main>;
};

function TransactionKpi({tone, icon, label, value, detail}:{tone:string;icon:React.ReactNode;label:string;value:string;detail:string}) {
  return <article className={`transaction-kpi ${tone}`}><i>{icon}</i><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>;
}

function TransactionColumn({title,tone,total,items,wallets,loading,onMore,canMore,onAdd}:{title:string;tone:'income'|'expense';total:number;items:TransactionDto[];wallets:(id:string)=>string;loading:boolean;onMore:()=>void;canMore:boolean;onAdd:()=>void}) {
  return <article className={`transaction-list-card ${tone}`}>
    <header><h2><i>{tone === 'income' ? <ArrowUp/> : <ArrowDown/>}</i>{title}</h2><span>Tổng: <strong>{tone === 'income' ? '+' : '-'}{money(total)}</strong></span></header>
    <div className="transaction-table-head"><span>Ngày</span><span>Danh mục</span><span>Mô tả</span><span>Tài khoản</span><span>Số tiền</span><span/></div>
    {loading ? <div className="transaction-list-loading">{Array.from({length:6},(_,index)=><i key={index}/>)}</div>
      : !items.length ? <div className="transaction-list-empty"><SlidersHorizontal/><strong>Chưa có giao dịch {tone === 'income' ? 'thu' : 'chi'}</strong><p>Giao dịch trong tháng sẽ hiển thị tại đây.</p><button onClick={onAdd}><Plus/> Thêm khoản {tone === 'income' ? 'thu' : 'chi'}</button></div>
      : <div className="transaction-list">{items.map((item,index) => {
        const date = new Date(item.transactionDate);
        const previous = index ? new Date(items[index - 1].transactionDate) : null;
        const showDate = !previous || previous.toDateString() !== date.toDateString();
        return <React.Fragment key={item.id}>
          {showDate && <div className="transaction-date-row">{date.toLocaleDateString('vi-VN')}</div>}
          <div className="transaction-row">
            <time>{date.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'})}</time>
            <span className="transaction-category"><i>{tone === 'income' ? <ArrowUp/> : <WalletCards/>}</i><b>{localCategory(item.tagName)}</b></span>
            <span className="transaction-description"><b>{item.title || localCategory(item.tagName)}</b><small>{item.note || 'Không có ghi chú'}</small></span>
            <span className="transaction-wallet"><CreditCard/>{wallets(item.walletId)}</span>
            <strong className="transaction-amount">{tone === 'income' ? '+' : '-'}{money(item.amount)}</strong>
            <button aria-label="Tùy chọn giao dịch"><MoreVertical/></button>
          </div>
        </React.Fragment>;
      })}</div>}
    {canMore && <button className="transaction-view-more" onClick={onMore}>Xem tất cả {title.toLowerCase()}</button>}
  </article>;
}
