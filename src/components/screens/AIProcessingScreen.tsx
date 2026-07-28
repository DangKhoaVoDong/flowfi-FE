import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown, ArrowUp, Check, ChevronDown, PencilLine,
  RefreshCw, ShieldCheck, ShoppingBag, WalletCards,
} from 'lucide-react';
import { ScreenId } from '../../types';
import { tagService, transactionService, walletService } from '../../services';
import type { TagDto, WalletDto } from '../../types/api';

interface Props { onNavigate: (screen: ScreenId) => void }
type TransactionType = 'INCOME' | 'EXPENSE';

const parseAmount = (value: string) => Number(value.replace(/[^\d]/g, '')) || 0;
const displayAmount = (value: string) => {
  const amount = parseAmount(value);
  return amount ? new Intl.NumberFormat('vi-VN').format(amount) : '';
};

export const AIProcessingScreen: React.FC<Props> = ({ onNavigate }) => {
  const [type, setType] = useState<TransactionType>('INCOME');
  const [wallets, setWallets] = useState<WalletDto[]>([]);
  const [tags, setTags] = useState<TagDto[]>([]);
  const [walletId, setWalletId] = useState('');
  const [tagId, setTagId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError('');
      try {
        const [walletData, tagData] = await Promise.all([walletService.getAll(), tagService.getAll()]);
        if (cancelled) return;
        const activeWallets = Array.isArray(walletData) ? walletData : [];
        setWallets(activeWallets);
        setTags(Array.isArray(tagData) ? tagData : []);
        setWalletId(activeWallets[0]?.id || '');
      } catch {
        if (!cancelled) setError('Không thể tải dữ liệu ví và danh mục.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const availableTags = useMemo(() => tags.filter(tag => tag.type === type), [tags, type]);
  const selectedWallet = wallets.find(wallet => wallet.id === walletId);
  const formValid = Boolean(walletId && tagId && parseAmount(amount) > 0);
  useEffect(() => {
    if (!availableTags.some(tag => tag.id === tagId)) setTagId('');
  }, [availableTags, tagId]);

  const reset = () => {
    setType('INCOME'); setTagId(''); setAmount(''); setError(''); setSaved(false);
    setWalletId(wallets[0]?.id || '');
  };

  const submit = async () => {
    const numericAmount = parseAmount(amount);
    if (!walletId) { setError('Vui lòng chọn ví.'); return; }
    if (!tagId) { setError('Vui lòng chọn danh mục.'); return; }
    if (numericAmount <= 0) { setError('Số tiền phải lớn hơn 0 ₫.'); return; }
    const tag = availableTags.find(item => item.id === tagId);
    setSaving(true); setError(''); setSaved(false);
    try {
      await transactionService.create({
        walletId,
        tagId,
        amount: numericAmount,
        type,
        title: tag?.name || (type === 'INCOME' ? 'Khoản thu nhanh' : 'Khoản chi nhanh'),
        source: 'MANUAL',
        transactionDate: new Date().toISOString(),
      });
      setSaved(true);
      setAmount('');
      window.setTimeout(() => onNavigate('transactions'), 900);
    } catch {
      setError('Không thể lưu giao dịch. Vui lòng kiểm tra số dư ví và thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return <main className="quick-transaction-page">
    <nav className="quick-breadcrumb"><button onClick={() => onNavigate('dashboard')}>Trang chủ</button><span>/</span><button onClick={() => onNavigate('transactions')}>Giao dịch</button><span>/</span><b>Nhập giao dịch nhanh</b></nav>
    <header className="quick-heading">
      <div className="quick-title"><i><PencilLine/></i><div><h1>Nhập giao dịch nhanh</h1><p>Nhập nhanh – Lưu ngay – Sửa sau khi cần</p></div></div>
      <div className="quick-wallet"><span>Ví sử dụng</span><QuickSelect value={walletId} onChange={setWalletId} placeholder="Chọn ví" disabled={loading} icon={<WalletCards/>} options={wallets.map(wallet => ({value:wallet.id,label:wallet.name}))}/></div>
    </header>

    <section className="quick-form-card">
      <div className="quick-type-switch">
        <button className={type === 'INCOME' ? 'active income' : 'income'} onClick={() => setType('INCOME')}><ArrowUp/> Thu</button>
        <button className={type === 'EXPENSE' ? 'active expense' : 'expense'} onClick={() => setType('EXPENSE')}><ArrowDown/> Chi</button>
      </div>

      <label className="quick-field quick-amount"><span>Số tiền</span><div><i>₫</i><input inputMode="numeric" value={displayAmount(amount)} onChange={event => setAmount(event.target.value)} placeholder="0"/><b>₫</b></div></label>
      <div className="quick-field"><span>Danh mục</span><QuickSelect value={tagId} onChange={setTagId} placeholder="Chọn danh mục" disabled={loading} icon={<ShoppingBag/>} options={availableTags.map(tag => ({value:tag.id,label:tag.name}))}/></div>

      <div className="quick-assurance"><ShieldCheck/><span><strong>Lưu nhanh vào {selectedWallet?.name || 'ví đã chọn'}.</strong><small>Có thể chỉnh sửa sau.</small></span></div>
      {error && <div className="quick-error">{error}</div>}
      {saved && <div className="quick-success"><Check/> Đã lưu giao dịch thành công.</div>}
    </section>

    <footer className="quick-actions">
      <button className="quick-reset" onClick={reset} disabled={saving}><RefreshCw/> Đặt lại</button>
      <button className="quick-save" onClick={() => void submit()} disabled={saving || loading || !formValid}><Check/>{saving ? 'Đang lưu...' : 'Lưu giao dịch'}</button>
    </footer>
  </main>;
};

function QuickSelect({value,onChange,placeholder,options,icon,disabled}:{value:string;onChange:(value:string)=>void;placeholder:string;options:{value:string;label:string}[];icon:React.ReactNode;disabled?:boolean}) {
  const [open,setOpen]=useState(false);
  const rootRef=useRef<HTMLDivElement>(null);
  const selected=options.find(option=>option.value===value);
  useEffect(()=>{
    const close=(event:MouseEvent)=>{if(!rootRef.current?.contains(event.target as Node))setOpen(false)};
    document.addEventListener('mousedown',close);
    return()=>document.removeEventListener('mousedown',close);
  },[]);
  return <div ref={rootRef} className={`quick-select ${open?'open':''}`}>
    <button type="button" disabled={disabled} onClick={()=>setOpen(current=>!current)}>{icon}<span className={selected?'':'placeholder'}>{selected?.label||placeholder}</span><ChevronDown/></button>
    {open&&<div className="quick-select-menu">{options.length?options.map(option=><button type="button" key={option.value} className={option.value===value?'selected':''} onClick={()=>{onChange(option.value);setOpen(false)}}><span>{option.label}</span>{option.value===value&&<Check/>}</button>):<p>Chưa có lựa chọn phù hợp</p>}</div>}
  </div>;
}
