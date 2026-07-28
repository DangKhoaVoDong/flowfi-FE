import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  FileImage,
  ImagePlus,
  LoaderCircle,
  LockKeyhole,
  CalendarDays,
  CircleDollarSign,
  ListChecks,
  PencilLine,
  RefreshCw,
  Save,
  ScanLine,
  Sparkles,
  Trash2,
  UploadCloud,
  WalletCards,
  X,
  ZoomIn,
} from 'lucide-react';
import type { ScreenId } from '../../types';
import type { ImageTransactionResponseDto, TagDto, WalletDto } from '../../types/api';
import { imageAiService, tagService, transactionService, walletService } from '../../services';

interface Props {
  onNavigate: (screen: ScreenId) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const money = new Intl.NumberFormat('vi-VN');
const categoryNames: Record<string, string> = {
  FOOD: 'Ăn uống', FOOD_DRINK: 'Ăn uống', TRANSPORT: 'Di chuyển',
  SHOPPING: 'Mua sắm', EDUCATION: 'Học tập', UTILITIES: 'Hóa đơn',
  SALARY: 'Thu nhập', INCOME: 'Thu nhập', HEALTH: 'Sức khỏe',
  TRANSFER: 'Chuyển khoản', 'BANK TRANSFER': 'Chuyển khoản',
  'OTHER INCOME': 'Thu nhập khác', 'OTHER EXPENSE': 'Chi tiêu khác',
};
const categoryLabel = (name?: string) => {
  const normalized = (name || '').trim().toUpperCase();
  return categoryNames[normalized] || name || 'Chưa phân loại';
};

interface DraftForm {
  title: string;
  amount: string;
  tagId: string;
  walletId: string;
  type: 'INCOME' | 'EXPENSE';
  transactionDate: string;
}

const readApiError = (error: unknown) => {
  const value = error as {
    response?: { data?: { code?: string; errorCode?: string; message?: string; title?: string } };
  };
  const data = value.response?.data;
  const code = data?.code || data?.errorCode || data?.message;
  const known: Record<string, string> = {
    AI_NO_FINANCIAL_TRANSACTION_FOUND:
      'AI chưa tìm thấy giao dịch tài chính trong ảnh. Hãy thử ảnh hóa đơn rõ và đầy đủ hơn.',
    AI_LOW_IMAGE_CONFIDENCE:
      'Ảnh chưa đủ rõ để phân tích chính xác. Hãy chụp thẳng, đủ sáng và không bị cắt nội dung.',
    AI_AMOUNT_NOT_FOUND:
      'Không tìm thấy số tiền trong ảnh. Vui lòng chọn ảnh hiển thị rõ tổng tiền.',
    AI_LOW_TRANSACTION_CONFIDENCE:
      'AI chưa đủ chắc chắn về giao dịch trong ảnh. Hãy chọn ảnh rõ hơn hoặc cắt ảnh sát nội dung giao dịch.',
    AI_TRANSACTION_TYPE_NOT_FOUND:
      'Chưa xác định được đây là khoản thu hay khoản chi. Hãy dùng ảnh hiển thị rõ dấu cộng/trừ hoặc hướng chuyển tiền.',
    AI_INVALID_STRUCTURED_RESPONSE:
      'AI chưa đọc được cấu trúc giao dịch từ ảnh này. Vui lòng thử lại hoặc chọn ảnh rõ hơn.',
    AI_INVALID_IMAGE:
      'Định dạng ảnh không được hỗ trợ. Vui lòng dùng JPG, PNG hoặc WebP.',
  };
  return (code && known[code]) || data?.message || data?.title ||
    'Không thể phân tích ảnh lúc này. Vui lòng kiểm tra ảnh và thử lại.';
};

export const AIImageTransactionScreen: React.FC<Props> = ({ onNavigate }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [wallets, setWallets] = useState<WalletDto[]>([]);
  const [tags, setTags] = useState<TagDto[]>([]);
  const [walletId, setWalletId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImageTransactionResponseDto | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState('');
  const [confirmingId, setConfirmingId] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [editForm, setEditForm] = useState<DraftForm | null>(null);
  const [imageExpanded, setImageExpanded] = useState(false);
  const [noteExpanded, setNoteExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadWallets = async () => {
      try {
        const [data, tagData] = await Promise.all([walletService.getAll(), tagService.getAll()]);
        if (cancelled) return;
        const active = Array.isArray(data) ? data.filter(wallet => wallet.isActive) : [];
        setWallets(active);
        setTags(Array.isArray(tagData) ? tagData : []);
        setWalletId(active[0]?.id || '');
      } catch {
        if (!cancelled) setError('Không thể tải danh sách ví. Vui lòng tải lại trang.');
      } finally {
        if (!cancelled) setLoadingWallets(false);
      }
    };
    void loadWallets();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const selectFile = (selected?: File) => {
    setError('');
    setResult(null);
    if (!selected) return;
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.');
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError('Ảnh vượt quá dung lượng tối đa 5 MB.');
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const clearFile = () => {
    setFile(null);
    setPreview('');
    setResult(null);
    setError('');
    setConfirmError('');
    setSelectedTransactionId('');
    setIsEditing(false);
    setEditForm(null);
    setImageExpanded(false);
    setNoteExpanded(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const submit = async () => {
    if (!walletId || !file) return;
    const draftsToReplace = (result?.createdTransactions ?? [])
      .filter(item => item.transaction.status === 'DRAFT')
      .map(item => item.transaction.id);
    setProcessing(true);
    setError('');
    setResult(null);
    try {
      const response = await imageAiService.createTransaction(walletId, file);
      if (draftsToReplace.length) {
        await Promise.allSettled(draftsToReplace.map(id => transactionService.delete(id)));
      }
      setResult(response);
      setSelectedTransactionId(response.createdTransactions[0]?.transaction.id || '');
      setIsEditing(false);
    } catch (submitError) {
      setError(readApiError(submitError));
    } finally {
      setProcessing(false);
    }
  };

  const selectedWallet = wallets.find(wallet => wallet.id === walletId);
  const created = result?.createdTransactions ?? [];
  const analyzed = result?.analysis?.transactions ?? [];
  const selectedResult = created.find(item => item.transaction.id === selectedTransactionId) || created[0];
  const selectedTransaction = selectedResult?.transaction;
  const selectedTransactionType = (
    selectedTransaction as (typeof selectedTransaction & { transactionType?: string })
  )?.type || (
    selectedTransaction as (typeof selectedTransaction & { transactionType?: string })
  )?.transactionType || selectedResult?.tag.transactionType;
  const normalizedSelectedType: 'INCOME' | 'EXPENSE' =
    selectedTransactionType === 'INCOME' ? 'INCOME' : 'EXPENSE';
  const selectedResultIndex = selectedResult ? created.indexOf(selectedResult) : -1;
  const selectedAnalysis = analyzed[selectedResultIndex >= 0 ? selectedResultIndex : 0];
  const confidence = Math.round(Number(selectedAnalysis?.confidence || result?.analysis.confidence || 0) * 100);
  const editTags = tags.filter(tag => tag.type === editForm?.type);
  const allConfirmed = created.length > 0 && created.every(item => item.transaction.status === 'CONFIRMED');

  const beginEditing = () => {
    if (!selectedTransaction) return;
    setEditForm({
      title: selectedTransaction.title,
      amount: String(selectedTransaction.amount),
      tagId: selectedTransaction.tagId || '',
      walletId: selectedTransaction.walletId,
      type: normalizedSelectedType,
      transactionDate: selectedTransaction.transactionDate.slice(0, 10),
    });
    setConfirmError('');
    setIsEditing(true);
  };

  const saveDraft = async () => {
    if (!selectedTransaction || !editForm) return;
    const amount = Number(editForm.amount);
    if (!editForm.title.trim() || !editForm.walletId || !editForm.tagId || amount <= 0) {
      setConfirmError('Vui lòng nhập đầy đủ nội dung, số tiền, ví và danh mục.');
      return;
    }
    setSavingDraft(true);
    setConfirmError('');
    try {
      const updated = await transactionService.update(selectedTransaction.id, {
        walletId: editForm.walletId,
        tagId: editForm.tagId,
        amount,
        type: editForm.type,
        status: 'DRAFT',
        title: editForm.title.trim(),
        note: selectedTransaction.note,
        source: selectedTransaction.source,
        transactionDate: new Date(`${editForm.transactionDate}T12:00:00+07:00`).toISOString(),
      });
      const selectedTag = tags.find(tag => tag.id === editForm.tagId);
      setResult(current => current ? {
        ...current,
        createdTransactions: current.createdTransactions.map(item =>
          item.transaction.id === updated.id
            ? {
                ...item,
                tag: selectedTag
                  ? { ...item.tag, id: selectedTag.id, name: selectedTag.name, transactionType: selectedTag.type }
                  : item.tag,
                transaction: { ...item.transaction, ...updated },
              }
            : item),
      } : current);
      setWalletId(editForm.walletId);
      setIsEditing(false);
    } catch (draftError) {
      const value = draftError as { response?: { data?: { message?: string } } };
      setConfirmError(value.response?.data?.message || 'Không thể lưu thay đổi của giao dịch nháp.');
    } finally {
      setSavingDraft(false);
    }
  };

  const confirmTransaction = async () => {
    if (!selectedTransaction || selectedTransaction.status === 'CONFIRMED') return;
    setConfirmingId(selectedTransaction.id);
    setConfirmError('');
    try {
      const updated = await transactionService.update(selectedTransaction.id, {
        walletId: selectedTransaction.walletId,
        tagId: selectedTransaction.tagId,
        amount: selectedTransaction.amount,
        type: normalizedSelectedType,
        status: 'CONFIRMED',
        title: selectedTransaction.title,
        note: selectedTransaction.note,
        source: selectedTransaction.source,
        transactionDate: selectedTransaction.transactionDate,
      });
      setResult(current => current ? {
        ...current,
        createdTransactions: current.createdTransactions.map(item =>
          item.transaction.id === updated.id ? { ...item, transaction: { ...item.transaction, ...updated } } : item),
      } : current);
    } catch (confirmSubmitError) {
      const value = confirmSubmitError as { response?: { status?: number; data?: { message?: string } } };
      setConfirmError(
        value.response?.data?.message === 'INSUFFICIENT_BALANCE' || value.response?.status === 409
          ? 'Số dư ví không đủ để xác nhận giao dịch chi này.'
          : value.response?.data?.message || 'Không thể xác nhận giao dịch. Vui lòng thử lại.',
      );
    } finally {
      setConfirmingId('');
    }
  };

  return (
    <main className="ai-image-page">
      <nav className="ai-image-breadcrumb">
        <button onClick={() => onNavigate('dashboard')}>Trang chủ</button>
        <span>/</span>
        <button onClick={() => onNavigate('transactions')}>Giao dịch</button>
        <span>/</span>
        <b>Nhập ảnh bằng AI</b>
      </nav>

      <header className="ai-image-heading">
        <div className="ai-image-title">
          <i><ScanLine /></i>
          <div>
            <h1>Tạo giao dịch từ ảnh</h1>
            <p>Tải hóa đơn hoặc ảnh chuyển khoản, FlowFi AI sẽ đọc và tạo giao dịch nháp.</p>
          </div>
        </div>
        <label className="ai-image-wallet">
          <span>Lưu giao dịch vào ví</span>
          <div>
            <WalletCards />
            <select
              value={walletId}
              disabled={loadingWallets || processing}
              onChange={event => setWalletId(event.target.value)}
            >
              {!wallets.length && <option value="">Chưa có ví khả dụng</option>}
              {wallets.map(wallet => (
                <option key={wallet.id} value={wallet.id}>{wallet.name} ({wallet.currency})</option>
              ))}
            </select>
          </div>
        </label>
      </header>

      <section className="ai-image-layout">
        <article className="ai-upload-card">
          <div className="ai-card-heading">
            <div><ImagePlus /><span><strong>Ảnh giao dịch</strong><small>JPG, PNG hoặc WebP · tối đa 5 MB</small></span></div>
            {file && !processing && <button onClick={clearFile}><Trash2 /> Xóa ảnh</button>}
          </div>

          {!preview ? (
            <button
              type="button"
              className={`ai-dropzone ${dragging ? 'dragging' : ''}`}
              onClick={() => inputRef.current?.click()}
              onDragEnter={event => { event.preventDefault(); setDragging(true); }}
              onDragOver={event => event.preventDefault()}
              onDragLeave={event => { event.preventDefault(); setDragging(false); }}
              onDrop={event => {
                event.preventDefault();
                setDragging(false);
                selectFile(event.dataTransfer.files[0]);
              }}
            >
              <i><UploadCloud /></i>
              <strong>Kéo thả ảnh vào đây</strong>
              <span>hoặc <b>chọn ảnh từ thiết bị</b></span>
              <small>Ảnh rõ, đủ sáng và thấy toàn bộ số tiền sẽ cho kết quả tốt hơn.</small>
            </button>
          ) : (
            <div className="ai-image-preview">
              <button className="ai-preview-zoom" onClick={() => setImageExpanded(true)} title="Phóng to ảnh">
                <img src={preview} alt="Ảnh giao dịch đã chọn" />
                <span><ZoomIn /> Phóng to</span>
              </button>
              <div>
                <FileImage />
                <span><strong title={file?.name}>{file?.name}</strong><small>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''}</small></span>
                {!processing && <button onClick={() => inputRef.current?.click()}><RefreshCw /> Chọn ảnh khác</button>}
              </div>
            </div>
          )}
          <input
            ref={inputRef}
            hidden
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={event => selectFile(event.target.files?.[0])}
          />

          <div className="ai-upload-note">
            <LockKeyhole />
            <span><strong>Ảnh được xử lý an toàn</strong><small>FlowFi chỉ sử dụng ảnh để trích xuất thông tin giao dịch.</small></span>
          </div>

          {error && <div className="ai-image-error"><AlertCircle /><span>{error}</span></div>}

          {!allConfirmed && (
            <button
              className={`ai-analyze-button ${result ? 'reanalyze' : ''}`}
              disabled={!file || !walletId || processing || loadingWallets}
              onClick={() => void submit()}
            >
              {processing ? <LoaderCircle className="spinning" /> : <Sparkles />}
              {processing ? 'AI đang đọc hóa đơn...' : result ? 'Phân tích lại' : 'Phân tích ảnh'}
            </button>
          )}
        </article>

        <aside className="ai-result-card">
          {processing ? (
            <div className="ai-processing-state">
              <i><LoaderCircle className="spinning" /></i>
              <h2>Đang đọc ảnh</h2>
              <p>Thông thường quá trình này chỉ mất vài giây.</p>
              <ol>
                <li className="done"><Check /> Kiểm tra chất lượng ảnh</li>
                <li className="active"><ScanLine /> Nhận diện số tiền và nội dung</li>
                <li><Sparkles /> Tạo giao dịch nháp</li>
              </ol>
            </div>
          ) : result && selectedTransaction ? (
            <div className="ai-transaction-detail">
              <header>
                <span><i><ListChecks /></i><span><strong>Chi tiết giao dịch</strong><small>Kiểm tra trước khi xác nhận</small></span></span>
                <b className={selectedTransaction.status === 'CONFIRMED' ? 'confirmed' : 'draft'}>
                  {selectedTransaction.status === 'CONFIRMED' ? <Check /> : <Sparkles />}
                  {selectedTransaction.status === 'CONFIRMED' ? 'Đã xác nhận' : 'Bản nháp'}
                </b>
              </header>

              {created.length > 1 && (
                <div className="ai-transaction-tabs">
                  {created.map((item, index) => (
                    <button
                      key={item.transaction.id}
                      className={item.transaction.id === selectedTransaction.id ? 'active' : ''}
                      onClick={() => {
                        setSelectedTransactionId(item.transaction.id);
                        setConfirmError('');
                        setIsEditing(false);
                        setEditForm(null);
                        setNoteExpanded(false);
                      }}
                    >
                      <span>{index + 1}</span>
                      <b>{item.transaction.title}</b>
                      {item.transaction.status === 'CONFIRMED' && <Check />}
                    </button>
                  ))}
                </div>
              )}

              <div className="ai-detail-amount">
                <span className={normalizedSelectedType === 'INCOME' ? 'income' : 'expense'}>
                  {normalizedSelectedType === 'INCOME' ? 'Thu nhập' : 'Chi tiêu'}
                </span>
                <strong className={normalizedSelectedType === 'INCOME' ? 'income' : 'expense'}>
                  {normalizedSelectedType === 'INCOME' ? '+' : '−'}{money.format(Number(selectedTransaction.amount))} ₫
                </strong>
              </div>

              {isEditing && editForm ? (
                <div className="ai-edit-form">
                  <label className="wide"><span>Nội dung</span><input value={editForm.title} onChange={event => setEditForm({ ...editForm, title: event.target.value })} /></label>
                  <label><span>Số tiền</span><input min="1" type="number" value={editForm.amount} onChange={event => setEditForm({ ...editForm, amount: event.target.value })} /></label>
                  <label><span>Loại giao dịch</span><select value={editForm.type} onChange={event => setEditForm({ ...editForm, type: event.target.value as DraftForm['type'], tagId: '' })}><option value="EXPENSE">Chi tiêu</option><option value="INCOME">Thu nhập</option></select></label>
                  <label><span>Danh mục</span><select value={editForm.tagId} onChange={event => setEditForm({ ...editForm, tagId: event.target.value })}><option value="">Chọn danh mục</option>{editTags.map(tag => <option key={tag.id} value={tag.id}>{categoryLabel(tag.name)}</option>)}</select></label>
                  <label><span>Ví</span><select value={editForm.walletId} onChange={event => setEditForm({ ...editForm, walletId: event.target.value })}>{wallets.map(wallet => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select></label>
                  <label className="wide"><span>Ngày giao dịch</span><input type="date" value={editForm.transactionDate} onChange={event => setEditForm({ ...editForm, transactionDate: event.target.value })} /></label>
                </div>
              ) : (
                <dl className="ai-detail-list">
                  <div><dt><FileImage /> Nội dung</dt><dd>{selectedTransaction.title}</dd></div>
                  <div><dt><Sparkles /> Danh mục</dt><dd>{categoryLabel(selectedResult.tag.name)}</dd></div>
                  <div><dt><WalletCards /> Ví</dt><dd>{wallets.find(wallet => wallet.id === selectedTransaction.walletId)?.name || 'Ví đã chọn'}</dd></div>
                  <div><dt><CalendarDays /> Ngày giao dịch</dt><dd>{new Date(selectedTransaction.transactionDate).toLocaleDateString('vi-VN')}</dd></div>
                  <div><dt><CircleDollarSign /> Loại giao dịch</dt><dd>{normalizedSelectedType === 'INCOME' ? 'Thu nhập' : 'Chi tiêu'}</dd></div>
                  <div><dt><ScanLine /> Độ tin cậy AI</dt><dd><span className={`ai-confidence ${confidence < 70 ? 'low' : ''}`}>{confidence}%</span></dd></div>
                </dl>
              )}

              {confidence < 70 && !isEditing && (
                <div className="ai-confidence-warning"><AlertCircle /><span><strong>AI chưa chắc chắn về kết quả</strong><small>Hãy kiểm tra danh mục, số tiền và loại giao dịch trước khi xác nhận.</small></span></div>
              )}

              {selectedTransaction.note && (
                <div className={`ai-detail-note ${noteExpanded ? 'expanded' : ''}`}>
                  <span>Thông tin AI nhận diện</span>
                  <p>{selectedTransaction.note}</p>
                  <button onClick={() => setNoteExpanded(value => !value)}>{noteExpanded ? 'Thu gọn' : 'Xem nội dung đầy đủ'}</button>
                </div>
              )}

              {selectedTransaction.status !== 'CONFIRMED' && !isEditing && (
                <div className="ai-draft-warning">
                  <AlertCircle />
                  <span><strong>Giao dịch đang ở trạng thái bản nháp</strong><small>Hãy kiểm tra thông tin trước khi xác nhận. Sau đó trạng thái sẽ chuyển sang “Đã xác nhận”.</small></span>
                </div>
              )}

              {confirmError && <div className="ai-image-error"><AlertCircle /><span>{confirmError}</span></div>}

              {isEditing ? (
                <div className="ai-edit-actions">
                  <button onClick={() => { setIsEditing(false); setConfirmError(''); }} disabled={savingDraft}><X /> Hủy</button>
                  <button className="save" onClick={() => void saveDraft()} disabled={savingDraft}><Save />{savingDraft ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
                </div>
              ) : selectedTransaction.status === 'CONFIRMED' ? (
                <>
                  <button className="ai-view-transaction primary" onClick={() => onNavigate('transactions')}>Xem giao dịch <ArrowRight /></button>
                  <button className="ai-secondary-action" onClick={clearFile}>Tạo giao dịch mới</button>
                </>
              ) : (
                <>
                  <button className="ai-edit-button" onClick={beginEditing}><PencilLine /> Chỉnh sửa thông tin</button>
                  <button className="ai-confirm-button" disabled={Boolean(confirmingId)} onClick={() => void confirmTransaction()}>
                    {confirmingId ? <LoaderCircle className="spinning" /> : <Check />}
                    {confirmingId ? 'Đang xác nhận...' : 'Xác nhận giao dịch'}
                  </button>
                  <button className="ai-view-transaction" onClick={() => onNavigate('transactions')}>Xem danh sách giao dịch <ArrowRight /></button>
                  <button className="ai-secondary-action" onClick={clearFile}>Nhập ảnh khác</button>
                </>
              )}
            </div>
          ) : (
            <div className="ai-result-empty">
              <i><Sparkles /></i>
              <h2>Kết quả phân tích</h2>
              <p>Thông tin nhận diện từ ảnh sẽ xuất hiện tại đây.</p>
              <ul>
                <li><Check /> Nhận diện nhiều giao dịch trong một ảnh</li>
                <li><Check /> Tự động đề xuất danh mục</li>
                <li><Check /> Lưu dưới dạng nháp để kiểm tra</li>
              </ul>
              {selectedWallet && <small>Giao dịch sẽ được tạo trong ví <b>{selectedWallet.name}</b>.</small>}
            </div>
          )}
        </aside>
      </section>
      {imageExpanded && preview && (
        <div className="ai-image-lightbox" role="dialog" aria-modal="true" aria-label="Ảnh giao dịch phóng to">
          <button className="ai-lightbox-backdrop" onClick={() => setImageExpanded(false)} aria-label="Đóng ảnh" />
          <div>
            <button onClick={() => setImageExpanded(false)} aria-label="Đóng"><X /></button>
            <img src={preview} alt="Ảnh giao dịch phóng to" />
          </div>
        </div>
      )}
    </main>
  );
};
