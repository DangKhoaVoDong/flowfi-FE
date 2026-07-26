import React, { useState } from 'react';
import { ScreenId, AuditLog } from '../../types';
import { 
  Shield, Users, Key, FileText, Search, Filter, 
  Download, RefreshCw, ChevronLeft, ChevronRight, Activity 
} from 'lucide-react';

interface AdminAuditScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const AdminAuditScreen: React.FC<AdminAuditScreenProps> = ({ onNavigate }) => {
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<AuditLog[]>([
    {
      id: 'log-1',
      timestamp: '27-10-2023 14:22:05.122 UTC',
      adminId: 'ADN-9021',
      action: 'THU_HOI_TOKEN_CUONG_CHE',
      reason: 'Phát hiện lưu lượng truy cập bất thường từ IP lạ',
      correlationId: 'f5a2-4b31-99c1'
    },
    {
      id: 'log-2',
      timestamp: '27-10-2023 13:45:12.890 UTC',
      adminId: 'ADN-4412',
      action: 'NANG_CAP_HAN_MUC_TIN_DUNG',
      reason: 'Được phê duyệt theo hợp đồng doanh nghiệp lớn',
      correlationId: 'e91b-8c12-332a'
    },
    {
      id: 'log-3',
      timestamp: '27-10-2023 12:10:44.005 UTC',
      adminId: 'ADN-9021',
      action: 'LICH_CAP_NHAT_HE_THONG',
      reason: 'Đang triển khai bảo trì định kỳ cụm máy chủ',
      correlationId: 'a22c-5541-667d'
    },
    {
      id: 'log-4',
      timestamp: '27-10-2023 10:05:12.331 UTC',
      adminId: 'ADN-1002',
      action: 'KHOA_TAI_KHOAN',
      reason: 'Người dùng vi phạm điều khoản xác thực 2 yếu tố',
      correlationId: 'c88a-9921-bb32'
    }
  ]);

  const filteredLogs = logs.filter(l => 
    l.adminId.toLowerCase().includes(search.toLowerCase()) ||
    l.correlationId.toLowerCase().includes(search.toLowerCase()) ||
    l.reason.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 font-sans flex">
      {/* Dark Sidebar */}
      <aside className="w-64 bg-[#121824] border-r border-slate-800 flex flex-col shrink-0 hidden md:flex">
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white leading-tight">Cổng Quản Trị</h2>
            <p className="text-[10px] text-slate-400">Điều Khiển Hệ Thống</p>
          </div>
        </div>

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
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <Key className="w-4 h-4" />
            <span>Giám Sát Token</span>
          </button>

          <button
            onClick={() => onNavigate('admin-audit')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600/90 shadow-lg shadow-blue-600/20 border border-blue-500/30"
          >
            <FileText className="w-4 h-4 text-blue-300" />
            <span>Nhật Ký Kiểm Tra</span>
          </button>
        </div>

        {/* Status Box */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] space-y-1">
            <div className="flex items-center justify-between text-slate-400 font-semibold">
              <span>Trạng Thái</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-slate-500 font-mono text-[10px]">Cụm: US-East-1</p>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between gap-4 bg-[#121824]/60 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-lg text-white">Nhật Ký Kiểm Tra Hệ Thống</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> TRỰC TIẾP
            </span>
            <span className="text-xs text-slate-500 font-mono hidden sm:inline">Độ trễ: 14ms</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-200">QuảnTrị_Alpha</p>
              <p className="text-[10px] text-slate-500">Cấp Độ Bảo Mật 4</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
              QA
            </div>
          </div>
        </header>

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Search & Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo ID Admin hoặc ID Tương quan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#151B26] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                />
              </div>

              <button className="px-4 py-2.5 bg-[#151B26] border border-slate-800 hover:bg-slate-800 text-slate-300 font-medium text-xs rounded-xl flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span>Bộ Lọc</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span>Xuất Nhật Ký</span>
              </button>
              <button className="p-2.5 bg-[#151B26] border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Audit Log Table */}
          <div className="bg-[#151B26] rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B0E14]/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Thời Gian</th>
                    <th className="py-3 px-4">ID Quản Trị</th>
                    <th className="py-3 px-4">Hành Động</th>
                    <th className="py-3 px-4">Lý Do</th>
                    <th className="py-3 px-4">ID Tương Quan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono text-slate-300">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4 text-slate-400 text-[11px] whitespace-nowrap">{log.timestamp}</td>
                      <td className="py-4 px-4 font-bold text-blue-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        {log.adminId}
                      </td>
                      <td className="py-4 px-4 font-bold">
                        {log.action === 'THU_HOI_TOKEN_CUONG_CHE' && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] bg-rose-950/90 text-rose-300 border border-rose-800">
                            THU_HOI_TOKEN_CUONG_CHE
                          </span>
                        )}
                        {log.action === 'NANG_CAP_HAN_MUC_TIN_DUNG' && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] bg-amber-950/90 text-amber-300 border border-amber-800">
                            NANG_CAP_HAN_MUC_TIN_DUNG
                          </span>
                        )}
                        {log.action === 'LICH_CAP_NHAT_HE_THONG' && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] bg-blue-950/90 text-blue-300 border border-blue-800">
                            LICH_CAP_NHAT_HE_THONG
                          </span>
                        )}
                        {log.action === 'KHOA_TAI_KHOAN' && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                            KHOA_TAI_KHOAN
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-300 font-sans text-xs truncate max-w-xs">{log.reason}</td>
                      <td className="py-4 px-4 text-slate-400 text-[11px]">{log.correlationId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-800">
              <span>Đang hiển thị 1 đến 10 trong tổng số 2,492 bản ghi</span>
              <div className="flex items-center gap-1">
                <button className="p-1.5 bg-[#0B0E14] border border-slate-800 rounded-lg text-slate-400 hover:text-white">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="px-3 py-1 bg-blue-600 text-white font-bold rounded-lg text-xs">1</button>
                <button className="px-3 py-1 bg-[#0B0E14] border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs">2</button>
                <button className="px-3 py-1 bg-[#0B0E14] border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs">3</button>
                <button className="p-1.5 bg-[#0B0E14] border border-slate-800 rounded-lg text-slate-400 hover:text-white">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
