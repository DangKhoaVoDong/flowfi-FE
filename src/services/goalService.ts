import { apiClient } from './apiClient';
import type { FinancialGoalDto, FinancialGoalRequest } from '../types/api';

export const goalService = {
  getAll: async (status?: string): Promise<FinancialGoalDto[]> =>
    (await apiClient.get<FinancialGoalDto[]>('/api/analytics/goals', { params: { status } })).data,
  create: async (data: FinancialGoalRequest): Promise<FinancialGoalDto> =>
    (await apiClient.post<FinancialGoalDto>('/api/analytics/goals', data)).data,
  update: async (id: string, data: FinancialGoalRequest): Promise<FinancialGoalDto> =>
    (await apiClient.put<FinancialGoalDto>(`/api/analytics/goals/${id}`, data)).data,
  contribute: async (id: string, amount: number): Promise<FinancialGoalDto> =>
    (await apiClient.post<FinancialGoalDto>(`/api/analytics/goals/${id}/contributions`, { amount })).data,
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/analytics/goals/${id}`);
  },
};
