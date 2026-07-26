export type ScreenId = 
  | 'landing'
  | 'dashboard'
  | 'transactions'
  | 'ai-input'
  | 'budget'
  | 'admin-tokens'
  | 'admin-users'
  | 'admin-audit';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number; // positive for income, negative for expense
  type?: 'expense' | 'income' | 'transfer';
  wallet?: string;
  status?: 'HOÀN THÀNH' | 'ĐANG CHỜ' | 'THẤT BẠI';
  icon?: string;
}

export interface Wallet {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  color: string;
  isPrimary?: boolean;
}

export interface BudgetMonth {
  month: number;
  monthName: string;
  spent: number;
  limit: number;
  status: 'VƯỢT HẠN MỨC' | 'AN TOÀN' | 'HIỆN TẠI' | 'CHƯA LẬP';
}

export interface TokenSession {
  tokenId: string;
  accountId: string;
  lastUsed: string;
  usageCount: number;
  status: 'ĐANG HOẠT ĐỘNG' | 'ĐÃ THU HỒI' | 'ĐÃ HẾT HẠN';
  metadata: string; // e.g. IP + OS
  canRevoke: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  initials: string;
  role: 'Quản trị viên' | 'Người dùng';
  status: 'HOẠT ĐỘNG' | 'ĐANG CHỜ' | 'VÔ HIỆU HÓA';
  joinDate: string;
  avatarColor: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  adminId: string;
  action: 'THU_HOI_TOKEN_CUONG_CHE' | 'NANG_CAP_HAN_MUC_TIN_DUNG' | 'LICH_CAP_NHAT_HE_THONG' | 'KHOA_TAI_KHOAN';
  reason: string;
  correlationId: string;
}
