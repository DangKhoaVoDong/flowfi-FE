import React, { useState } from 'react';
import { ScreenId, AdminUser } from '../../types';
import { 
  Shield, Users, Key, FileText, Search, Plus, UserCheck, 
  UserX, Edit, Eye, Trash2, Lock, AlertTriangle, ChevronLeft, ChevronRight, Check
} from 'lucide-react';

interface AdminUserScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const AdminUserScreen: React.FC<AdminUserScreenProps> = ({ onNavigate }) => {
  const [searchEmail, setSearchEmail] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tất cả vai trò');
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');
  const [showAddModal, setShowAddModal] = useState(false);

  const [users, setUsers] = useState<AdminUser[]>([
    {
      id: 'u-1',
      email: 'alex.s@flowfi.com',
      initials: 'AS',
      role: 'Quản trị viên',
      status: 'HOẠT ĐỘNG',
      joinDate: '12-11-2023',
      avatarColor: 'bg-indigo-600',
    },
    {
      id: 'u-2',
      email: 'ben.j@flowfi.com',
      initials: 'BJ',
      role: 'Người dùng',
      status: 'ĐANG CHỜ',
      joinDate: '05-01-2024',
      avatarColor: 'bg-emerald-600',
    },
    {
      id: 'u-3',
      email: 'claire.l@flowfi.com',
      initials: 'CL',
      role: 'Người dùng',
      status: 'VÔ HIỆU HÓA',
      joinDate: '22-08-2023',
      avatarColor: 'bg-rose-600',
    },
  ]);

  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'Quản trị viên' | 'Người dùng'>('Người dùng');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    const initials = newEmail.substring(0, 2).toUpperCase();
    const newUser: AdminUser = {
      id: `u-${Date.now()}`,
      email: newEmail,
      initials,
      role: newRole,
      status: 'HOẠT ĐỘNG',
      joinDate: new Date().toLocaleDateString('vi-VN'),
      avatarColor: 'bg-blue-600',
    };

    setUsers([...users, newUser]);
    setNewEmail('');
    setShowAddModal(false);
  };

  const filteredUsers = users.filter((u) => {
    const matchEmail = u.email.toLowerCase().includes(searchEmail.toLowerCase());
    const matchRole = roleFilter === 'Tất cả vai trò' || u.role === roleFilter;
    const matchStatus = statusFilter === 'Tất cả trạng thái' || u.status === statusFilter;
    return matchEmail && matchRole && matchStatus;
  });

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
            <p className="text-[10px] text-slate-400">Kiểm Soát Hệ Thống</p>
          </div>
        </div>

        <div className="p-4 space-y-1.5 flex-1">
          <button
            onClick={() => onNavigate('admin-users')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600/90 shadow-lg shadow-blue-600/20 border border-blue-500/30"
          >
            <Users className="w-4 h-4 text-blue-300" />
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
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Nhật Ký Kiểm Tra</span>
          </button>
        </div>

        <div className="p-4 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Trạng Thái Hệ Thống: Hoạt động</span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between gap-4 bg-[#121824]/60 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-lg text-white">Tài khoản Người dùng</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Đã đồng bộ
            </span>
          </div>
        </header>

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Actions Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#151B26] p-4 rounded-2xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#0B0E14] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-[#0B0E14] border border-slate-800 rounded-xl text-xs text-slate-300 outline-none cursor-pointer"
              >
                <option>Tất cả vai trò</option>
                <option>Quản trị viên</option>
                <option>Người dùng</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-[#0B0E14] border border-slate-800 rounded-xl text-xs text-slate-300 outline-none cursor-pointer"
              >
                <option>Tất cả trạng thái</option>
                <option>HOẠT ĐỘNG</option>
                <option>ĐANG CHỜ</option>
                <option>VÔ HIỆU HÓA</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>THÊM NGƯỜI DÙNG</span>
            </button>
          </div>

          {/* User Table */}
          <div className="bg-[#151B26] rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B0E14]/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">ĐỊA CHỈ EMAIL</th>
                    <th className="py-3 px-4">VAI TRÒ</th>
                    <th className="py-3 px-4">TRẠNG THÁI</th>
                    <th className="py-3 px-4">NGÀY THAM GIA</th>
                    <th className="py-3 px-4 text-right">HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-medium text-slate-300">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4 flex items-center gap-3 font-bold text-white">
                        <div className={`w-8 h-8 rounded-full ${u.avatarColor} text-white font-extrabold flex items-center justify-center text-xs shrink-0`}>
                          {u.initials}
                        </div>
                        <span>{u.email}</span>
                      </td>
                      <td className="py-4 px-4 text-slate-300">{u.role}</td>
                      <td className="py-4 px-4">
                        {u.status === 'HOẠT ĐỘNG' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            HOẠT ĐỘNG
                          </span>
                        )}
                        {u.status === 'ĐANG CHỜ' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-950 text-amber-400 border border-amber-800">
                            ĐANG CHỜ
                          </span>
                        )}
                        {u.status === 'VÔ HIỆU HÓA' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-950 text-rose-400 border border-rose-800">
                            VÔ HIỆU HÓA
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-400 font-mono">{u.joinDate}</td>
                      <td className="py-4 px-4 text-right space-x-2">
                        <button className="p-1 text-slate-400 hover:text-blue-400"><Edit className="w-3.5 h-3.5" /></button>
                        <button className="p-1 text-slate-400 hover:text-white"><Eye className="w-3.5 h-3.5" /></button>
                        <button className="p-1 text-slate-400 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-800">
              <span>Hiển thị 1-10 trong số 1.240 Người dùng</span>
              <div className="flex gap-2">
                <button className="p-1.5 bg-[#0B0E14] border border-slate-800 rounded-lg text-slate-400 hover:text-white">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-1.5 bg-[#0B0E14] border border-slate-800 rounded-lg text-slate-400 hover:text-white">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom 3 Stat Cards */}
          <div className="grid md:grid-cols-3 gap-5">
            <div className="bg-[#151B26] p-6 rounded-2xl border border-slate-800 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TỔNG NGƯỜI DÙNG QUẢN LÝ</p>
              <h2 className="text-3xl font-black text-white">2.482</h2>
              <p className="text-xs font-semibold text-emerald-400">+12% so với tháng trước</p>
            </div>

            <div className="bg-[#151B26] p-6 rounded-2xl border border-amber-900/50 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ĐANG CHỜ NHẬP CUỘC</p>
              <h2 className="text-3xl font-black text-amber-400">18</h2>
              <p className="text-xs text-slate-400">Thời gian chờ TB: 4h</p>
            </div>

            <div className="bg-[#151B26] p-6 rounded-2xl border border-rose-900/50 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">CẢNH BÁO BẢO MẬT</p>
              <h2 className="text-3xl font-black text-rose-500">3</h2>
              <p className="text-xs font-bold text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Cần chú ý
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151B26] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-white">
            <h3 className="font-bold text-base">Thêm Người dùng mới</h3>
            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Địa chỉ Email</label>
                <input
                  type="email"
                  placeholder="name@flowfi.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0E14] border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Vai trò</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#0B0E14] border border-slate-800 rounded-xl text-white outline-none"
                >
                  <option value="Người dùng">Người dùng</option>
                  <option value="Quản trị viên">Quản trị viên</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 rounded-xl text-white font-bold"
                >
                  Tạo người dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
