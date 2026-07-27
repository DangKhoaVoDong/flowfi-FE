import { apiClient } from './apiClient';
import type {
  ApiResponse,
  NotificationDto,
  PagedNotificationsResponse,
  UnreadCountResponse,
  UpdateNotificationPreferenceRequest,
} from '../types/api';

// ============ NOTIFICATIONS ============
export const notificationService = {
  // GET /notifications
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    isRead?: boolean;
    type?: string;
  }): Promise<ApiResponse<PagedNotificationsResponse>> => {
    return (await apiClient.get<ApiResponse<PagedNotificationsResponse>>('/notifications', { params })).data;
  },

  // GET /notifications/unread-count
  getUnreadCount: async (): Promise<ApiResponse<UnreadCountResponse>> => {
    return (await apiClient.get<ApiResponse<UnreadCountResponse>>('/notifications/unread-count')).data;
  },

  // GET /notifications/{id}
  getById: async (id: string): Promise<ApiResponse<NotificationDto>> => {
    return (await apiClient.get<ApiResponse<NotificationDto>>(`/notifications/${id}`)).data;
  },

  // PATCH /notifications/{id}/read
  markAsRead: async (id: string): Promise<ApiResponse<null>> => {
    return (await apiClient.patch<ApiResponse<null>>(`/notifications/${id}/read`)).data;
  },

  // PATCH /notifications/read-all
  markAllAsRead: async (): Promise<ApiResponse<null>> => {
    return (await apiClient.patch<ApiResponse<null>>('/notifications/read-all')).data;
  },

  // DELETE /notifications/{id}
  delete: async (id: string): Promise<ApiResponse<null>> => {
    return (await apiClient.delete<ApiResponse<null>>(`/notifications/${id}`)).data;
  },

  // GET /notification-preferences
  getPreferences: async (): Promise<ApiResponse<UpdateNotificationPreferenceRequest>> => {
    return (await apiClient.get<ApiResponse<UpdateNotificationPreferenceRequest>>('/notification-preferences')).data;
  },

  // PUT /notification-preferences
  updatePreferences: async (data: UpdateNotificationPreferenceRequest): Promise<ApiResponse<UpdateNotificationPreferenceRequest>> => {
    return (await apiClient.put<ApiResponse<UpdateNotificationPreferenceRequest>>('/notification-preferences', data)).data;
  },
};

export default notificationService;
