import React from 'react';
import { ScreenId } from '../types';
import { X, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface OriginalImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: ScreenId;
}

export const OriginalImageModal: React.FC<OriginalImageModalProps> = ({
  isOpen,
  onClose,
  currentScreen,
}) => {
  if (!isOpen) return null;

  // Description map for each screen
  const screenInfo: Record<ScreenId, { title: string; desc: string }> = {
    'landing': {
      title: 'FlowFi - Hướng dẫn & Đăng nhập',
      desc: 'Màn hình trang chủ giới thiệu tính năng, lộ trình 3 bước và biểu mẫu đăng nhập FlowFi.'
    },
    'dashboard': {
      title: 'FlowFi - Dashboard Người dùng (VNĐ)',
      desc: 'Bảng điều khiển tổng quan số dư 124.592.000đ, thu nhập vs chi tiêu, ngân sách hàng tháng và giao dịch gần đây.'
    },
    'transactions': {
      title: 'FlowFi - Quản lý Ví & Giao dịch (VNĐ)',
      desc: 'Quản lý tính thanh khoản với các thẻ Chase Platinum, Brex Corporate, Coinbase Prime và bộ lọc lịch sử giao dịch nâng cao.'
    },
    'ai-input': {
      title: 'FlowFi - Xử lý và Xác nhận Giao dịch AI (VNĐ)',
      desc: 'Gửi hóa đơn kéo thả, hàng chờ xử lý OCR/phân tích và bảng xác nhận kết quả trích xuất từ FlowAI (98% độ tin cậy).'
    },
    'ai-image': {
      title: 'FlowFi - Nhập ảnh giao dịch bằng AI',
      desc: 'Tải ảnh hóa đơn hoặc chuyển khoản để AI nhận diện và tạo giao dịch nháp.'
    },
    'budget': {
      title: 'FlowFi - Quản lý Ngân sách 12 Tháng (VNĐ)',
      desc: 'Lộ trình ngân sách 12 tháng với các thẻ theo dõi tiến độ chi tiêu hàng tháng (Vượt hạn mức, An toàn, Hiện tại, Lập kế hoạch).'
    },
    'debt-reminders': {
      title: 'FlowFi - Nhắc trả nợ (VNĐ)',
      desc: 'Theo dõi khoản nợ, kỳ trả, ngày đến hạn và thao tác đánh dấu đã trả hoặc bỏ qua từng kỳ.'
    },
    wallets: { title: 'FlowFi - Ví', desc: 'Quản lý các nguồn tiền và số dư theo loại tiền tệ.' },
    goals: { title: 'FlowFi - Mục tiêu tài chính', desc: 'Theo dõi tiến độ các mục tiêu tài chính cá nhân.' },
    reports: { title: 'FlowFi - Báo cáo & Insights', desc: 'Phân tích xu hướng thu, chi và dòng tiền.' },
    notifications: { title: 'FlowFi - Thông báo', desc: 'Trung tâm cảnh báo và cập nhật tài chính.' },
    settings: { title: 'FlowFi - Cài đặt', desc: 'Quản lý hồ sơ và tùy chọn cá nhân.' },
    'admin-tokens': {
      title: 'FlowFi Admin - Giám sát Token & Session (VNĐ)',
      desc: 'Cổng quản trị tối màu giám sát phiên hoạt động, TTL trung bình, thu hồi token trực tiếp và luồng giám sát thời gian thực.'
    },
    'admin-users': {
      title: 'FlowFi Admin - Quản lý Người dùng (VNĐ)',
      desc: 'Danh sách tài khoản người dùng, phân quyền quản trị viên, trạng thái hoạt động và các chỉ số cảnh báo bảo mật.'
    },
    'admin-audit': {
      title: 'FlowFi Admin - Nhật ký Hệ thống (VNĐ)',
      desc: 'Nhật ký kiểm tra hệ thống thời gian thực với độ trễ 14ms, mã tương quan, mã quản trị và bộ lọc bản ghi thao tác.'
    },
    forbidden: {
      title: 'Không có quyền truy cập',
      desc: 'Tài khoản hiện tại không có quyền truy cập khu vực quản trị.'
    },
  };

  const current = screenInfo[currentScreen];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-500/40">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{current.title}</h3>
              <p className="text-xs text-slate-400">{current.desc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Info */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-4 bg-indigo-950/40 border border-indigo-800/50 rounded-xl text-sm text-indigo-200">
            <p className="font-semibold mb-1 text-indigo-300">✨ Thiết kế Pixel-Perfect chuẩn Việt Nam (VNĐ):</p>
            <p className="text-xs leading-relaxed text-indigo-200/90">
              Giao diện bên dưới là bản tái hiện lại nguyên mẫu hình thiết kế theo đúng bố cục, màu sắc, phông chữ và chỉ số dữ liệu tài chính. Bạn có thể tương tác trực tiếp trên giao diện thực tế phía sau.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>FlowFi Screen Reference</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Quay lại trải nghiệm
          </button>
        </div>
      </div>
    </div>
  );
};
