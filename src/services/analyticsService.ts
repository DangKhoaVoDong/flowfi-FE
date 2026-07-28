import { apiClient } from './apiClient';
import type {
  BudgetDto,
  BudgetDetailsDto,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  BudgetProgressDto,
  FinancialSummaryQuery,
  FinancialSummaryDto,
  MonthlyBudgetOverviewDto,
  BudgetMonthCardDto,
} from '../types/api';

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const isNotFound = (error: unknown) =>
  typeof error === 'object' && error !== null && 'response' in error &&
  (error as { response?: { status?: number } }).response?.status === 404;

const emptyMonths = (year: number): BudgetMonthCardDto[] =>
  Array.from({ length: 12 }, (_, index) => ({
    month: index + 1, year, hasBudget: false, totalTargetAmount: 0,
    spentAmount: 0, remainingAmount: 0, usagePercent: 0, targetCount: 0,
  }));

// ============ BUDGETS ============
// BE returns IReadOnlyList<BudgetResponse> directly
export const budgetService = {
  getMonthlyOverview: async (year: number, month: number): Promise<MonthlyBudgetOverviewDto | null> => {
    try {
      return unwrap<MonthlyBudgetOverviewDto>((await apiClient.get('/api/analytics/budgets/monthly/overview', { params: { year, month } })).data);
    } catch (error: unknown) {
      if (isNotFound(error)) {
        // Compatibility with Analytics deployments that predate the aggregate endpoint.
        const budgets = await budgetService.getAll();
        const budget = budgets.find(item => item.year === year && item.month === month);
        if (!budget) return null;
        const details = await budgetService.getDetails(budget.id);
        if (!details) return null;
        const days = new Date(year, month, 0).getDate();
        const today = new Date();
        const elapsed = year === today.getFullYear() && month === today.getMonth() + 1
          ? today.getDate() : new Date(year, month - 1, 1) > today ? 0 : days;
        const remainingDays = elapsed === 0 ? days : Math.max(0, days - elapsed + 1);
        const projected = elapsed ? details.spentAmount / elapsed * days : 0;
        const percent = details.totalTargetAmount
          ? details.spentAmount / details.totalTargetAmount * 100 : 0;
        return {
          summary: {
            id: details.id, month, year, currencyCode: details.currencyCode,
            targetAmount: details.totalTargetAmount, spentAmount: details.spentAmount,
            remainingAmount: details.totalTargetAmount - details.spentAmount,
            percentUsed: percent, warningThresholdPercent: details.warningThresholdPercent,
            transactionCount: details.targets.reduce((sum, item) => sum + item.transactionCount, 0),
            remainingDays,
            safeDailyAmount: remainingDays ? Math.max(0, details.totalTargetAmount - details.spentAmount) / remainingDays : 0,
            averageDailyExpense: elapsed ? details.spentAmount / elapsed : 0,
            projectedExpense: projected,
            timeElapsedPercent: days ? elapsed / days * 100 : 0,
            status: percent >= 100 ? 'EXCEEDED' : percent >= 90 || projected > details.totalTargetAmount
              ? 'AT_RISK' : percent >= 70 ? 'ATTENTION' : elapsed === 0 ? 'NOT_STARTED' : 'ON_TRACK',
            updatedAt: details.updatedAt,
          },
          allocations: details.targets,
          dailyTrend: [],
          unbudgetedExpenses: [],
        };
      }
      throw error;
    }
  },

  getCalendar: async (year: number): Promise<BudgetMonthCardDto[]> => {
    try {
      const payload = unwrap<unknown>((await apiClient.get('/api/analytics/budgets/calendar', { params: { year } })).data);
      if (Array.isArray(payload)) {
        const byMonth = new Map((payload as BudgetMonthCardDto[]).map(item => [item.month, item]));
        return emptyMonths(year).map(item => byMonth.get(item.month) ?? item);
      }
    } catch (error: unknown) {
      if (!isNotFound(error)) throw error;
    }

    // Older services may not expose /calendar. Build it from the stable list/details API.
    const budgets = (await budgetService.getAll()).filter(item => item.year === year);
    const details = await Promise.all(budgets.map(item => budgetService.getDetails(item.id)));
    const byMonth = new Map<number, BudgetMonthCardDto>();
    budgets.forEach((budget, index) => {
      const detail = details[index];
      const spent = detail?.spentAmount ?? 0;
      const remaining = budget.totalTargetAmount - spent;
      byMonth.set(budget.month, {
        month: budget.month, year, hasBudget: true, budgetId: budget.id,
        budgetName: budget.name, totalTargetAmount: budget.totalTargetAmount,
        spentAmount: spent, remainingAmount: remaining,
        usagePercent: budget.totalTargetAmount ? spent / budget.totalTargetAmount * 100 : 0,
        status: budget.status, targetCount: budget.targets.length,
      });
    });
    return emptyMonths(year).map(item => byMonth.get(item.month) ?? item);
  },
  getAll: async (): Promise<BudgetDto[]> => {
    const response = await apiClient.get<BudgetDto[]>('/api/analytics/budgets');
    const payload = unwrap<unknown>(response.data);
    return Array.isArray(payload) ? payload : [];
  },

  getById: async (id: string): Promise<BudgetDto | null> => {
    const response = await apiClient.get<BudgetDto>(`/api/analytics/budgets/${id}`);
    return unwrap<BudgetDto>(response.data);
  },

  getDetails: async (id: string): Promise<BudgetDetailsDto | null> => {
    const response = await apiClient.get<BudgetDetailsDto>(`/api/analytics/budgets/${id}/details`);
    return unwrap<BudgetDetailsDto>(response.data);
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
