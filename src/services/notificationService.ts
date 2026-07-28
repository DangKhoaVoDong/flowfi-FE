import { apiClient } from './apiClient';
import type {
  NotificationDto,
  PagedNotificationsResponse,
  UnreadCountResponse,
  UpdateNotificationPreferenceRequest,
} from '../types/api';

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

// ============ NOTIFICATIONS ============
export const notificationService = {
  // GET /notifications
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    isRead?: boolean;
    type?: string;
  }): Promise<PagedNotificationsResponse> => {
    const response = await apiClient.get<PagedNotificationsResponse>('/notifications', { params });
    return unwrap<PagedNotificationsResponse>(response.data);
  },

  // GET /notifications/unread-count
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await apiClient.get<UnreadCountResponse>('/notifications/unread-count');
    return unwrap<UnreadCountResponse>(response.data);
  },

  // GET /notifications/{id}
  getById: async (id: string): Promise<NotificationDto> => {
    const response = await apiClient.get<NotificationDto>(`/notifications/${id}`);
    return unwrap<NotificationDto>(response.data);
  },

  // PATCH /notifications/{id}/read
  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  // PATCH /notifications/read-all
  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
  },

  // DELETE /notifications/{id}
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },

  // GET /notification-preferences
  getPreferences: async (): Promise<UpdateNotificationPreferenceRequest> => {
    const response = await apiClient.get<UpdateNotificationPreferenceRequest>('/notification-preferences');
    return unwrap<UpdateNotificationPreferenceRequest>(response.data);
  },

  // PUT /notification-preferences
  updatePreferences: async (data: UpdateNotificationPreferenceRequest): Promise<UpdateNotificationPreferenceRequest> => {
    const response = await apiClient.put<UpdateNotificationPreferenceRequest>('/notification-preferences', data);
    return unwrap<UpdateNotificationPreferenceRequest>(response.data);
  },
};

export default notificationService;
