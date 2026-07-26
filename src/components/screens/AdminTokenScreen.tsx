import React, { useState } from 'react';
import { ScreenId, TokenSession } from '../../types';
import { 
  Shield, Users, Key, FileText, Activity, AlertOctagon, 
  Search, Filter, Lock, RefreshCw, XCircle, ChevronLeft, ChevronRight, CheckCircle2 
} from 'lucide-react';

interface AdminTokenScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const AdminTokenScreen: React.FC<AdminTokenScreenProps> = ({ onNavigate }) => {
  const [search, setSearch] = useState('');
  const [sessions, setSessions] = useState<TokenSession[]>([
    {
      tokenId: 'tk_...7f82',
      accountId: 'acc_9821_fyl',
      lastUsed: '2 phút trước',
      usageCount: 4102,
      status: 'ĐANG HOẠT ĐỘNG',
      metadata: '192.168.***.*** (Chrome/Mac)',
      canRevoke: true,
    },
    {
      tokenId: 'tk_...a31d',
      accountId: 'acc_4402_adm',
      lastUsed: '14 phút trước',
      usageCount: 128,
      status: 'ĐÃ THU HỒI',
      metadata: '45.22.***.*** (Firefox/Win)',
      canRevoke: false,
    },
    {
      tokenId: 'tk_...9c18',
      accountId: 'acc_0019_sup',
      lastUsed: '1 giờ trước',
      usageCount: 892,
      status: 'ĐÃ HẾT HẠN',
      metadata: '82.11.***.*** (Safari/iOS)',
      canRevoke: false,
    },
    {
      tokenId: 'tk_...00e4',
      accountId: 'acc_7152_ext',
      lastUsed: 'Vừa xong',
      usageCount: 56,
      status: 'ĐANG HOẠT ĐỘNG',
      metadata: '182.***.***.*** (Python-Req)',
      canRevoke: true,
    },
    {
      tokenId: 'tk_...f2d3',
      accountId: 'acc_3391_fyl',
      lastUsed: '8 phút trước',
      usageCount: 2441,
      status: 'ĐANG HOẠT ĐỘNG',
      metadata: '192.168.***.*** (Chrome/Linux)',
      canRevoke: true,
    },
  ]);

  const handleRevoke = (id: string) => {
    setSessions(sessions.map(s => s.tokenId === id ? { ...s, status: 'ĐÃ THU HỒI', canRevoke: false } : s));
  };

  const handleRevokeAll = () => {
    if (confirm('Bạn có chắc chắn muốn thu hồi tất cả các phiên làm việc đang hoạt động?')) {
      setSessions(sessions.map(s => ({ ...s, status: 'ĐÃ THU HỒI', canRevoke: false })));
    }
  };

  const filtered = sessions.filter(s => 
    s.accountId.toLowerCase().includes(search.toLowerCase()) ||
    s.tokenId.toLowerCase().includes(search.toLowerCase()) ||
    s.metadata.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 font-sans flex">
      {/* Dark Admin Sidebar */}
      <aside className="w-64 bg-[#121824] border-r border-slate-800 flex flex-col shrink-0 hidden md:flex">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white leading-tight">Cổng Quản Trị</h2>
            <p className="text-[10px] text-slate-400">Kiểm Soát Hệ Thống</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-1.5 flex-1">
          <button
            onClick={() => onNavigate('admin-users')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Quản Lý Người Dùng</span>
          </button>

          <button
            onClick={() => onNavigate('admin-tokens')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600/90 shadow-lg shadow-blue-600/20 border border-blue-500/30"
          >
            <Key className="w-4 h-4 text-blue-300" />
            <span>Giám Sát Token</span>
          </button>

          <button
            onClick={() => onNavigate('admin-audit')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Nhật Ký Kiểm Tra</span>
          </button>
        </div>

        {/* System Status Footer */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Trạng Thái Hệ Thống: Hoạt động</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between gap-4 bg-[#121824]/60 backdrop-blur-md sticky top-0 z-30">
          <span className="font-bold text-sm text-slate-300">Cổng Quản Trị / Giám Sát Token</span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRevokeAll}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Thu Hồi Tất Cả Phiên</span>
            </button>
          </div>
        </header>

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight mb-1">Sử Dụng Token & Phiên</h1>
            <p className="text-xs text-slate-400">
              Giám sát thời gian thực các thông tin xác thực và các phiên đang hoạt động.
            </p>
          </div>

          {/* 4 Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#151B26] p-5 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-xs font-medium text-slate-400">Phiên Hoạt Động</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-black text-white">1,284</h2>
                <span className="text-xs font-bold text-emerald-400">+12%</span>
              </div>
            </div>

            <div className="bg-[#151B26] p-5 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-xs font-medium text-slate-400">Hết Hạn Hôm Nay</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-black text-white">432</h2>
                <span className="text-xs text-slate-500 font-medium">Trung bình: 398</span>
              </div>
            </div>

            <div className="bg-[#151B26] p-5 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-xs font-medium text-slate-400">Đã Thu Hồi (24 giờ)</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-black text-rose-400">89</h2>
                <span className="text-xs text-slate-500 font-medium">Thủ công: 12</span>
              </div>
            </div>

            <div className="bg-[#151B26] p-5 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-xs font-medium text-slate-400">TTL Trung Bình</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-black text-white">4.2h</h2>
                <span className="text-xs text-slate-500 font-medium">Mục tiêu: 4.8h</span>
              </div>
            </div>
          </div>

          {/* Live Monitoring Table */}
          <div className="bg-[#151B26] rounded-2xl border border-slate-800 p-6 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="font-bold text-base text-white">Luồng Giám Sát Trực Tiếp</h3>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm ID tài khoản hoặc IP..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#0B0E14] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                  />
                </div>
                <button className="p-2 bg-[#0B0E14] border border-slate-800 rounded-xl text-slate-400 hover:text-white">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B0E14]/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">ID Token</th>
                    <th className="py-3 px-4">ID Tài Khoản</th>
                    <th className="py-3 px-4">Sử Dụng Lần Cuối</th>
                    <th className="py-3 px-4">Số Lượt Dùng</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4">Siêu Dữ Liệu (Ẩn)</th>
                    <th className="py-3 px-4 text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                  {filtered.map((s) => (
                    <tr key={s.tokenId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4 text-blue-400 font-semibold">{s.tokenId}</td>
                      <td className="py-4 px-4 font-bold text-slate-200">{s.accountId}</td>
                      <td className="py-4 px-4 text-slate-400">{s.lastUsed}</td>
                      <td className="py-4 px-4 font-bold text-slate-200">{s.usageCount.toLocaleString('vi-VN')}</td>
                      <td className="py-4 px-4">
                        {s.status === 'ĐANG HOẠT ĐỘNG' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                            ĐANG HOẠT ĐỘNG
                          </span>
                        )}
                        {s.status === 'ĐÃ THU HỒI' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-950/80 text-rose-400 border border-rose-800">
                            ĐÃ THU HỒI
                          </span>
                        )}
                        {s.status === 'ĐÃ HẾT HẠN' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-800 text-slate-400 border border-slate-700">
                            ĐÃ HẾT HẠN
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-400 text-[11px]">{s.metadata}</td>
                      <td className="py-4 px-4 text-right">
                        {s.canRevoke ? (
                          <button
                            onClick={() => handleRevoke(s.tokenId)}
                            className="text-rose-400 font-bold hover:underline"
                          >
                            Thu Hồi Phiên
                          </button>
                        ) : (
                          <span className="text-slate-500 font-normal">
                            {s.status === 'ĐÃ THU HỒI' ? 'Đã Chốt' : 'Hệ Thống Đã Xóa'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-800">
              <span>Đang hiển thị 1-5 trong số 1,284 mục</span>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-[#0B0E14] border border-slate-800 rounded-lg text-slate-400 hover:text-white">Trước</button>
                <button className="px-3 py-1 bg-[#0B0E14] border border-slate-800 rounded-lg text-slate-400 hover:text-white">Sau</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
