import { AxiosError } from 'axios';
import { apiClient } from './apiClient';
import type {
  AdminAiConfig, AdminRole, AdminUserDto, AdminUserPage, AdminUserQuery,
  AiProviderTestResult, AiUsagePage, AiUsageQuery, AiUsageSummary, ApiResponse,
  UpdateAdminAiConfig, UserStatus,
} from '../types/api';

export class AdminApiError extends Error {
  constructor(message: string, public readonly status?: number, public readonly traceId?: string) {
    super(message);
    this.name = 'AdminApiError';
  }
}

const query = (values: object) => {
  const params = new URLSearchParams();
  Object.entries(values as Record<string, string | number | undefined>).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)); });
  const value = params.toString();
  return value ? `?${value}` : '';
};

const unwrapUsers = <T>(response: ApiResponse<T>): T => {
  if (response.success && response.data) return response.data;
  throw new AdminApiError(response.message || 'Yêu cầu quản trị không thành công', 400);
};

export const getAdminError = (error: unknown) => {
  if (error instanceof AdminApiError) return error;
  const axiosError = error as AxiosError<{ message?: string; traceId?: string }>;
  return new AdminApiError(axiosError.response?.data?.message || 'Không thể kết nối máy chủ. Vui lòng thử lại.', axiosError.response?.status, axiosError.response?.data?.traceId);
};

export const adminUserService = {
  async list(input: AdminUserQuery): Promise<AdminUserPage> {
    const response = await apiClient.get<ApiResponse<AdminUserPage>>(`/admin/users${query(input)}`);
    return unwrapUsers(response.data);
  },
  async get(id: string): Promise<AdminUserDto> {
    const response = await apiClient.get<ApiResponse<AdminUserDto>>(`/admin/users/${encodeURIComponent(id)}`);
    return unwrapUsers(response.data);
  },
  async updateStatus(id: string, status: UserStatus): Promise<AdminUserDto> {
    const response = await apiClient.patch<ApiResponse<AdminUserDto>>(`/admin/users/${encodeURIComponent(id)}/status`, { status });
    return unwrapUsers(response.data);
  },
  async updateRole(id: string, role: AdminRole): Promise<AdminUserDto> {
    const response = await apiClient.patch<ApiResponse<AdminUserDto>>(`/admin/users/${encodeURIComponent(id)}/role`, { role });
    return unwrapUsers(response.data);
  },
};

export const adminAiService = {
  getConfig: () => apiClient.get<AdminAiConfig>('/admin/ai/config').then(({ data }) => data),
  updateConfig: (input: UpdateAdminAiConfig) => apiClient.put<AdminAiConfig>('/admin/ai/config', input).then(({ data }) => data),
  testConfig: () => apiClient.post<AiProviderTestResult>('/admin/ai/config/test').then(({ data }) => data),
  getSummary: (from?: string, to?: string) => apiClient.get<AiUsageSummary>(`/admin/ai/usage/summary${query({ from, to })}`).then(({ data }) => data),
  listUsage: (input: AiUsageQuery) => apiClient.get<AiUsagePage>(`/admin/ai/usage/requests${query(input)}`).then(({ data }) => data),
};
