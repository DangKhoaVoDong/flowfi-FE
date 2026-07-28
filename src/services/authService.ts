import { apiClient, tokenService } from './apiClient';
import type {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  UserDto,
  AuthTokensDto,
  UpdateProfileRequest,
  UpdatePreferencesRequest,
} from '../types/api';

export const authService = {
  // POST /auth/register
  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/register', data);
    const loginResponse = response.data.data;
    if (loginResponse?.tokens) {
      tokenService.setAccessToken(loginResponse.tokens.accessToken);
      tokenService.setRefreshToken(loginResponse.tokens.refreshToken);
    }
    return loginResponse;
  },

  // POST /auth/login
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data);
    const loginResponse = response.data.data;
    if (loginResponse?.tokens) {
      tokenService.setAccessToken(loginResponse.tokens.accessToken);
      tokenService.setRefreshToken(loginResponse.tokens.refreshToken);
    }
    return loginResponse;
  },

  // POST /auth/refresh
  refreshToken: async (refreshToken: string): Promise<ApiResponse<AuthTokensDto>> => {
    const response = await apiClient.post<ApiResponse<AuthTokensDto>>('/auth/refresh', { refreshToken });
    if (response.data.data) {
      tokenService.setAccessToken(response.data.data.accessToken);
      tokenService.setRefreshToken(response.data.data.refreshToken);
    }
    return response.data;
  },

  // POST /auth/logout
  logout: async (): Promise<void> => {
    try {
      const refreshToken = tokenService.getRefreshToken();
      await apiClient.post('/auth/logout', { refreshToken });
    } finally {
      tokenService.clearTokens();
    }
  },

  // POST /auth/forgot-password
  forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
    return (await apiClient.post<ApiResponse<null>>('/auth/forgot-password', { email })).data;
  },

  // POST /auth/reset-password
  resetPassword: async (email: string, token: string, newPassword: string): Promise<ApiResponse<null>> => {
    return (await apiClient.post<ApiResponse<null>>('/auth/reset-password', { email, token, newPassword })).data;
  },

  // POST /auth/change-password
  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<null>> => {
    return (await apiClient.post<ApiResponse<null>>('/auth/change-password', { currentPassword, newPassword })).data;
  },

  // GET /users/me
  getCurrentUser: async (): Promise<ApiResponse<UserDto>> => {
    return (await apiClient.get<ApiResponse<UserDto>>('/users/me')).data;
  },

  // PUT /users/me
  updateProfile: async (data: UpdateProfileRequest): Promise<ApiResponse<UserDto>> => {
    return (await apiClient.put<ApiResponse<UserDto>>('/users/me', data)).data;
  },

  // PUT /users/me/preferences
  updatePreferences: async (data: UpdatePreferencesRequest): Promise<ApiResponse<UserDto>> => {
    return (await apiClient.put<ApiResponse<UserDto>>('/users/me/preferences', data)).data;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!tokenService.getAccessToken();
  },
};

export default authService;
