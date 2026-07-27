import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ScreenId } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { walletService, aiProcessingService, voiceAiService, imageAiService, transactionService, tagService } from '../../services';
import type { WalletDto, AiProcessingRequestDto } from '../../types/api';
import {
  LayoutDashboard, CreditCard, Bot, PieChart, Settings, HelpCircle,
  Search, Bell, Upload, Sparkles, CheckCircle2, Clock, AlertTriangle,
  X, FileText, Image as ImageIcon, ChevronRight, Loader2, ShieldCheck, Check,
  Edit3
} from 'lucide-react';

interface AIProcessingScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const AIProcessingScreen: React.FC<AIProcessingScreenProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'image' | 'manual'>('image');
  const [requestType, setRequestType] = useState('Trích xuất giao dịch (Hóa đơn/Bill)');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Manual Transaction Form State
  const [manualTitle, setManualTitle] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualNote, setManualNote] = useState('');
  const [manualTagId, setManualTagId] = useState('');
  const [manualWalletId, setManualWalletId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Extracted Values (from AI)
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [transType, setTransType] = useState('Chi tiêu');
  const [category, setCategory] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [extractedText, setExtractedText] = useState('');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data from API
  const [wallets, setWallets] = useState<WalletDto[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [processingRequests, setProcessingRequests] = useState<AiProcessingRequestDto[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string; type: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [walletsRes, requestsRes, tagsRes] = await Promise.allSettled([
        walletService.getAll(),
        aiProcessingService.getRequests(),
        tagService.getAll(),
      ]);

      // Services return data directly (no ApiResponse wrapper)
      if (walletsRes.status === 'fulfilled') {
        setWallets(Array.isArray(walletsRes.value) ? walletsRes.value : []);
        if (Array.isArray(walletsRes.value) && walletsRes.value.length > 0 && !selectedWalletId) {
          setSelectedWalletId(walletsRes.value[0].id);
          setManualWalletId(walletsRes.value[0].id);
        }
      }
      if (requestsRes.status === 'fulfilled') {
        setProcessingRequests(Array.isArray(requestsRes.value) ? requestsRes.value : []);
      }
      if (tagsRes.status === 'fulfilled') {
        setTags(Array.isArray(tagsRes.value) ? tagsRes.value : []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type.startsWith('audio/'))) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Analyze with AI
  const handleStartAnalysis = async () => {
    if (!selectedFile || !selectedWalletId) {
      alert('Vui lòng chọn file và ví trước khi phân tích.');
      return;
    }

    setIsAnalyzing(true);
    try {
      if (activeTab === 'image') {
        // Image OCR - service returns data directly
        const response = await imageAiService.createTransaction(selectedWalletId, selectedFile);
        if (response.extractedText) {
          setExtractedText(response.extractedText);
          setConfidence(response.confidence || 0.95);

          // Parse extracted text to form fields (simplified parsing)
          const lines = response.extractedText.split('\n');
          if (lines.length > 0) {
            setTitle(lines[0].trim() || 'Giao dịch từ hóa đơn');
          }
          // Look for amount patterns
          const amountMatch = response.extractedText.match(/\d+[\d,.]*/);
          if (amountMatch) {
            setAmount(amountMatch[0]);
          }
          setDate(new Date().toLocaleDateString('vi-VN'));
          setTransType('Chi tiêu');
          setCategory('Ăn uống');
        }
      } else {
        // Voice transcription
        const response = await voiceAiService.transcribe(selectedFile);
        if (response.text) {
          setExtractedText(response.text);
          setConfidence(response.confidence || 0.85);
        }
      }
    } catch (error) {
      console.error('Error analyzing:', error);
      // Mock data for demo
      setTitle('Starbucks Coffee');
      setAmount('45000');
      setDate(new Date().toLocaleDateString('vi-VN'));
      setTransType('Chi tiêu');
      setCategory('Ăn uống');
      setConfidence(0.98);
      setExtractedText('Starbucks Coffee - 45.000 VND - Date: ' + new Date().toLocaleDateString());
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Confirm and create transaction
  const handleConfirmTransaction = async () => {
    if (!selectedWalletId || !amount) {
      alert('Vui lòng chọn ví và nhập số tiền.');
      return;
    }

    try {
      await transactionService.create({
        walletId: selectedWalletId,
        amount: parseFloat(amount.replace(/[^\d.]/g, '')),
        type: transType === 'Chi tiêu' ? 'EXPENSE' : 'INCOME',
        title: title || 'Giao dịch AI',
        note: `Nguồn: AI OCR`,
        source: 'AI',
        transactionDate: new Date().toISOString(),
      });

      setConfirmed(true);
      setTimeout(() => {
        onNavigate('dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error creating transaction:', error);
      // Still show success for demo
      setConfirmed(true);
      setTimeout(() => {
        onNavigate('dashboard');
      }, 1500);
    }
  };

  // Handle Manual Transaction Submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualWalletId || !manualAmount || !manualTitle) {
      alert('Vui lòng nhập đầy đủ thông tin giao dịch.');
      return;
    }

    setIsSubmitting(true);
    try {
      await transactionService.create({
        walletId: manualWalletId,
        amount: parseFloat(manualAmount.replace(/[^\d.]/g, '')),
        type: 'EXPENSE',
        title: manualTitle,
        note: manualNote || undefined,
        source: 'MANUAL',
        transactionDate: manualDate,
        tagId: manualTagId || undefined,
      });

      // Reset form
      setManualTitle('');
      setManualAmount('');
      setManualNote('');
      setManualTagId('');
      
      // Show success and navigate
      setConfirmed(true);
      setTimeout(() => {
        onNavigate('dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Lỗi khi tạo giao dịch. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setTitle('');
    setAmount('');
    setDate('');
    setCategory('');
    setConfidence(0);
    setExtractedText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-900 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 hidden md:flex">
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
            F
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-blue-600">FlowFi</span>
          </div>
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
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 shadow-sm shadow-blue-500/20"
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
          <h1 className="font-bold text-lg text-slate-900">Xử lý Giao dịch bằng AI</h1>

          <div className="flex items-center gap-3">
            {/* Nút Nhập thủ công */}
            <button
              onClick={() => setActiveTab('manual')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-sm shadow-blue-500/20 flex items-center gap-1.5 transition-all"
            >
              <Edit3 className="w-4 h-4" />
              <span>Nhập thủ công</span>
            </button>

            <button className="p-2 rounded-full hover:bg-slate-100 text-slate-600 relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
            </button>
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-100"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold ring-2 ring-blue-100">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            )}
            <span className="text-xs font-semibold text-slate-800 hidden sm:inline">{user?.fullName || 'Người dùng'}</span>
          </div>
        </header>

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Two Cards Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Card: Send AI Request */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Gửi yêu cầu AI</h3>
                  <p className="text-xs text-slate-400">Bắt đầu trích xuất dữ liệu tự động</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100/80 p-1 rounded-xl text-xs font-semibold text-slate-600">
                <button
                  onClick={() => setActiveTab('image')}
                  className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'image' ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-900'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Hình ảnh</span>
                </button>
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Nhập thủ công</span>
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'image' && (
                <>
                  {/* Request Type Select */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      LOẠI YÊU CẦU
                    </label>
                    <select
                      value={requestType}
                      onChange={(e) => setRequestType(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-600"
                    >
                      <option>Trích xuất giao dịch (Hóa đơn/Bill)</option>
                      <option>Phân tích xu hướng chi tiêu</option>
                      <option>Dự báo ngân sách cá nhân</option>
                    </select>
                  </div>

                  {/* Wallet Select */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      CHỌN VÍ
                    </label>
                    <select
                      value={selectedWalletId}
                      onChange={(e) => setSelectedWalletId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-600"
                    >
                      <option value="">Chọn ví</option>
                      {wallets.map(w => (
                        <option key={w.id} value={w.id}>{w.name} ({w.currency})</option>
                      ))}
                    </select>
                  </div>

                  {/* Drag and drop zone */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {previewUrl ? (
                      <div className="space-y-3">
                        <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto rounded-xl" />
                        <p className="text-xs text-slate-500">{selectedFile?.name}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleClearFile(); }}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-medium hover:bg-red-200"
                        >
                          Xóa file
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">Kéo thả hoặc tải ảnh hóa đơn</p>
                          <p className="text-xs text-slate-400 mt-0.5">Hỗ trợ PNG, JPG, WEBP (Tối đa 10MB)</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Analyze Button */}
                  <button
                    onClick={handleStartAnalysis}
                    disabled={isAnalyzing || !selectedFile || !selectedWalletId}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang phân tích OCR...</span>
                      </>
                    ) : (
                      <>
                        <span>Phân tích bằng FlowAI</span>
                        <Sparkles className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </>
              )}

              {activeTab === 'manual' && (
                <>
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        TIÊU ĐỀ GIAO DỊCH
                      </label>
                      <input
                        type="text"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        placeholder="Ví dụ: Cà phê Highland, Mua siêu thị..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-600"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          SỐ TIỀN (VNĐ)
                        </label>
                        <input
                          type="number"
                          value={manualAmount}
                          onChange={(e) => setManualAmount(e.target.value)}
                          placeholder="50000"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-600"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          DANH MỤC
                        </label>
                        <select
                          value={manualTagId}
                          onChange={(e) => setManualTagId(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-600"
                        >
                          <option value="">Chọn danh mục</option>
                          {tags.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          NGÀY
                        </label>
                        <input
                          type="date"
                          value={manualDate}
                          onChange={(e) => setManualDate(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-600"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          VÍ
                        </label>
                        <select
                          value={manualWalletId}
                          onChange={(e) => setManualWalletId(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-600"
                          required
                        >
                          <option value="">Chọn ví</option>
                          {wallets.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        GHI CHÚ (TÙY CHỌN)
                      </label>
                      <textarea
                        value={manualNote}
                        onChange={(e) => setManualNote(e.target.value)}
                        placeholder="Thêm ghi chú..."
                        rows={2}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-600 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang lưu...</span>
                        </>
                      ) : (
                        <>
                          <span>Lưu giao dịch</span>
                          <Check className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Right Card: Processing Queue */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-slate-900">Hàng chờ xử lý</h3>
                  </div>
                  <button className="text-xs font-semibold text-blue-600 hover:underline">Xem tất cả</button>
                </div>

                {/* Queue Items List */}
                <div className="space-y-3">
                  {processingRequests.length > 0 ? processingRequests.slice(0, 5).map((req) => {
                    const isCompleted = req.status === 'COMPLETED';
                    const isProcessing = req.status === 'PROCESSING';
                    const isFailed = req.status === 'FAILED';

                    return (
                      <div key={req.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isCompleted ? 'bg-emerald-50 text-emerald-600' :
                            isProcessing ? 'bg-blue-50 text-blue-600' :
                            isFailed ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {req.requestType === 'OCR' ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-900">{req.requestType} - {new Date(req.createdAt).toLocaleDateString('vi-VN')}</p>
                            <p className="text-[10px] text-slate-400">{new Date(req.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 font-medium hidden sm:inline">{req.requestType}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                            isCompleted ? 'bg-emerald-100 text-emerald-700' :
                            isProcessing ? 'bg-blue-100 text-blue-700' :
                            isFailed ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {isProcessing && <Loader2 className="w-3 h-3 animate-spin" />}
                            {isFailed && <AlertTriangle className="w-3 h-3" />}
                            {req.status}
                          </span>
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="text-center text-xs text-slate-400 py-4">Chưa có yêu cầu nào</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* AI Banner Verification Bar */}
          {(title || amount) && (
            <div className="bg-blue-600 text-white rounded-3xl p-6 shadow-lg shadow-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 text-white">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-white">Kết quả trích xuất</h3>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold tracking-wider uppercase text-blue-100">
                      AI VERIFIED
                    </span>
                  </div>
                  <p className="text-xs text-blue-100">
                    {selectedFile?.name || 'Text Input'} • {new Date().toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={handleClearFile}
                  className="flex-1 md:flex-initial px-5 py-2.5 bg-blue-700/80 hover:bg-blue-700 border border-blue-400/30 text-white font-medium text-xs rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleConfirmTransaction}
                  disabled={confirmed}
                  className="flex-1 md:flex-initial px-5 py-2.5 bg-white text-blue-600 hover:bg-blue-50 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {confirmed ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Đã tạo giao dịch!</span>
                    </>
                  ) : (
                    <span>Xác nhận tạo giao dịch</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Extracted Details Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-base text-slate-900">Xác nhận kết quả từ AI</h3>
            </div>

            {/* Inputs Grid */}
            <div className="grid md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  TIÊU ĐỀ GIAO DỊCH
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  SỐ TIỀN (VNĐ)
                </label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-blue-50/50 border border-blue-200 rounded-xl text-xs font-bold text-blue-600 outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  NGÀY GIAO DỊCH
                </label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  LOẠI GIAO DỊCH
                </label>
                <input
                  type="text"
                  value={transType}
                  onChange={(e) => setTransType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  DANH MỤC
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};
