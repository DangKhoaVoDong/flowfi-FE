import React, { useState } from 'react';
import { ScreenId } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getPostAuthScreen } from '../../services/adminAuth';
import { 
  Sparkles, Wallet, Cpu, Calendar, 
  CheckCircle2, ChevronRight, Loader2, TrendingUp, Bell, Download, Smartphone
} from 'lucide-react';

interface LandingScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onNavigate }) => {
  const { login, register, isLoading, error, clearError } = useAuth();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(false); // Default to register mode
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');

    // Validation
    if (!email || !password) {
      setLocalError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (!isLoginMode) {
      // Register mode
      if (password !== confirmPassword) {
        setLocalError('Mật khẩu xác nhận không khớp');
        return;
      }
      if (password.length < 6) {
        setLocalError('Mật khẩu phải có ít nhất 6 ký tự');
        return;
      }
      if (!fullName.trim()) {
        setLocalError('Vui lòng nhập họ tên');
        return;
      }

      try {
        await register({ email, password, fullName });
        onNavigate(getPostAuthScreen());
      } catch {
        // Error handled by context
      }
    } else {
      // Login mode
      try {
        await login({ email, password });
        onNavigate(getPostAuthScreen());
      } catch {
        // Error handled by context
      }
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col">
      {/* Minimal Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20">
              F
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">FLOWFI</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-6 max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-12 items-center flex-1">
        {/* Left Column Text */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Cập nhật: AI Phân tích chi tiêu mới</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Làm chủ tài chính <br />
            <span className="text-blue-600 italic font-serif">với FlowFi</span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl">
            Nền tảng quản lý tài chính cá nhân toàn diện. Theo dõi thu nhập, chi tiêu và lập kế hoạch ngân sách thông minh giúp bạn đạt được mục tiêu tự do tài chính nhanh hơn.
          </p>

          {/* Social Proof */}
          <div className="pt-2 flex items-center gap-4">
            <div className="flex -space-x-2 overflow-hidden">
              <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" alt="User" />
              <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" alt="User" />
              <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" alt="User" />
              <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center ring-2 ring-white">
                +5k
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              <span className="font-bold text-slate-900">50,000+</span> người Việt đã tin dùng
            </p>
          </div>
        </div>

        {/* Right Column Register Card */}
        <div className="lg:col-span-5">
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50">
            {/* Toggle Login/Register */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              <button
                onClick={() => { setIsLoginMode(true); clearError(); setLocalError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isLoginMode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                Đăng nhập
              </button>
              <button
                onClick={() => { setIsLoginMode(false); clearError(); setLocalError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  !isLoginMode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                Đăng ký
              </button>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                {isLoginMode ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
              </h2>
              <p className="text-xs text-slate-500">
                {isLoginMode ? 'Đăng nhập để tiếp tục' : 'Đăng ký để bắt đầu'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {displayError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                  {displayError}
                </div>
              )}

              {/* Full Name - Register only */}
              {!isLoginMode && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Họ và tên</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-slate-50/50"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-slate-50/50"
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Mật khẩu</label>
                  {isLoginMode && (
                    <a href="#forgot" className="text-xs font-medium text-blue-600 hover:underline">Quên mật khẩu?</a>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-slate-50/50"
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Confirm Password - Register only */}
              {!isLoginMode && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-slate-50/50"
                    placeholder="••••••••"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <span>{isLoginMode ? 'Đăng nhập' : 'Đăng ký'}</span>
                )}
              </button>
            </form>

            {/* Terms */}
            {!isLoginMode && (
              <p className="text-[10px] text-slate-400 text-center mt-4">
                Bằng việc đăng ký, bạn đồng ý với{' '}
                <a href="#terms" className="text-blue-600 hover:underline">Điều khoản dịch vụ</a>
                {' '}và{' '}
                <a href="#privacy" className="text-blue-600 hover:underline">Chính sách bảo mật</a>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-16 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Mọi công cụ bạn cần</h2>
          <p className="text-slate-500 text-sm">Giải pháp tài chính số hóa dành riêng cho thị trường Việt Nam</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Báo cáo & Phân tích chuyên sâu</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Xem biểu đồ trực quan về dòng tiền hàng tháng, phân loại chi tiêu tự động giúp bạn nhận diện thói quen tài chính và tối ưu hóa ngân sách cá nhân.
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
              <div className="w-32 bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-[70%]" />
              </div>
              <span>+15.2% tiết kiệm</span>
            </div>
          </div>

          {/* Card 2 - Blue */}
          <div className="bg-blue-600 text-white p-6 rounded-3xl shadow-lg shadow-blue-500/20 flex flex-col justify-between relative">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center mb-4 backdrop-blur-sm">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">Thông báo thông minh</h3>
              <p className="text-blue-100 text-sm leading-relaxed mb-6">
                Cảnh báo khi vượt ngân sách hoặc đến hạn thanh toán hóa đơn điện, nước, Internet ngay lập tức qua ứng dụng.
              </p>
            </div>
            <div className="bg-blue-700/80 p-3.5 rounded-xl border border-blue-500/50 text-xs text-white backdrop-blur-sm">
              <p className="font-bold uppercase tracking-wider text-[10px] text-blue-200 mb-0.5">CẢNH BÁO NGÂN SÁCH</p>
              <p className="font-semibold">Bạn đã dùng 90% ngân sách ăn uống tháng này!</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">AI Advisor</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Gợi ý lộ trình tiết kiệm và đầu tư thông minh dựa trên phân tích thu nhập và chi tiêu thực tế hàng ngày của bạn tại Việt Nam.
            </p>
          </div>
        </div>
      </section>

      {/* Roadmap 3 Steps */}
      <section id="guide" className="py-16 px-6 max-w-7xl mx-auto w-full bg-slate-100/60 rounded-3xl my-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Lộ trình 3 bước đến tự do tài chính</h2>
            <p className="text-slate-500 text-sm max-w-xl">
              FlowFi đơn giản hóa việc quản lý tiền bạc phức tạp để bạn tập trung kiến tạo cuộc sống mơ ước.
            </p>
          </div>
          <a href="#doc" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
            Xem tài liệu chi tiết <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Kết nối & Quản lý Ví</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Rất đơn giản bằng việc tạo các ví riêng biệt (Ví tiền mặt, Ví ngân hàng, Ví tiết kiệm). Phân loại thẻ và thiết lập số dư ban đầu chỉ trong vài phút.
            </p>
            <div className="pt-2 text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> <span>Tạo ví không giới hạn</span></div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> <span>Bảo mật chuẩn ngân hàng</span></div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Nhập liệu AI thông minh</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Quên đi việc nhập tay nhàm chán. Sử dụng công nghệ OCR tiên tiến để quét hóa đơn, AI sẽ tự động nhận diện số tiền, ngày tháng và hạng mục chính xác.
            </p>
            <div className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50 p-2">
              <img
                src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop"
                alt="AI Receipt Scan"
                className="w-full h-24 object-cover rounded-lg"
              />
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Lập kế hoạch 12 tháng</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Thiết lập ngân sách dài hạn. Hệ thống sẽ dự báo số dư tương lai dựa trên chi tiêu định kỳ, giúp bạn lên kế hoạch cho các chuyến du lịch hay mua sắm lớn.
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Tiết kiệm hưu trí</span>
                <span className="text-blue-600">75%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-[75%]" />
              </div>
              <p className="text-[10px] text-slate-400">Bạn đang đi đúng lộ trình đề ra. Tiếp tục nhé!</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-6 max-w-7xl mx-auto w-full my-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-10 text-center shadow-xl shadow-blue-500/20 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Sẵn sàng để "Flow" cùng tài chính?
          </h2>
          <p className="text-blue-100 text-sm max-w-xl mx-auto">
            Tham gia cùng 50,000+ người dùng thông thái và bắt đầu hành trình quản lý tiền bạc chuyên nghiệp ngay hôm nay.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-xl text-sm transition-all shadow-md"
            >
              Bắt đầu ngay miễn phí
            </button>
            <button className="px-6 py-3 bg-blue-700/80 hover:bg-blue-700 border border-blue-400/30 text-white font-medium rounded-xl text-sm transition-all">
              Liên hệ tư vấn
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-xs text-slate-500">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">F</div>
              <span className="font-extrabold text-slate-900 text-base">FLOWFI</span>
            </div>
            <p className="leading-relaxed text-slate-500">
              Giải pháp công nghệ tài chính hàng đầu giúp người Việt làm chủ dòng tiền và kiến tạo tương lai tài chính vững vàng.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Khám phá</h4>
            <ul className="space-y-2">
              <li><a href="#about" className="hover:text-blue-600">Về chúng tôi</a></li>
              <li><a href="#ai" className="hover:text-blue-600">Tính năng AI</a></li>
              <li><a href="#pricing" className="hover:text-blue-600">Biểu phí dịch vụ</a></li>
              <li><a href="#banks" className="hover:text-blue-600">Kết nối ngân hàng</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Hỗ trợ</h4>
            <ul className="space-y-2">
              <li><a href="#help" className="hover:text-blue-600">Trung tâm trợ giúp</a></li>
              <li><a href="#community" className="hover:text-blue-600">Cộng đồng FlowFi</a></li>
              <li><a href="#bug" className="hover:text-blue-600">Báo cáo lỗi</a></li>
              <li><a href="#contact" className="hover:text-blue-600">Liên hệ 24/7</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Ứng dụng di động</h4>
            <p className="mb-3 text-slate-500">Tải ngay ứng dụng FlowFi để quản lý tài chính mọi lúc mọi nơi.</p>
            <div className="flex flex-col gap-2">
              <button className="px-3 py-2 bg-slate-900 text-white rounded-xl text-[11px] font-semibold flex items-center gap-2 hover:bg-slate-800">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span>App Store</span>
              </button>
              <button className="px-3 py-2 bg-slate-900 text-white rounded-xl text-[11px] font-semibold flex items-center gap-2 hover:bg-slate-800">
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Google Play</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-4">
          <p>&copy; 2024 FlowFi Financial Platform. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#privacy" className="hover:underline">Chính sách bảo mật</a>
            <a href="#terms" className="hover:underline">Điều khoản dịch vụ</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
