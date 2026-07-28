import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, BarChart3, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight,
  CircleDollarSign, Grid2X2, List, MoreHorizontal, Pencil, Plus, RefreshCw,
  Search, ShieldCheck, Sparkles, TrendingDown, WalletCards, X,
} from 'lucide-react';
import { ScreenId } from '../../types';
import { budgetService } from '../../services/analyticsService';
import { tagService, transactionService } from '../../services/financeService';
import type {
  BudgetMonthCardDto, BudgetTargetRequest, MonthlyBudgetOverviewDto, TagDto, TransactionDto,
} from '../../types/api';

interface Props { onNavigate: (screen: ScreenId) => void }
type Tab = 'overview' | 'allocations' | 'history' | 'annual';
type View = 'table' | 'cards';

const cash = (value: number, currency = 'VND') =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Math.abs(value || 0));
const statusText: Record<string,string> = {
  NOT_STARTED: 'Chưa bắt đầu', ON_TRACK: 'An toàn', ATTENTION: 'Cần chú ý',
  AT_RISK: 'Có nguy cơ vượt', EXCEEDED: 'Đã vượt', COMPLETED: 'Đã kết thúc',
};
const allocationStatus = (percent: number, threshold: number, spent: number) => {
  if (!spent) return ['− Chưa phát sinh','idle'];
  if (percent >= 100) return ['× Đã vượt','exceeded'];
  if (percent >= 90) return ['! Có nguy cơ vượt','risk'];
  if (percent >= threshold) return ['! Cần chú ý','attention'];
  return ['✓ An toàn','safe'];
};
const localizedCategory = (name?: string | null) => {
  const translations: Record<string,string> = { food: 'Ăn uống', dining: 'Ăn uống', transport: 'Di chuyển', shopping: 'Mua sắm', health: 'Sức khỏe', gift: 'Quà tặng' };
  return name ? translations[name.trim().toLowerCase()] || name : 'Chưa phân loại';
};

export const BudgetRoadmapScreen: React.FC<Props> = ({ onNavigate }) => {
  const now = new Date();
  const query = new URLSearchParams(window.location.search);
  const routeMatch = window.location.pathname.match(
    /^\/budgets\/(\d{4})\/(\d{1,2})(?:\/(allocations|history))?\/?$/,
  );
  const legacyDetail = window.location.pathname === '/' && query.has('month');
  const [year, setYear] = useState(Number(routeMatch?.[1] || query.get('year')) || now.getFullYear());
  const [month, setMonth] = useState(Number(routeMatch?.[2] || query.get('month')) || now.getMonth() + 1);
  const [tab, setTab] = useState<Tab>(
    routeMatch?.[3] === 'allocations'
      ? 'allocations'
      : routeMatch?.[3] === 'history'
        ? 'history'
        : routeMatch || legacyDetail
          ? 'overview'
          : 'annual',
  );
  const [view, setView] = useState<View>('table');
  const [overview, setOverview] = useState<MonthlyBudgetOverviewDto | null>(null);
  const [calendar, setCalendar] = useState<BudgetMonthCardDto[]>([]);
  const [tags, setTags] = useState<TagDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [monthPicker, setMonthPicker] = useState(false);
  const [moreMenu, setMoreMenu] = useState(false);
  const [setup, setSetup] = useState(false);
  const [search, setSearch] = useState('');
  const [problemOnly, setProblemOnly] = useState(false);
  const [sort, setSort] = useState('status');
  const [history, setHistory] = useState<TransactionDto[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const load = useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const [monthly, yearData, categoryData] = await Promise.all([
        budgetService.getMonthlyOverview(year, month),
        budgetService.getCalendar(year),
        tagService.getAll(),
      ]);
      setOverview(monthly); setCalendar(yearData); setTags(categoryData.filter(x => x.type === 'EXPENSE'));
    } catch { setError('Chưa thể tải dữ liệu ngân sách. Vui lòng thử lại.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [month, year]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (tab === 'annual') return;
    const refresh = () => {
      if (document.visibilityState === 'visible') void load(true);
    };
    const timer = window.setInterval(refresh, 5000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [load, tab]);
  const budgetPath = useCallback((nextTab: Tab, nextYear = year, nextMonth = month) => {
    if (nextTab === 'annual') return `/budgets?year=${nextYear}`;
    const suffix = nextTab === 'allocations' ? '/allocations' : nextTab === 'history' ? '/history' : '';
    return `/budgets/${nextYear}/${String(nextMonth).padStart(2, '0')}${suffix}`;
  }, [month, year]);
  const goToTab = useCallback((nextTab: Tab, nextYear = year, nextMonth = month) => {
    window.history.pushState({ screen: 'budget', tab: nextTab }, '', budgetPath(nextTab, nextYear, nextMonth));
    setTab(nextTab);
  }, [budgetPath, month, year]);
  useEffect(() => {
    window.history.replaceState(
      { screen: 'budget', tab },
      '',
      budgetPath(tab),
    );
  }, [budgetPath, tab]);
  useEffect(() => {
    const onPopState = () => {
      const match = window.location.pathname.match(
        /^\/budgets\/(\d{4})\/(\d{1,2})(?:\/(allocations|history))?\/?$/,
      );
      const params = new URLSearchParams(window.location.search);
      setYear(Number(match?.[1] || params.get('year')) || now.getFullYear());
      setMonth(Number(match?.[2] || params.get('month')) || now.getMonth() + 1);
      setTab(
        match?.[3] === 'allocations'
          ? 'allocations'
          : match?.[3] === 'history'
            ? 'history'
            : match
              ? 'overview'
              : 'annual',
      );
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  useEffect(() => {
    if (tab !== 'history') return;
    let cancelled = false;
    const loadHistory = async () => {
      setHistoryLoading(true); setHistoryError('');
      try {
        const from = new Date(Date.UTC(year, month - 1, 1)).toISOString();
        const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString();
        const collected: TransactionDto[] = [];
        let page = 1;
        while (true) {
          const response = await transactionService.getAll({ page, pageSize: 100, from, to });
          collected.push(...(response.items || []));
          if (!response.items?.length || collected.length >= response.total) break;
          page += 1;
        }
        if (!cancelled) setHistory(collected);
      } catch {
        if (!cancelled) setHistoryError('Không thể tải lịch sử giao dịch của tháng này.');
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };
    void loadHistory();
    return () => { cancelled = true; };
  }, [month, tab, year]);

  const changeMonth = (next: number, nextYear = year) => { setMonth(next); setYear(nextYear); setMonthPicker(false); };
  const moveMonth = (direction: number) => {
    const date = new Date(year, month - 1 + direction, 1); changeMonth(date.getMonth() + 1, date.getFullYear());
  };
  const allocations = useMemo(() => {
    let result = [...(overview?.allocations || [])];
    if (search) result = result.filter(x => (x.tagName || x.name).toLowerCase().includes(search.toLowerCase()));
    if (problemOnly) result = result.filter(x => x.usagePercent >= (overview?.summary.warningThresholdPercent || 80));
    result.sort((a,b) => sort === 'spent' ? b.spentAmount - a.spentAmount : sort === 'remaining' ? a.remainingAmount - b.remainingAmount : b.usagePercent - a.usagePercent);
    return result;
  }, [overview, problemOnly, search, sort]);

  return <main className="budget-page">
    {refreshing && <div className="budget-refresh-line" />}
    <div className="budget-breadcrumb"><button onClick={() => onNavigate('dashboard')}>Trang chủ</button><ChevronRight /><button onClick={() => goToTab('annual')}>Ngân sách</button></div>
    <header className={`budget-heading ${tab === 'annual' ? 'annual-heading' : ''}`}>
      <div><h1>Ngân sách</h1><p>{tab === 'annual' ? 'Chọn tháng để xem tổng quan ngân sách' : 'Theo dõi và kiểm soát kế hoạch chi tiêu hàng tháng'}</p></div>
      <div className="budget-actions">
        {tab !== 'annual' && <div className="month-selector">
          <button onClick={() => setMonthPicker(x => !x)}><CalendarDays /> Tháng {String(month).padStart(2,'0')}/{year}</button>
          {monthPicker && <div className="month-popover"><div><button onClick={() => setYear(x => x-1)}><ChevronLeft /></button><strong>{year}</strong><button onClick={() => setYear(x => x+1)}><ChevronRight /></button></div><section>{Array.from({length:12},(_,i)=>i+1).map(item => <button key={item} className={`${item === month ? 'selected' : ''} ${item === now.getMonth()+1 && year === now.getFullYear() ? 'current' : ''}`} onClick={() => changeMonth(item)}><span>Tháng {item}</span>{calendar.some(x => x.month === item && x.hasBudget) && <i />}</button>)}</section></div>}
        </div>}
        {tab === 'annual' && <div className="annual-year-picker"><button onClick={() => setYear(x => x - 1)} aria-label="Năm trước"><ChevronLeft /></button><span><CalendarDays /> Năm {year}</span><button onClick={() => setYear(x => x + 1)} aria-label="Năm sau"><ChevronRight /></button></div>}
        {tab !== 'annual' && <div className="budget-more-menu"><button className="icon-only" aria-label="Tùy chọn" onClick={() => setMoreMenu(x => !x)}><MoreHorizontal /></button>{moreMenu&&<div><button><CalendarDays /> Sao chép từ tháng trước</button><button><BarChart3 /> Xuất báo cáo</button><button className="danger"><X /> Xóa kế hoạch tháng</button></div>}</div>}
      </div>
    </header>
    {tab !== 'annual' && <nav className="budget-detail-tabs"><button className={tab==='overview'?'active':''} onClick={()=>goToTab('overview')}>Tổng quan tháng</button><button className={tab==='allocations'?'active':''} onClick={()=>goToTab('allocations')}>Phân bổ danh mục</button><button className={tab==='history'?'active':''} onClick={()=>goToTab('history')}>Lịch sử</button></nav>}

    {loading ? <BudgetSkeleton /> : error ? <div className="budget-empty"><AlertTriangle /><h2>Không thể tải ngân sách</h2><p>{error}</p><button className="budget-primary" onClick={() => void load()}><RefreshCw /> Thử lại</button></div>
    : tab === 'annual' ? <AnnualOverview data={calendar} year={year} selectedMonth={month} currentYear={now.getFullYear()} currentMonth={now.getMonth()+1} onMonth={item => { changeMonth(item); goToTab('overview', year, item); }} onSetup={item => { changeMonth(item); setSetup(true); }} />
    : !overview ? <EmptyBudget month={month} year={year} onSetup={() => setSetup(true)} />
    : tab==='history'?<BudgetHistory items={history} loading={historyLoading} error={historyError} month={month} year={year} currency={overview.summary.currencyCode} onRetry={()=>{setTab('overview');setTimeout(()=>setTab('history'),0)}} />
    : <BudgetContent overview={overview} allocations={allocations} tab={tab} view={view} setView={setView} search={search} setSearch={setSearch} problemOnly={problemOnly} setProblemOnly={setProblemOnly} sort={sort} setSort={setSort} onEdit={() => setSetup(true)} onTransactions={() => onNavigate('transactions')} />}
    {setup && <BudgetSetup existing={overview} tags={tags} month={month} year={year} onClose={() => setSetup(false)} onSaved={() => { setSetup(false); void load(); }} />}
  </main>;
};

function BudgetContent({ overview, allocations, tab, view, setView, search, setSearch, problemOnly, setProblemOnly, sort, setSort, onEdit, onTransactions }: any) {
  const s = overview.summary;
  const exceeded = s.remainingAmount < 0;
  if (tab === 'history') return <div className="budget-empty compact"><CalendarDays /><h2>Lịch sử ngân sách {s.year}</h2><p>Chọn “Tổng quan năm” để so sánh kế hoạch và thực tế của 12 tháng.</p></div>;
  return <>
    {tab === 'overview' && <><section className="budget-kpis">
      <article><div className="detail-kpi-label"><i className="purple"><CalendarDays /></i><span>Ngân sách tháng</span><button onClick={onEdit}><Pencil /></button></div><strong>{cash(s.targetAmount,s.currencyCode)}</strong><small><b>↑</b> {overview.allocations.length} danh mục · Ngưỡng {s.warningThresholdPercent}%</small></article>
      <article><div className="detail-kpi-label"><i className="blue"><WalletCards /></i><span>Đã chi</span></div><strong>{cash(s.spentAmount,s.currencyCode)}</strong><small><b>{s.percentUsed.toFixed(1)}%</b> ngân sách · {s.transactionCount} giao dịch</small></article>
      <article className={exceeded ? 'danger' : 'positive'}><div className="detail-kpi-label"><i className="green"><CircleDollarSign /></i><span>{exceeded ? 'Đã vượt' : 'Còn lại'}</span></div><strong>{cash(s.remainingAmount,s.currencyCode)}</strong><small>{exceeded ? `Vượt ${(s.percentUsed-100).toFixed(1)}% ngân sách` : `${Math.max(0,100-s.percentUsed).toFixed(1)}% ngân sách còn lại`}</small></article>
      <article><div className="detail-kpi-label"><i className="orange"><BarChart3 /></i><span>Dự báo cuối tháng</span></div><strong>{cash(s.projectedExpense,s.currencyCode)}</strong><small><em>Ước tính</em> {s.projectedExpense > s.targetAmount ? `Có thể vượt ${cash(s.projectedExpense-s.targetAmount,s.currencyCode)}` : 'Dự báo trong giới hạn'}</small></article>
    </section>
    <section className="budget-overview-grid"><BudgetProgress overview={overview} onAddTransaction={onTransactions} /><div className="budget-right-rail"><MonthStatus summary={s} allocations={overview.allocations} /></div></section></>}
    <div className="budget-bottom-grid single"><section className={`allocation-section ${tab==='overview'?'overview-mode':''}`}>
      <div className="allocation-heading"><div><h2>Ngân sách theo danh mục</h2>{tab!=='overview'&&<p>Ưu tiên hiển thị danh mục cần xử lý trước.</p>}</div>{tab==='overview'?<button className="view-all-budget">Xem tất cả</button>:<div><label><Search /><input placeholder="Tìm danh mục" value={search} onChange={e=>setSearch(e.target.value)} /></label><select value={sort} onChange={e=>setSort(e.target.value)}><option value="status">% sử dụng</option><option value="spent">Đã chi</option><option value="remaining">Còn lại</option></select><button className={problemOnly?'active':''} onClick={()=>setProblemOnly(!problemOnly)}><AlertTriangle /> Cần chú ý</button><span className="view-switch"><button className={view==='table'?'active':''} onClick={()=>setView('table')}><List /></button><button className={view==='cards'?'active':''} onClick={()=>setView('cards')}><Grid2X2 /></button></span></div>}</div>
      {tab==='overview'?<><div className="overview-allocation-table"><AllocationTable data={allocations} summary={s} onTransactions={onTransactions} /></div><div className="overview-allocation-cards"><AllocationCards data={allocations} summary={s} /></div></>:view === 'table' ? <AllocationTable data={allocations} summary={s} onTransactions={onTransactions} /> : <AllocationCards data={allocations} summary={s} />}
    </section></div>
  </>;
}

function BudgetProgress({ overview, onAddTransaction }: { overview: MonthlyBudgetOverviewDto; onAddTransaction: () => void }) {
  const s=overview.summary, percent=Math.min(100,s.percentUsed), max=Math.max(s.targetAmount,s.projectedExpense,...overview.dailyTrend.map(x=>x.cumulativeExpense),1);
  const points=(key:'cumulativeExpense'|'idealCumulativeExpense'|'projectedCumulativeExpense')=>overview.dailyTrend.map((x,i)=>`${i/(overview.dailyTrend.length-1)*100},${100-x[key]/max*88}`).join(' ');
  return <article className="budget-progress-card"><div className="budget-card-title"><div><h2>Tiến độ ngân sách tổng</h2><p>Đã sử dụng {cash(s.spentAmount,s.currencyCode)} trên {cash(s.targetAmount,s.currencyCode)}</p></div><span className={`budget-status ${s.status.toLowerCase()}`}>{statusText[s.status]}</span></div>
    <div className={`large-progress ${s.status.toLowerCase()}`} role="progressbar" aria-valuenow={Math.min(100,s.percentUsed)} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${percent}%`}} /><em className="marker m70" /><em className="marker threshold" style={{left:`${s.warningThresholdPercent}%`}} /><em className="marker m100" /></div><div className="progress-labels"><span>{s.percentUsed.toFixed(1)}% đã sử dụng</span><strong>{s.percentUsed>100?`+${(s.percentUsed-100).toFixed(1)}% vượt mức`:`Còn ${cash(s.remainingAmount,s.currencyCode)}`}</strong></div>
    <div className="budget-chart-title"><div><h3>Biểu đồ chi tiêu theo ngày</h3>{s.spentAmount>0&&<span><i /> Thực tế <i /> Lý tưởng <i /> Dự báo</span>}</div></div>
    {s.spentAmount<=0?<div className="budget-chart-empty"><BarChart3/><strong>Chưa có dữ liệu chi tiêu</strong><p>Các giao dịch trong tháng sẽ được hiển thị tại đây.</p><button onClick={onAddTransaction}><Plus/> Thêm giao dịch</button></div>:<div className="budget-line-chart"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Biểu đồ chi tiêu lũy kế"><polyline className="ideal" points={points('idealCumulativeExpense')} /><polyline className="projection" points={points('projectedCumulativeExpense')} /><polyline className="actual" points={points('cumulativeExpense')} /></svg></div>}
    <div className="time-comparison"><span>Đã qua <b>{s.timeElapsedPercent.toFixed(0)}%</b> thời gian tháng</span><span>Đã dùng <b>{s.percentUsed.toFixed(0)}%</b> ngân sách</span>{s.percentUsed>s.timeElapsedPercent+10&&<strong><TrendingDown /> Bạn đang chi nhanh hơn tiến độ tháng</strong>}</div>
  </article>;
}
function MonthStatus({summary:s,allocations}:any){const top=[...allocations].sort((a,b)=>b.spentAmount-a.spentAmount)[0];return <aside className="month-status"><div className="budget-card-title"><div><h2>Tình trạng tháng {s.month}</h2><p>Các chỉ số có thể hành động</p></div><ShieldCheck /></div><dl><div><dt><CalendarDays/> Còn lại</dt><dd>{s.remainingDays} ngày</dd></div><div><dt><CircleDollarSign/> Có thể chi mỗi ngày</dt><dd>{cash(s.safeDailyAmount,s.currencyCode)}</dd></div><div><dt><TrendingDown/> Trung bình đã chi/ngày</dt><dd>{cash(s.averageDailyExpense,s.currencyCode)}</dd></div><div><dt><CircleDollarSign/> Đã dùng ngân sách</dt><dd>{s.percentUsed.toFixed(1)}%</dd></div><div><dt><CalendarDays/> Thời gian đã qua</dt><dd>{s.timeElapsedPercent.toFixed(0)}%</dd></div><div><dt><BarChart3/> Danh mục chi nhiều nhất</dt><dd>{localizedCategory(top?.tagName||top?.name)}</dd></div></dl><div className={`month-verdict ${s.status.toLowerCase()}`}>{s.status==='EXCEEDED'?<AlertTriangle/>:<CheckCircle2/>}<span><strong>{statusText[s.status]}</strong><small>{s.status==='ON_TRACK'?'Ngân sách đang trong vùng an toàn.':'Hãy xem lại các danh mục bên dưới.'}</small></span></div></aside>}
function AllocationTable({data,summary,onTransactions}:any){return <div className="allocation-table"><table><thead><tr><th>Danh mục</th><th>Ngân sách</th><th>Đã chi</th><th>Tiến độ</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{data.map((x:any)=>{const [label,tone]=allocationStatus(x.usagePercent,summary.warningThresholdPercent,x.spentAmount);return <tr key={x.id}><td><span className="category-dot" /> <b>{localizedCategory(x.tagName||x.name)}</b><small>{x.transactionCount} giao dịch</small></td><td>{cash(x.targetAmount,summary.currencyCode)}</td><td><button onClick={onTransactions}>{cash(x.spentAmount,summary.currencyCode)}</button></td><td><div className={`mini-progress ${tone}`}><i style={{width:`${Math.min(100,x.usagePercent)}%`}} /></div><small>{x.usagePercent.toFixed(1)}%</small></td><td><span className={`allocation-badge ${tone}`}>{label}</span></td><td><MoreHorizontal /></td></tr>})}</tbody></table></div>}
function AllocationCards({data,summary}:any){return <div className="allocation-cards">{data.map((x:any)=>{const [label,tone]=allocationStatus(x.usagePercent,summary.warningThresholdPercent,x.spentAmount);return <article key={x.id}><div><span className="category-dot"/><strong>{localizedCategory(x.tagName||x.name)}</strong><b>{x.usagePercent.toFixed(1)}%</b></div><small>Ngân sách: {cash(x.targetAmount,summary.currencyCode)}</small><p>Đã chi: {cash(x.spentAmount,summary.currencyCode)}</p><div className={`mini-progress ${tone}`}><i style={{width:`${Math.min(100,x.usagePercent)}%`}} /></div><footer><span className={`allocation-badge ${tone}`}>{label}</span><span>{x.remainingAmount<0?`Vượt ${cash(x.remainingAmount,summary.currencyCode)}`:`Còn ${cash(x.remainingAmount,summary.currencyCode)}`}</span></footer></article>})}</div>}
function AnnualOverview({data,year,selectedMonth,currentYear,currentMonth,onMonth,onSetup}:{data:BudgetMonthCardDto[],year:number,selectedMonth:number,currentYear:number,currentMonth:number,onMonth:(month:number)=>void,onSetup:(month:number)=>void}){
  const months = Array.isArray(data) ? data : [];
  const formatPercent = (value: number, preventFullSaving = false) => {
    const safeValue = preventFullSaving && value >= 99.95 ? 99.9 : Math.max(0, value);
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1, minimumFractionDigits: 0 }).format(safeValue);
  };
  const formatUsedPercent = (value: number, spent: number) =>
    spent > 0 && value < 0.1 ? '<0,1' : formatPercent(value);
  return <section className="budget-year-grid" aria-label={`Ngân sách năm ${year}`}>
    {months.map(card=>{
      const isCurrent=year===currentYear&&card.month===currentMonth;
      const isSelected=card.month===selectedMonth;
      const isPast=year<currentYear||(year===currentYear&&card.month<currentMonth);
      const isFuture=year>currentYear||(year===currentYear&&card.month>currentMonth);
      const saving=card.totalTargetAmount?Math.max(0,(card.totalTargetAmount-card.spentAmount)/card.totalTargetAmount*100):0;
      const exceeded=card.totalTargetAmount?Math.max(0,(card.spentAmount-card.totalTargetAmount)/card.totalTargetAmount*100):0;
      const used=card.totalTargetAmount?card.spentAmount/card.totalTargetAmount*100:0;
      const isNearLimit=used>=80&&used<100;
      let stateClass='saving';
      let stateIcon:React.ReactNode=<CheckCircle2 />;
      let stateLabel=card.spentAmount === 0 ? 'Còn 100% ngân sách' : `Tiết kiệm ${formatPercent(saving,true)}%`;
      if(isCurrent){
        stateClass=used>=100?'over':isNearLimit?'near':'using';
        stateIcon=used>=100?<AlertTriangle/>:<CircleDollarSign/>;
        stateLabel=used>=100?`Vượt ${formatPercent(exceeded)}%`:`Đã dùng ${formatUsedPercent(used,card.spentAmount)}% ngân sách`;
      }else if(isFuture){
        stateClass='planned';stateIcon=<CheckCircle2/>;stateLabel='Đã thiết lập · Chưa bắt đầu';
      }else if(isPast&&used>=100){
        stateClass='over';stateIcon=<AlertTriangle/>;stateLabel=`Vượt ${formatPercent(exceeded)}%`;
      }
      return <article key={card.month} className={`${isSelected?'selected':''} ${isCurrent?'current':''} ${!card.hasBudget?'empty':''}`}>
        <button className="month-card-main" onClick={()=>card.hasBudget?onMonth(card.month):onSetup(card.month)} aria-label={`${card.hasBudget?'Xem':'Thiết lập'} ngân sách tháng ${card.month}`}>
          <header><span className="month-number">{String(card.month).padStart(2,'0')}</span><span>Tháng {String(card.month).padStart(2,'0')}</span>{isCurrent&&<b className="current-month-badge">Hiện tại</b>}<ChevronRight /></header>
          {card.hasBudget?<>
            <dl className="month-money"><div><dt>Ngân sách</dt><dd>{cash(card.totalTargetAmount)}</dd></div><div><dt>Đã chi</dt><dd>{cash(card.spentAmount)}</dd></div></dl>
            {isCurrent&&<div className="month-card-progress" role="progressbar" aria-valuenow={Math.min(100,used)} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${Math.min(100,used)}%`}} /></div>}
            <footer className={stateClass}>{stateIcon}<span>{stateLabel}</span></footer>
          </>:<><div className="no-budget-label">Chưa có ngân sách</div><div className="no-plan"><i>−</i><span>Chưa có kế hoạch</span></div></>}
        </button>
      </article>
    })}
  </section>
}
function BudgetHistory({items,loading,error,month,year,currency,onRetry}:{items:TransactionDto[],loading:boolean,error:string,month:number,year:number,currency:string,onRetry:()=>void}){
  const expenses=items.filter(x=>x.type==='EXPENSE'),income=items.filter(x=>x.type==='INCOME');
  return <section className="budget-history">
    <header><div><h2>Lịch sử giao dịch tháng {String(month).padStart(2,'0')}/{year}</h2><p>Toàn bộ giao dịch phát sinh trong tháng ngân sách đang chọn.</p></div><span>{items.length} giao dịch</span></header>
    <div className="history-summary"><article><span>Tổng chi tiêu</span><strong>{cash(expenses.reduce((sum,x)=>sum+x.amount,0),currency)}</strong></article><article><span>Tổng thu nhập</span><strong>{cash(income.reduce((sum,x)=>sum+x.amount,0),currency)}</strong></article><article><span>Chênh lệch</span><strong>{cash(income.reduce((sum,x)=>sum+x.amount,0)-expenses.reduce((sum,x)=>sum+x.amount,0),currency)}</strong></article></div>
    {loading?<div className="history-loading">{Array.from({length:6},(_,i)=><i key={i}/>)}</div>:error?<div className="history-empty"><AlertTriangle/><h3>Chưa thể tải lịch sử</h3><p>{error}</p><button onClick={onRetry}><RefreshCw/> Thử lại</button></div>:!items.length?<div className="history-empty"><CalendarDays/><h3>Chưa có giao dịch</h3><p>Không có giao dịch nào trong tháng đang chọn.</p></div>:<div className="history-table"><table><thead><tr><th>Ngày</th><th>Nội dung</th><th>Danh mục</th><th>Nguồn</th><th>Số tiền</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td>{new Date(item.transactionDate).toLocaleDateString('vi-VN')}</td><td><strong>{item.title}</strong><small>{item.note||'Không có ghi chú'}</small></td><td>{item.tagName||'Chưa phân loại'}</td><td><span className="source-badge">{item.source}</span></td><td className={item.type==='EXPENSE'?'expense':'income'}>{item.type==='EXPENSE'?'-':'+'}{cash(item.amount,currency)}</td></tr>)}</tbody></table></div>}
  </section>
}
function EmptyBudget({month,year,onSetup}:{month:number,year:number,onSetup:()=>void}){return <div className="budget-empty"><Sparkles/><h2>Chưa có kế hoạch trong tháng</h2><p>Bạn chưa thiết lập ngân sách cho tháng {String(month).padStart(2,'0')}/{year}. Tạo kế hoạch để theo dõi giới hạn và nhận cảnh báo.</p><div><button className="budget-primary" onClick={onSetup}><Plus/> Thiết lập ngân sách</button><button className="subtle-button">Sao chép tháng trước</button></div></div>}
function BudgetSkeleton(){return <div className="budget-skeleton"><section>{Array.from({length:4},(_,i)=><i key={i}/>)}</section><div><i/><i/></div><article>{Array.from({length:5},(_,i)=><i key={i}/>)}</article></div>}

function BudgetSetup({existing,tags,month,year,onClose,onSaved}:any){
  const [target,setTarget]=useState(existing?.summary.targetAmount||0),[threshold,setThreshold]=useState(existing?.summary.warningThresholdPercent||80),[allocations,setAllocations]=useState<BudgetTargetRequest[]>(existing?.allocations.map((x:any)=>({tagId:x.tagId,tagName:x.tagName,name:x.name,targetAmount:x.targetAmount}))||[]),[saving,setSaving]=useState(false),[error,setError]=useState('');
  const allocated=allocations.reduce((s,x)=>s+Number(x.targetAmount||0),0), valid=target>0&&allocated<=target&&allocations.length>0;
  const addTag=(tag:TagDto)=>setAllocations(x=>[...x,{tagId:tag.id,tagName:tag.name,name:tag.name,targetAmount:0}]);
  const save=async()=>{setSaving(true);setError('');try{const payload={name:`Ngân sách tháng ${month}/${year}`,month,year,totalTargetAmount:target,warningThresholdPercent:threshold,currencyCode:'VND',targets:allocations};if(existing)await budgetService.update(existing.summary.id,{...payload,status:'Active'});else await budgetService.create(payload);onSaved();}catch(e:any){setError(e?.response?.data?.message||'Không thể lưu ngân sách. Hãy kiểm tra tổng phân bổ.');}finally{setSaving(false)}};
  return <div className="budget-setup"><button className="setup-backdrop" onClick={onClose}/><section><header><div><span>Thiết lập kế hoạch</span><h2>Ngân sách tháng {String(month).padStart(2,'0')}/{year}</h2></div><button onClick={onClose}><X/></button></header><div className="setup-body"><article><h3>1. Target tổng</h3><label>Ngân sách tổng<div><input type="number" value={target||''} onChange={e=>setTarget(Number(e.target.value))}/><span>VND</span></div></label><label>Ngưỡng cảnh báo <b>{threshold}%</b><input type="range" min="50" max="100" value={threshold} onChange={e=>setThreshold(Number(e.target.value))}/></label><div className="setup-hint"><Sparkles/><span><b>Mô hình linh hoạt</b><small>Tổng phân bổ có thể nhỏ hơn Target; phần còn lại là dự phòng.</small></span></div></article><article><div className="setup-allocation-head"><h3>2. Phân bổ danh mục</h3><span>Đã phân bổ <b>{cash(allocated)}</b> · Chưa phân bổ <b className={allocated>target?'negative':''}>{cash(target-allocated)}</b></span></div>{allocations.map((item,index)=><div className="allocation-input" key={`${item.tagId}-${index}`}><span>{item.name}</span><input type="number" value={item.targetAmount||''} onChange={e=>setAllocations(x=>x.map((v,i)=>i===index?{...v,targetAmount:Number(e.target.value)}:v))}/><button onClick={()=>setAllocations(x=>x.filter((_,i)=>i!==index))}><X/></button></div>)}<select value="" onChange={e=>{const tag=tags.find((x:TagDto)=>x.id===e.target.value);if(tag&&!allocations.some(x=>x.tagId===tag.id))addTag(tag)}}><option value="">+ Thêm danh mục</option>{tags.filter((t:TagDto)=>!allocations.some(x=>x.tagId===t.id)).map((t:TagDto)=><option key={t.id} value={t.id}>{t.name}</option>)}</select>{allocated>target&&<p className="setup-error">Tổng phân bổ đang vượt Target {cash(allocated-target)}.</p>}{error&&<p className="setup-error">{error}</p>}</article></div><footer><span>Chưa phân bổ: <b>{cash(Math.max(0,target-allocated))}</b></span><div><button onClick={onClose}>Hủy</button><button className="budget-primary" disabled={!valid||saving} onClick={()=>void save()}>{saving?'Đang lưu...':'Lưu ngân sách'}</button></div></footer></section></div>
}
