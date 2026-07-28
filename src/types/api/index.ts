// Generic API response wrapper from Backend
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
}

// Admin API contracts. User administration uses ApiResponse; AI administration
// returns these DTOs directly.
export type AdminRole = 'Admin' | 'User';
export type UserStatus = 'Active' | 'Suspended';
export type AiUsageStatus = 'Succeeded' | 'Failed';

export interface AdminUserDto {
  id: string;
  email: string;
  fullName: string | null;
  role: AdminRole;
  status: UserStatus;
  authProvider: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminUserPage { items: AdminUserDto[]; page: number; pageSize: number; total: number; }
export interface AdminUserQuery { page?: number; pageSize?: number; search?: string; role?: AdminRole; status?: UserStatus; }
export interface AdminAiConfig {
  provider: string; baseUrl: string; responsesPath: string; model: string;
  timeoutSeconds: number; apiKeyConfigured: boolean; maskedApiKey: string; updatedAt: string | null;
}
export interface UpdateAdminAiConfig {
  provider: string; baseUrl: string; responsesPath: string; model: string;
  timeoutSeconds: number; apiKey?: string | null;
}
export interface AiProviderTestResult { success: boolean; statusCode: number; }
export interface AiUsageSummary {
  totalRequests: number; successfulRequests: number; failedRequests: number;
  inputTokens: number; outputTokens: number; totalTokens: number; averageLatencyMs: number;
}
export interface AiUsageRecord {
  id: string; requestId: string | null; userId: string | null; provider: string; model: string;
  operation: string; inputTokens: number; outputTokens: number; totalTokens: number;
  latencyMs: number; status: AiUsageStatus | string; errorCode: string | null; createdAt: string;
}
export interface AiUsagePage { items: AiUsageRecord[]; page: number; pageSize: number; total: number; }
export interface AiUsageQuery {
  page?: number; pageSize?: number; from?: string; to?: string; provider?: string;
  model?: string; operation?: string; status?: AiUsageStatus;
}

// Auth DTOs
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface LoginResponse {
  user: UserDto;
  tokens: AuthTokensDto;
}

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  currencyCode: string;
  monthlyBudgetLimit?: number;
  authProvider: string;
  createdAt: string;
  role?: string;
  status?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
}

export interface UpdatePreferencesRequest {
  currencyCode?: string;
  monthlyBudgetLimit?: number;
}

// Wallet DTOs - matched with BE WalletDto
export interface WalletDto {
  id: string;
  userId: string;
  name: string;
  walletType: string;  // CASH, BANK, CREDIT_CARD, etc.
  balance: number;
  currency: string;  // VND, USD, etc.
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWalletDto {
  name: string;
  walletType: string;
  currency: string;
  balance?: number;
}

export interface UpdateWalletDto {
  name?: string;
  walletType?: string;
  currency?: string;
  balance?: number;
  isActive?: boolean;
}

// Transaction DTOs - matched with BE TransactionDto
export interface TransactionDto {
  id: string;
  userId: string;
  walletId: string;
  tagId?: string;
  tagName?: string;
  amount: number;
  type: string;  // INCOME, EXPENSE
  title: string;
  note?: string;
  source: string;  // MANUAL, AI, IMPORT, RECURRING
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
  version?: number;
}

export interface CreateTransactionRequest {
  walletId: string;
  tagId?: string;
  amount: number;
  type: string;
  title: string;
  note?: string;
  source?: string;
  transactionDate?: string;
}

export interface TransactionQuery {
  page?: number;
  pageSize?: number;
  walletId?: string;
  tagId?: string;
  type?: 'INCOME' | 'EXPENSE';
  from?: string;
  to?: string;
}

export interface PagedTransactionsResponse {
  items: TransactionDto[];
  page: number;
  pageSize: number;
  total: number;
}

// Tag DTOs
// Tag DTOs - matched with BE TagDto
export interface TagDto {
  id: string;
  userId: string;
  name: string;
  type: string;  // INCOME, EXPENSE
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagDto {
  name: string;
  type?: string;
  icon?: string;
  color?: string;
}

export interface UpdateTagDto {
  name?: string;
  type?: string;
  icon?: string;
  color?: string;
}

// Internal Transfer DTOs
export interface InternalTransferDto {
  id: string;
  userId: string;
  sourceWalletId: string;
  destinationWalletId: string;
  amount: number;
  note?: string;
  transactionDate: string;
  createdAt: string;
}

export interface CreateTransferRequest {
  sourceWalletId: string;
  destinationWalletId: string;
  amount: number;
  note?: string;
  transactionDate?: string;
}

// Budget DTOs - matched with BE BudgetResponse
export interface BudgetTargetRequest {
  tagId?: string | null;
  tagName?: string | null;
  name: string;
  targetAmount: number;
}

export interface BudgetTargetDto extends BudgetTargetRequest {
  id: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BudgetTargetDetailsDto extends BudgetTargetDto {
  spentAmount: number;
  remainingAmount: number;
  usagePercent: number;
  transactionCount: number;
}

export interface BudgetDto {
  id: string;
  userId: string;
  name: string;
  month: number;
  year: number;
  totalTargetAmount: number;
  warningThresholdPercent: number;
  currencyCode: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  targets: BudgetTargetDto[];
}

export interface BudgetDetailsDto extends Omit<BudgetDto, 'targets'> {
  spentAmount: number;
  remainingAmount: number;
  usagePercent: number;
  targets: BudgetTargetDetailsDto[];
}

export interface CreateBudgetRequest {
  name: string;
  month: number;
  year: number;
  warningThresholdPercent?: number;
  currencyCode?: string;
  targets: BudgetTargetRequest[];
}

export interface UpdateBudgetRequest extends CreateBudgetRequest {
  status?: string;
}

// Budget Progress - matched with BE BudgetProgressResponse
export interface BudgetProgressDto {
  budgetId: string;
  budgetName: string;
  month: number;
  year: number;
  totalTargetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentUsed: number;
  daysRemaining: number;
  isOverBudget: boolean;
  warningTriggered: boolean;
}

// Financial Summary DTOs
export interface FinancialSummaryQuery {
  periodType?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  year: number;
  month?: number;
  weekNumber?: number;
}

export interface FinancialSummaryDto {
  id: string;
  userId: string;
  periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  periodStartDate: string;
  periodEndDate: string;
  weekNumber?: number;
  month?: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  netSaving: number;
  totalBudget: number;
  usedBudget: number;
  budgetUsagePercent: number;
  transactionCount: number;
  calculatedAt: string;
}

// Notification DTOs
export interface NotificationDto {
  id: string;
  userId: string;
  type: 'BUDGET_WARNING' | 'TRANSACTION' | 'SYSTEM' | 'SAVINGS_TIP' | 'REMINDER';
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface PagedNotificationsResponse {
  items: NotificationDto[];
  page: number;
  pageSize: number;
  total: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface UpdateNotificationPreferenceRequest {
  transactionNotifications?: boolean;
  budgetWarning?: boolean;
  dailyReminder?: boolean;
  dailyReminderHour?: number;
  weeklySummary?: boolean;
  monthlySummary?: boolean;
  savingsTip?: boolean;
  timezone?: string;
}

// AI Processing DTOs
export interface AiProcessingRequestDto {
  id: string;
  userId: string;
  provider: string;
  model: string;
  operation: 'TRANSCRIPTION' | 'OCR' | 'TEXT_EXTRACTION';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requestedAt: string;
  completedAt?: string;
}

export interface AiProcessingResultDto {
  id: string;
  requestId: string;
  success: boolean;
  extractedText?: string;
  parsedTransaction?: Partial<CreateTransactionRequest>;
  confidence?: number;
  errorMessage?: string;
  processedAt: string;
}

// Admin DTOs
export interface AdminUserListResponse {
  items: UserDto[];
  page: number;
  pageSize: number;
  total: number;
}

export interface UpdateUserStatusRequest {
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
}

export interface UpdateUserRoleRequest {
  role: 'USER' | 'ADMIN';
}

// Recurring Transaction DTOs
export interface RecurringTransactionDto {
  id: string;
  userId: string;
  walletId: string;
  tagId?: string;
  tagName?: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  title: string;
  note?: string;
  recurrencePattern: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  nextOccurrence: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateRecurringTransactionDto {
  walletId: string;
  tagId?: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  title: string;
  note?: string;
  recurrencePattern: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: string;
  endDate?: string;
}

export interface UpdateRecurringTransactionDto extends Partial<CreateRecurringTransactionDto> {
  isActive?: boolean;
}

// Payment Obligation DTOs
export type PaymentObligationFrequency = 'ONCE' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type PaymentObligationPaymentStatus = 'PENDING' | 'REMINDED' | 'PAID' | 'OVERDUE' | 'SKIPPED';

export interface PaymentObligationDto {
  id: string;
  userId: string;
  walletId: string;
  tagId?: string;
  totalAmount: number;
  cycleCount: number;
  amountPerCycle: number;
  title: string;
  note?: string;
  frequency: PaymentObligationFrequency;
  firstDueAt: string;
  finalDueAt: string;
  nextDueAt: string;
  reminderDaysBefore: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentObligationDto {
  walletId: string;
  tagId?: string;
  totalAmount: number;
  cycleCount: number;
  title: string;
  note?: string;
  frequency: PaymentObligationFrequency;
  firstDueAt: string;
  reminderDaysBefore: number;
  isActive: boolean;
}

export interface UpdatePaymentObligationDto extends CreatePaymentObligationDto {}

export interface PaymentObligationPaymentDto {
  id: string;
  obligationId: string;
  userId: string;
  dueAt: string;
  amount: number;
  status: PaymentObligationPaymentStatus;
  remindedAt?: string;
  paidAt?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayPaymentObligationPaymentRequest {
  paidAt?: string;
}
