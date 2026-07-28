import { tokenService } from './apiClient';
import type { ScreenId } from '../types';

const ROLE_CLAIMS = ['role', 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
const USER_ID_CLAIMS = ['sub', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

const payload = (): Record<string, unknown> | null => {
  const token = tokenService.getAccessToken();
  if (!token) return null;
  try {
    const encoded = token.split('.')[1];
    if (!encoded) return null;
    return JSON.parse(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')));
  } catch { return null; }
};

export const currentAdminIdentity = () => {
  const claims = payload();
  const role = ROLE_CLAIMS.map((key) => claims?.[key]).find((value): value is string => typeof value === 'string');
  const userId = USER_ID_CLAIMS.map((key) => claims?.[key]).find((value): value is string => typeof value === 'string');
  return { isAdmin: role === 'Admin', userId };
};

export const getPostAuthScreen = (): ScreenId =>
  currentAdminIdentity().isAdmin ? 'admin-users' : 'dashboard';
