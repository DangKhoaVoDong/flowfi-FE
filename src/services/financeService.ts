import { apiClient } from './apiClient';
import type {
  WalletDto,
  CreateWalletDto,
  UpdateWalletDto,
  TransactionDto,
  CreateTransactionRequest,
  TransactionQuery,
  PagedTransactionsResponse,
  TagDto,
  CreateTagDto,
  UpdateTagDto,
  InternalTransferDto,
  CreateTransferRequest,
  RecurringTransactionDto,
  CreateRecurringTransactionDto,
  UpdateRecurringTransactionDto,
} from '../types/api';

// ============ WALLETS ============
// BE returns IReadOnlyList<WalletDto> directly (no wrapper)
export const walletService = {
  getAll: async (): Promise<WalletDto[]> => {
    const response = await apiClient.get<WalletDto[]>('/api/finance/wallets');
    return response.data;
  },

  getById: async (id: string): Promise<WalletDto | null> => {
    const response = await apiClient.get<WalletDto>(`/api/finance/wallets/${id}`);
    return response.data;
  },

  create: async (data: CreateWalletDto): Promise<WalletDto> => {
    const response = await apiClient.post<WalletDto>('/api/finance/wallets', data);
    return response.data;
  },

  update: async (id: string, data: UpdateWalletDto): Promise<WalletDto> => {
    const response = await apiClient.put<WalletDto>(`/api/finance/wallets/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/finance/wallets/${id}`);
  },
};

// ============ TRANSACTIONS ============
// BE returns PagedTransactionsResponse directly
export const transactionService = {
  getAll: async (query?: TransactionQuery): Promise<PagedTransactionsResponse> => {
    const response = await apiClient.get<PagedTransactionsResponse>('/api/finance/transactions', { params: query });
    return response.data;
  },

  getById: async (id: string): Promise<TransactionDto | null> => {
    const response = await apiClient.get<TransactionDto>(`/api/finance/transactions/${id}`);
    return response.data;
  },

  create: async (data: CreateTransactionRequest): Promise<TransactionDto> => {
    const response = await apiClient.post<TransactionDto>('/api/finance/transactions', data);
    return response.data;
  },

  update: async (id: string, data: CreateTransactionRequest): Promise<TransactionDto> => {
    const response = await apiClient.put<TransactionDto>(`/api/finance/transactions/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/finance/transactions/${id}`);
  },
};

// ============ TAGS ============
// BE returns IReadOnlyList<TagDto> directly
export const tagService = {
  getAll: async (): Promise<TagDto[]> => {
    const response = await apiClient.get<TagDto[]>('/api/finance/tags');
    return response.data;
  },

  getById: async (id: string): Promise<TagDto | null> => {
    const response = await apiClient.get<TagDto>(`/api/finance/tags/${id}`);
    return response.data;
  },

  create: async (data: CreateTagDto): Promise<TagDto> => {
    const response = await apiClient.post<TagDto>('/api/finance/tags', data);
    return response.data;
  },

  update: async (id: string, data: UpdateTagDto): Promise<TagDto> => {
    const response = await apiClient.put<TagDto>(`/api/finance/tags/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/finance/tags/${id}`);
  },
};

// ============ INTERNAL TRANSFERS ============
// BE returns IReadOnlyList<InternalTransferDto> directly
export const transferService = {
  getAll: async (): Promise<InternalTransferDto[]> => {
    const response = await apiClient.get<InternalTransferDto[]>('/api/finance/internal-transfers');
    return response.data;
  },

  getById: async (id: string): Promise<InternalTransferDto | null> => {
    const response = await apiClient.get<InternalTransferDto>(`/api/finance/internal-transfers/${id}`);
    return response.data;
  },

  create: async (data: CreateTransferRequest): Promise<InternalTransferDto> => {
    const response = await apiClient.post<InternalTransferDto>('/api/finance/internal-transfers', data);
    return response.data;
  },
};

// ============ RECURRING TRANSACTIONS ============
// BE returns IReadOnlyList<RecurringTransactionDto> directly
export const recurringService = {
  getAll: async (): Promise<RecurringTransactionDto[]> => {
    const response = await apiClient.get<RecurringTransactionDto[]>('/api/finance/recurring-transactions');
    return response.data;
  },

  create: async (data: CreateRecurringTransactionDto): Promise<RecurringTransactionDto> => {
    const response = await apiClient.post<RecurringTransactionDto>('/api/finance/recurring-transactions', data);
    return response.data;
  },

  update: async (id: string, data: UpdateRecurringTransactionDto): Promise<RecurringTransactionDto> => {
    const response = await apiClient.put<RecurringTransactionDto>(`/api/finance/recurring-transactions/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/finance/recurring-transactions/${id}`);
  },
};

export default {
  walletService,
  transactionService,
  tagService,
  transferService,
  recurringService,
};
