import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign,
  CreditCard, Edit3, FileClock, MoreVertical, Plus, Search, SlidersHorizontal, Trash2, WalletCards, X,
} from 'lucide-react';
import { ScreenId } from '../../types';
import { tagService, transactionService, walletService } from '../../services';
import type { TagDto, TransactionDto, WalletDto } from '../../types/api';

interface Props { onNavigate: (screen: ScreenId) => void }
type FilterType = 'ALL' | 'INCOME' | 'EXPENSE' | 'DRAFT';
type SortBy = 'DATE' | 'AMOUNT';

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
  const [monthMenuOpen, setMonthMenuOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(now.getFullYear());
  const monthPickerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [sortBy, setSortBy] = useState<SortBy>('DATE');
  const [sortNewest, setSortNewest] = useState(true);
  const [amountDescending, setAmountDescending] = useState(true);
  const [search, setSearch] = useState('');
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [wallets, setWallets] = useState<WalletDto[]>([]);
  const [tags, setTags] = useState<TagDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllIncome, setShowAllIncome] = useState(false);
  const [showAllExpense, setShowAllExpense] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState('');
  const [editing, setEditing] = useState<TransactionDto | null>(null);
  const [deleting, setDeleting] = useState<TransactionDto | null>(null);
  const [savingAction, setSavingAction] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const [year, selectedMonth] = month.split('-').map(Number);
    const from = new Date(Date.UTC(year, selectedMonth - 1, 1)).toISOString();
    const to = new Date(Date.UTC(year, selectedMonth, 0, 23, 59, 59, 999)).toISOString();
    try {
      const [transactionResult, draftResult, walletResult, tagResult] = await Promise.all([
        transactionService.getAll({ page: 1, pageSize: 100, from, to }),
        transactionService.getAll({ page: 1, pageSize: 100, status: 'DRAFT' }),
        walletService.getAll(),
        tagService.getAll(),
      ]);
      const monthlyItems = Array.isArray(transactionResult?.items) ? transactionResult.items : [];
      const draftItems = (Array.isArray(draftResult?.items) ? draftResult.items : [])
        .filter(item => item.status === 'DRAFT');
      setTransactions(Array.from(
        new Map([...monthlyItems, ...draftItems].map(item => [item.id, item])).values(),
      ));
      setWallets(Array.isArray(walletResult) ? walletResult : []);
      setTags(Array.isArray(tagResult) ? tagResult : []);
    } catch {
      setError('Không thể tải danh sách giao dịch. Vui lòng thử lại.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const closeRowMenu = (event: MouseEvent) => {
      if (!(event.target as Element).closest?.('.transaction-row-actions')) setActiveMenuId('');
    };
    document.addEventListener('mousedown', closeRowMenu);
    return () => document.removeEventListener('mousedown', closeRowMenu);
  }, []);
  useEffect(() => {
    const closeMonthMenu = (event: MouseEvent) => {
      if (!monthPickerRef.current?.contains(event.target as Node)) setMonthMenuOpen(false);
    };
    document.addEventListener('mousedown', closeMonthMenu);
    return () => document.removeEventListener('mousedown', closeMonthMenu);
  }, []);

  const visibleTransactions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return transactions
      .filter(item => filter === 'DRAFT'
        ? item.status === 'DRAFT'
        : item.status === 'CONFIRMED' && (filter === 'ALL' || item.type === filter))
      .filter(item => !term || `${item.title} ${item.note || ''} ${item.tagName || ''}`.toLowerCase().includes(term))
      .sort((a, b) => {
        const dateOrder = new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();
        const amountOrder = Number(b.amount) - Number(a.amount);
        if (sortBy === 'AMOUNT') {
          if (amountOrder !== 0) return amountDescending ? amountOrder : -amountOrder;
          return sortNewest ? dateOrder : -dateOrder;
        }
        if (dateOrder !== 0) return sortNewest ? dateOrder : -dateOrder;
        return amountDescending ? amountOrder : -amountOrder;
      });
  }, [amountDescending, filter, search, sortBy, sortNewest, transactions]);

  const income = visibleTransactions.filter(item => item.type === 'INCOME');
  const expenses = visibleTransactions.filter(item => item.type === 'EXPENSE');
  const drafts = transactions.filter(item => item.status === 'DRAFT');
  const confirmed = transactions.filter(item => item.status === 'CONFIRMED');
  const totalIncome = confirmed.filter(item => item.type === 'INCOME').reduce((sum, item) => sum + Number(item.amount), 0);
  const totalExpense = confirmed.filter(item => item.type === 'EXPENSE').reduce((sum, item) => sum + Number(item.amount), 0);
  const net = totalIncome - totalExpense;
  const walletName = (walletId: string) => wallets.find(item => item.id === walletId)?.name || 'Ví chính';

  const [selectedYear, selectedMonth] = month.split('-').map(Number);
  const monthLabel = `Tháng ${String(selectedMonth).padStart(2, '0')}/${selectedYear}`;

  const saveTransaction = async (data: TransactionDto) => {
    setSavingAction(true); setActionError('');
    try {
      const updated = await transactionService.update(data.id, {
        walletId: data.walletId,
        tagId: data.tagId,
        amount: Number(data.amount),
        type: data.type,
        status: data.status,
        title: data.title.trim(),
        note: data.note,
        source: data.source,
        transactionDate: data.transactionDate,
      });
      setTransactions(items => items.map(item => item.id === updated.id ? updated : item));
      setEditing(null);
    } catch (error) {
      const response = (error as { response?: { status?: number; data?: { message?: string } } }).response;
      const message = response?.data?.message;
      setActionError(
        message === 'Tag type must match transaction type.'
          ? 'Danh mục không hợp lệ hoặc không khớp với loại giao dịch.'
          : message === 'Wallet balance is insufficient.' || response?.status === 409
            ? 'Số dư ví không đủ để thực hiện thay đổi này.'
            : message === 'Transaction status must be DRAFT or CONFIRMED.'
              ? 'Trạng thái giao dịch không hợp lệ.'
              : 'Không thể cập nhật giao dịch. Vui lòng kiểm tra thông tin và thử lại.',
      );
    } finally {
      setSavingAction(false);
    }
  };

  const confirmTransaction = async (data: TransactionDto, requireConfirmation = false) => {
    if (data.status !== 'DRAFT') return;
    if (requireConfirmation && !window.confirm(`Xác nhận giao dịch "${data.title}"? Số dư ví và ngân sách sẽ được cập nhật.`)) {
      return;
    }
    setSavingAction(true); setActionError('');
    try {
      const updated = await transactionService.update(data.id, {
        walletId: data.walletId,
        tagId: data.tagId,
        amount: Number(data.amount),
        type: data.type,
        status: 'CONFIRMED',
        title: data.title.trim(),
        note: data.note,
        source: data.source,
        transactionDate: data.transactionDate,
      });
      setTransactions(items => items.map(item => item.id === updated.id ? updated : item));
      setEditing(null);
      setActiveMenuId('');
      await load();
    } catch (error) {
      const response = (error as { response?: { status?: number; data?: { message?: string } } }).response;
      const message = response?.data?.message;
      setActionError(
        message === 'Tag type must match transaction type.'
          ? 'Danh mục không hợp lệ hoặc không khớp với loại giao dịch.'
          : message === 'Wallet balance is insufficient.' || response?.status === 409
            ? 'Số dư ví không đủ để xác nhận giao dịch này.'
            : 'Không thể xác nhận giao dịch. Vui lòng kiểm tra thông tin và thử lại.',
      );
    } finally {
      setSavingAction(false);
    }
  };

  const deleteTransaction = async () => {
    if (!deleting) return;
    setSavingAction(true); setActionError('');
    try {
      await transactionService.delete(deleting.id);
      setTransactions(items => items.filter(item => item.id !== deleting.id));
      setDeleting(null);
    } catch {
      setActionError('Không thể xóa giao dịch này. Vui lòng thử lại.');
    } finally {
      setSavingAction(false);
    }
  };

  const columnActions = {
    activeMenuId,
    onToggleMenu: (id: string) => setActiveMenuId(current => current === id ? '' : id),
    onEdit: (item: TransactionDto) => { setEditing({ ...item }); setActiveMenuId(''); setActionError(''); },
    onConfirm: (item: TransactionDto) => { void confirmTransaction(item, true); },
    onDelete: (item: TransactionDto) => { setDeleting(item); setActiveMenuId(''); setActionError(''); },
  };

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
        <button className={`draft ${filter === 'DRAFT' ? 'active' : ''}`} onClick={() => setFilter('DRAFT')}><FileClock/> Bản nháp {drafts.length > 0 && <b>{drafts.length}</b>}</button>
      </div>
      <div className="transaction-filters">
        <div className={`transaction-month-picker ${monthMenuOpen ? 'open' : ''}`} ref={monthPickerRef}>
          <button type="button" onClick={() => { setPickerYear(selectedYear); setMonthMenuOpen(value => !value); }}>
            <CalendarDays/><span>{monthLabel}</span><ChevronDown/>
          </button>
          {monthMenuOpen && <div className="transaction-month-menu">
            <header><button onClick={() => setPickerYear(year => year - 1)} aria-label="Năm trước"><ChevronLeft/></button><strong>{pickerYear}</strong><button onClick={() => setPickerYear(year => year + 1)} aria-label="Năm sau"><ChevronRight/></button></header>
            <div>{Array.from({length:12},(_,index)=>{
              const value = `${pickerYear}-${String(index+1).padStart(2,'0')}`;
              return <button key={value} className={month===value?'selected':''} onClick={()=>{setMonth(value);setMonthMenuOpen(false);setShowAllIncome(false);setShowAllExpense(false);}}><span>Tháng</span><b>{String(index+1).padStart(2,'0')}</b>{month===value&&<Check/>}</button>;
            })}</div>
            <footer><button onClick={()=>{const value=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;setMonth(value);setPickerYear(now.getFullYear());setMonthMenuOpen(false);}}>Tháng hiện tại</button></footer>
          </div>}
        </div>
        <button className={sortBy === 'DATE' ? 'active-sort' : ''} onClick={() => { setSortBy('DATE'); setSortNewest(value => sortBy === 'DATE' ? !value : true); }}><CalendarDays/> Sắp xếp ngày: {sortNewest ? 'Mới nhất' : 'Cũ nhất'} <ChevronDown/></button>
        <button className={sortBy === 'AMOUNT' ? 'active-sort' : ''} onClick={() => { setSortBy('AMOUNT'); setAmountDescending(value => sortBy === 'AMOUNT' ? !value : true); }}><ArrowUpDown/> Số tiền: {amountDescending ? 'Giảm dần' : 'Tăng dần'} <ChevronDown/></button>
        <label className="transaction-search"><Search/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm giao dịch..."/></label>
        <button className="add-transaction" onClick={() => onNavigate('ai-input')}><Plus/> Thêm giao dịch</button>
      </div>
    </section>

    <section className="transaction-kpis">
      <TransactionKpi tone="income" icon={<ArrowUp/>} label="Tổng thu" value={`+${money(totalIncome)}`} detail={`${confirmed.filter(item=>item.type==='INCOME').length} khoản thu`} />
      <TransactionKpi tone="expense" icon={<ArrowDown/>} label="Tổng chi" value={`-${money(totalExpense)}`} detail={`${confirmed.filter(item=>item.type==='EXPENSE').length} khoản chi`} />
      <TransactionKpi tone="count" icon={<CreditCard/>} label="Số giao dịch" value={String(confirmed.length)} detail={`${confirmed.filter(x => x.type === 'INCOME').length} thu · ${confirmed.filter(x => x.type === 'EXPENSE').length} chi · ${drafts.length} nháp`} />
      <TransactionKpi tone={net >= 0 ? 'net' : 'expense'} icon={<CircleDollarSign/>} label="Dòng tiền ròng" value={`${net >= 0 ? '+' : '-'}${money(net)}`} detail={net >= 0 ? 'Dòng tiền đang dương' : 'Chi đang lớn hơn thu'} />
    </section>

    {error && <div className="transaction-error"><span><AlertTriangle/>{error}</span><button onClick={() => void load()}>Thử lại</button></div>}
    {actionError && <div className="transaction-error"><span><AlertTriangle/>{actionError}</span><button onClick={() => setActionError('')}>Đóng</button></div>}
    {!error && (filter === 'DRAFT' ? (
      <section className="transaction-columns draft-view">
        <TransactionColumn title="Giao dịch bản nháp" tone="draft" total={drafts.reduce((sum,item)=>sum+Number(item.amount),0)} items={visibleTransactions} wallets={walletName} loading={loading} onMore={() => undefined} canMore={false} onAdd={() => onNavigate('ai-image')} {...columnActions}/>
      </section>
    ) : (
      <section className="transaction-columns">
        <TransactionColumn title="Thu nhập" tone="income" total={totalIncome} items={showAllIncome ? income : income.slice(0, 8)} wallets={walletName} loading={loading} onMore={() => setShowAllIncome(true)} canMore={!showAllIncome && income.length > 8} onAdd={() => onNavigate('ai-input')} {...columnActions}/>
        <TransactionColumn title="Chi tiêu" tone="expense" total={totalExpense} items={showAllExpense ? expenses : expenses.slice(0, 8)} wallets={walletName} loading={loading} onMore={() => setShowAllExpense(true)} canMore={!showAllExpense && expenses.length > 8} onAdd={() => onNavigate('ai-input')} {...columnActions}/>
      </section>
    ))}
    {editing && <TransactionEditModal transaction={editing} wallets={wallets} tags={tags} saving={savingAction} error={actionError} onChange={setEditing} onClose={() => { setEditing(null); setActionError(''); }} onSave={() => void saveTransaction(editing)} onConfirm={() => void confirmTransaction(editing)} />}
    {deleting && <TransactionDeleteModal transaction={deleting} saving={savingAction} error={actionError} onClose={() => { setDeleting(null); setActionError(''); }} onConfirm={() => void deleteTransaction()} />}
  </main>;
};

function TransactionKpi({tone, icon, label, value, detail}:{tone:string;icon:React.ReactNode;label:string;value:string;detail:string}) {
  return <article className={`transaction-kpi ${tone}`}><i>{icon}</i><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>;
}

function TransactionColumn({title,tone,total,items,wallets,loading,onMore,canMore,onAdd,activeMenuId,onToggleMenu,onEdit,onConfirm,onDelete}:{title:string;tone:'income'|'expense'|'draft';total:number;items:TransactionDto[];wallets:(id:string)=>string;loading:boolean;onMore:()=>void;canMore:boolean;onAdd:()=>void;activeMenuId:string;onToggleMenu:(id:string)=>void;onEdit:(item:TransactionDto)=>void;onConfirm:(item:TransactionDto)=>void;onDelete:(item:TransactionDto)=>void}) {
  return <article className={`transaction-list-card ${tone}`}>
    <header><h2><i>{tone === 'income' ? <ArrowUp/> : tone === 'expense' ? <ArrowDown/> : <FileClock/>}</i>{title}</h2><span>{tone === 'draft' ? <><strong>{items.length}</strong> giao dịch chờ xác nhận</> : <>Tổng: <strong>{tone === 'income' ? '+' : '-'}{money(total)}</strong></>}</span></header>
    <div className="transaction-table-head"><span>Ngày</span><span>Danh mục</span><span>Mô tả</span><span>Tài khoản</span><span>Số tiền</span><span/></div>
    {loading ? <div className="transaction-list-loading">{Array.from({length:6},(_,index)=><i key={index}/>)}</div>
      : !items.length ? <div className="transaction-list-empty"><SlidersHorizontal/><strong>{tone === 'draft' ? 'Chưa có giao dịch bản nháp' : `Chưa có giao dịch ${tone === 'income' ? 'thu' : 'chi'}`}</strong><p>Giao dịch trong tháng sẽ hiển thị tại đây.</p><button onClick={onAdd}><Plus/> {tone === 'draft' ? 'Nhập ảnh bằng AI' : `Thêm khoản ${tone === 'income' ? 'thu' : 'chi'}`}</button></div>
      : <div className="transaction-list">{items.map((item,index) => {
        const date = new Date(item.transactionDate);
        const previous = index ? new Date(items[index - 1].transactionDate) : null;
        const showDate = !previous || previous.toDateString() !== date.toDateString();
        return <React.Fragment key={item.id}>
          {showDate && <div className="transaction-date-row">{date.toLocaleDateString('vi-VN')}</div>}
          <div className="transaction-row">
            <time>{date.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'})}</time>
            <span className="transaction-category"><i>{item.type === 'INCOME' ? <ArrowUp/> : <WalletCards/>}</i><b>{localCategory(item.tagName)}</b></span>
            <span className="transaction-description"><b>{item.title || localCategory(item.tagName)}</b><small>{item.note || 'Không có ghi chú'}</small></span>
            <span className="transaction-wallet"><CreditCard/>{wallets(item.walletId)}</span>
            <strong className="transaction-amount">{item.type === 'INCOME' ? '+' : '-'}{money(item.amount)}</strong>
            <div className="transaction-row-actions">
              <button aria-label="Tùy chọn giao dịch" aria-expanded={activeMenuId === item.id} onClick={() => onToggleMenu(item.id)}><MoreVertical/></button>
              {activeMenuId === item.id && <div className="transaction-action-menu">
                {item.status === 'DRAFT' && <button className="confirm" onClick={() => onConfirm(item)}><Check/> Xác nhận giao dịch</button>}
                <button onClick={() => onEdit(item)}><Edit3/> Sửa giao dịch</button>
                <button className="delete" onClick={() => onDelete(item)}><Trash2/> Xóa giao dịch</button>
              </div>}
            </div>
          </div>
        </React.Fragment>;
      })}</div>}
    {canMore && <button className="transaction-view-more" onClick={onMore}>Xem tất cả {title.toLowerCase()}</button>}
  </article>;
}

function TransactionEditModal({transaction,wallets,tags,saving,error,onChange,onClose,onSave,onConfirm}:{transaction:TransactionDto;wallets:WalletDto[];tags:TagDto[];saving:boolean;error:string;onChange:(item:TransactionDto)=>void;onClose:()=>void;onSave:()=>void;onConfirm:()=>void}) {
  const compatibleTags = tags.filter(tag => tag.type === transaction.type);
  const valid = Boolean(transaction.title.trim() && Number(transaction.amount) > 0 && transaction.walletId && transaction.tagId);
  return <div className="transaction-modal-layer" role="dialog" aria-modal="true" aria-label="Sửa giao dịch">
    <button className="transaction-modal-backdrop" onClick={onClose} aria-label="Đóng"/>
    <section className="transaction-edit-modal">
      <header><div><i><Edit3/></i><span><h2>Sửa giao dịch</h2><p>Cập nhật thông tin và lưu thay đổi.</p></span></div><button onClick={onClose} aria-label="Đóng"><X/></button></header>
      <div className="transaction-edit-fields">
        <label className="wide"><span>Nội dung</span><input value={transaction.title} onChange={event=>onChange({...transaction,title:event.target.value})}/></label>
        <label><span>Số tiền</span><input type="number" min="1" value={transaction.amount} onChange={event=>onChange({...transaction,amount:Number(event.target.value)})}/></label>
        <label><span>Loại giao dịch</span><select value={transaction.type} onChange={event=>onChange({...transaction,type:event.target.value,tagId:undefined})}><option value="INCOME">Thu nhập</option><option value="EXPENSE">Chi tiêu</option></select></label>
        <label><span>Danh mục</span><select value={transaction.tagId || ''} onChange={event=>onChange({...transaction,tagId:event.target.value})}><option value="">Chọn danh mục</option>{compatibleTags.map(tag=><option key={tag.id} value={tag.id}>{localCategory(tag.name)}</option>)}</select></label>
        <label><span>Ví</span><select value={transaction.walletId} disabled={transaction.status === 'CONFIRMED'} onChange={event=>onChange({...transaction,walletId:event.target.value})}>{wallets.map(wallet=><option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select>{transaction.status === 'CONFIRMED'&&<small>Không thể đổi ví sau khi giao dịch đã xác nhận.</small>}</label>
        <label><span>Ngày giao dịch</span><input type="date" value={transaction.transactionDate.slice(0,10)} onChange={event=>onChange({...transaction,transactionDate:new Date(`${event.target.value}T12:00:00+07:00`).toISOString()})}/></label>
        <label className="wide"><span>Ghi chú</span><textarea rows={3} value={transaction.note || ''} onChange={event=>onChange({...transaction,note:event.target.value})}/></label>
      </div>
      <div className={`transaction-edit-status ${transaction.status === 'DRAFT' ? 'draft' : 'confirmed'}`}>{transaction.status === 'DRAFT' ? <FileClock/> : <Check/>}{transaction.status === 'DRAFT' ? 'Bản nháp' : 'Đã xác nhận'}</div>
      {error&&<div className="transaction-modal-error"><AlertTriangle/>{error}</div>}
      <footer className={transaction.status === 'DRAFT' ? 'three-actions' : ''}>
        <button onClick={onClose} disabled={saving}>Hủy</button>
        <button className={transaction.status === 'DRAFT' ? 'save-secondary' : 'save'} onClick={onSave} disabled={saving||!valid}>{saving?'Đang lưu...':'Lưu thay đổi'}</button>
        {transaction.status === 'DRAFT' && <button className="confirm" onClick={onConfirm} disabled={saving||!valid}><Check/>{saving?'Đang xác nhận...':'Xác nhận giao dịch'}</button>}
      </footer>
    </section>
  </div>;
}

function TransactionDeleteModal({transaction,saving,error,onClose,onConfirm}:{transaction:TransactionDto;saving:boolean;error:string;onClose:()=>void;onConfirm:()=>void}) {
  return <div className="transaction-modal-layer" role="dialog" aria-modal="true" aria-label="Xóa giao dịch">
    <button className="transaction-modal-backdrop" onClick={onClose} aria-label="Đóng"/>
    <section className="transaction-delete-modal">
      <i><Trash2/></i><h2>Xóa giao dịch?</h2>
      <p>Giao dịch <strong>{transaction.title}</strong> với số tiền <b>{transaction.type==='INCOME'?'+':'−'}{money(transaction.amount)}</b> sẽ bị xóa.</p>
      {transaction.status==='CONFIRMED'&&<div><AlertTriangle/> Số dư ví và dữ liệu ngân sách liên quan sẽ được cập nhật lại.</div>}
      {error&&<div className="transaction-modal-error"><AlertTriangle/>{error}</div>}
      <footer><button onClick={onClose} disabled={saving}>Hủy</button><button className="delete" onClick={onConfirm} disabled={saving}>{saving?'Đang xóa...':'Xóa giao dịch'}</button></footer>
    </section>
  </div>;
}
