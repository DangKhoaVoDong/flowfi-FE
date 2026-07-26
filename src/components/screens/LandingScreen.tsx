import React, { useState } from 'react';
import { ScreenId } from '../../types';
import { 
  Bell, ArrowRight, Sparkles, Wallet, Cpu, Calendar, ShieldCheck, 
  CheckCircle2, Building2, TrendingUp, ChevronRight, Download, Smartphone 
} from 'lucide-react';

interface LandingScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('example@email.com');
  const [password, setPassword] = useState('••••••••');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
    setTimeout(() => {
      onNavigate('dashboard');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20">
              F
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">FLOWFI</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#home" className="text-blue-600 font-semibold">Trang chủ</a>
            <a href="#guide" className="hover:text-slate-900 transition-colors">Hướng dẫn</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">Tính năng</a>
          </nav>

          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full"></span>
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-xl transition-all shadow-sm shadow-blue-200"
            >
              Bắt đầu ngay
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-12 items-center">
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

        {/* Right Column Login Card */}
        <div className="lg:col-span-5">
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Đăng nhập</h2>
              <p className="text-xs text-slate-500">Bắt đầu hành trình tài chính của bạn</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-slate-50/50"
                  placeholder="example@email.com"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Mật khẩu</label>
                  <a href="#forgot" className="text-xs font-medium text-blue-600 hover:underline">Quên mật khẩu?</a>
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

              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                {isLoggedIn ? 'Đang chuyển hướng...' : 'Đăng nhập'}
              </button>
            </form>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <span className="relative bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">HOẶC</span>
            </div>

            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Đăng nhập với Google</span>
            </button>
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
