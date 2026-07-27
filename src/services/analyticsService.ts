import { apiClient } from './apiClient';
import type {
  BudgetDto,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  BudgetProgressDto,
  FinancialSummaryQuery,
  FinancialSummaryDto,
} from '../types/api';

// ============ BUDGETS ============
// BE returns IReadOnlyList<BudgetResponse> directly
export const budgetService = {
  getAll: async (): Promise<BudgetDto[]> => {
    const response = await apiClient.get<BudgetDto[]>('/api/analytics/budgets');
    return response.data;
  },

  getById: async (id: string): Promise<BudgetDto | null> => {
    const response = await apiClient.get<BudgetDto>(`/api/analytics/budgets/${id}`);
    return response.data;
  },

  getProgress: async (id: string): Promise<BudgetProgressDto | null> => {
    const response = await apiClient.get<BudgetProgressDto>(`/api/analytics/budgets/${id}/progress`);
    return response.data;
  },

  // GET /api/analytics/budgets/progress - Get all budget progress
  getAllProgress: async (): Promise<BudgetProgressDto[]> => {
    const response = await apiClient.get<BudgetProgressDto[]>('/api/analytics/budgets/progress');
    return response.data;
  },

  create: async (data: CreateBudgetRequest): Promise<BudgetDto> => {
    const response = await apiClient.post<BudgetDto>('/api/analytics/budgets', data);
    return response.data;
  },

  update: async (id: string, data: UpdateBudgetRequest): Promise<BudgetDto> => {
    const response = await apiClient.put<BudgetDto>(`/api/analytics/budgets/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/analytics/budgets/${id}`);
  },
};

// ============ FINANCIAL SUMMARIES ============
// BE returns FinancialSummaryResponse directly
export const summaryService = {
  get: async (query: FinancialSummaryQuery): Promise<FinancialSummaryDto> => {
    const response = await apiClient.get<FinancialSummaryDto>('/api/analytics/financial-summaries', { params: query });
    return response.data;
  },

  getCurrentMonth: async (): Promise<FinancialSummaryDto> => {
    const now = new Date();
    return summaryService.get({
      periodType: 'MONTHLY',
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    });
  },

  getCurrentYear: async (): Promise<FinancialSummaryDto> => {
    const now = new Date();
    return summaryService.get({
      periodType: 'YEARLY',
      year: now.getFullYear(),
    });
  },
};

// ============ ANALYTICS ============
// BE returns CashflowResponse directly
export interface CashflowResponse {
  dailyData: DailyCashflowItem[];
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
}

export interface DailyCashflowItem {
  date: string;
  income: number;
  expense: number;
}

// BE returns RatiosResponse directly
export interface RatiosResponse {
  savingsRate: number;
  expenseToIncomeRatio: number;
  emergencyFundRatio: number;
  calculatedAt: string;
}

export const analyticsService = {
  // GET /api/analytics/cashflow/daily - Returns CashflowResponse directly
  getDailyCashflow: async (days: number = 7): Promise<CashflowResponse> => {
    const response = await apiClient.get<CashflowResponse>('/api/analytics/cashflow/daily', {
      params: { days }
    });
    return response.data;
  },

  // GET /api/analytics/ratios - Returns RatiosResponse directly
  getRatios: async (): Promise<RatiosResponse> => {
    const response = await apiClient.get<RatiosResponse>('/api/analytics/ratios');
    return response.data;
  },
};

export default {
  budgetService,
  summaryService,
  analyticsService,
};
