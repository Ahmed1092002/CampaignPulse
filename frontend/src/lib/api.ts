import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import { ApiResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.client.interceptors.request.use(
      (config) => this.addAuthHeader(config),
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleResponseError(error)
    );
  }

  private addAuthHeader(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    const accessToken = getCookie('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  }

  private async handleResponseError(error: AxiosError): Promise<never> {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await this.refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return this.client(originalRequest);
      } catch {
        this.clearAuth();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const refreshToken = getCookie('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
        `${API_URL}/api/auth/refresh`,
        { refreshToken },
        { withCredentials: true }
      );

      const { accessToken, refreshToken: newRefreshToken } = response.data.data!;
      setCookie('accessToken', accessToken, { maxAge: 60 * 15, path: '/', sameSite: 'lax' });
      setCookie('refreshToken', newRefreshToken, { maxAge: 60 * 60 * 24 * 7, path: '/', sameSite: 'lax' });

      return accessToken;
    })();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private clearAuth() {
    deleteCookie('accessToken', { path: '/' });
    deleteCookie('refreshToken', { path: '/' });
    deleteCookie('user', { path: '/' });
    deleteCookie('workspaceId', { path: '/' });
  }

  setWorkspaceId(workspaceId: string) {
    setCookie('workspaceId', workspaceId, { maxAge: 60 * 60 * 24 * 30, path: '/', sameSite: 'lax' });
    this.client.defaults.headers['X-Workspace-ID'] = workspaceId;
  }

  clearWorkspaceId() {
    deleteCookie('workspaceId', { path: '/' });
    delete this.client.defaults.headers['X-Workspace-ID'];
  }

  async get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url);
    return response.data;
  }
}

export const api = new ApiClient();

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => 
    api.post('/auth/register', data),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: { firstName?: string; lastName?: string; locale?: string; avatarUrl?: string }) => 
    api.patch('/auth/profile', data),
  changePassword: (currentPassword: string, newPassword: string) => 
    api.post('/auth/change-password', { currentPassword, newPassword }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) => api.post('/auth/reset-password', { token, newPassword }),
  verifyResetToken: (token: string) => api.post('/auth/verify-reset-token', { token }),
};

export const workspaceApi = {
  create: (data: { name: string; slug: string; description?: string }) => api.post('/workspaces', data),
  getAll: () => api.get('/workspaces'),
  getById: (id: string) => api.get(`/workspaces/${id}`),
  update: (id: string, data: { name?: string; description?: string; logoUrl?: string; settings?: Record<string, unknown> }) => 
    api.patch(`/workspaces/${id}`, data),
  delete: (id: string) => api.delete(`/workspaces/${id}`),
  getSettings: (id: string) => api.get(`/workspaces/${id}/settings`),
  updateSettings: (id: string, settings: Record<string, unknown>) => api.patch(`/workspaces/${id}/settings`, settings),
};

export const memberApi = {
  invite: (workspaceId: string, data: { email: string; role: string }) => 
    api.post(`/workspaces/${workspaceId}/members`, data),
  getAll: (workspaceId: string) => api.get(`/workspaces/${workspaceId}/members`),
  updateRole: (workspaceId: string, memberId: string, role: string) => 
    api.patch(`/workspaces/${workspaceId}/members/${memberId}`, { role }),
  remove: (workspaceId: string, memberId: string) => 
    api.delete(`/workspaces/${workspaceId}/members/${memberId}`),
  leave: (workspaceId: string) => api.post(`/workspaces/${workspaceId}/members/leave`),
};

export const campaignApi = {
  create: (workspaceId: string, data: {
    name: string;
    slug: string;
    description?: string;
    goal?: string;
    startDate: string;
    endDate?: string;
    budget?: number;
    channels: string[];
    status?: string;
  }) => api.post(`/workspaces/${workspaceId}/campaigns`, data),
  getAll: (workspaceId: string, params?: { page?: number; limit?: number; status?: string; search?: string; sortBy?: string; sortOrder?: string }) =>
    api.get(`/workspaces/${workspaceId}/campaigns`, params),
  getById: (workspaceId: string, id: string) => api.get(`/workspaces/${workspaceId}/campaigns/${id}`),
  update: (workspaceId: string, id: string, data: {
    name?: string;
    description?: string;
    goal?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    channels?: string[];
    status?: string;
  }) => api.patch(`/workspaces/${workspaceId}/campaigns/${id}`, data),
  delete: (workspaceId: string, id: string) => api.delete(`/workspaces/${workspaceId}/campaigns/${id}`),
  getPublic: (slug: string) => api.get(`/workspaces/public/campaigns/${slug}`),
  generateSlug: (workspaceId: string, name: string) => api.post(`/workspaces/${workspaceId}/campaigns/generate-slug`, { name }),
};

export const landingPageApi = {
  get: (workspaceId: string, campaignId: string) => api.get(`/workspaces/${workspaceId}/landing-pages/${campaignId}`),
  update: (workspaceId: string, campaignId: string, data: {
    hero?: Record<string, unknown>;
    features?: unknown[];
    testimonials?: unknown[];
    cta?: Record<string, unknown>;
    leadForm?: unknown[];
    seo?: Record<string, unknown>;
    customCss?: string;
    isPublished?: boolean;
  }) => api.patch(`/workspaces/${workspaceId}/landing-pages/${campaignId}`, data),
  getPublic: (slug: string) => api.get(`/workspaces/public/landing-pages/${slug}`),
  duplicate: (workspaceId: string, campaignId: string, targetCampaignId: string) => 
    api.post(`/workspaces/${workspaceId}/landing-pages/${campaignId}/duplicate`, { targetCampaignId }),
};

export const leadApi = {
  create: (workspaceId: string, data: {
    campaignId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    customFields?: Record<string, unknown>;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
    referrer?: string;
  }) => api.post(`/workspaces/${workspaceId}/leads`, data),
  getAll: (workspaceId: string, params?: { 
    page?: number; 
    limit?: number; 
    campaignId?: string; 
    status?: string; 
    search?: string; 
    sortBy?: string; 
    sortOrder?: string 
  }) => api.get(`/workspaces/${workspaceId}/leads`, params),
  getById: (workspaceId: string, id: string) => api.get(`/workspaces/${workspaceId}/leads/${id}`),
  update: (workspaceId: string, id: string, data: { status?: string; customFields?: Record<string, unknown> }) => 
    api.patch(`/workspaces/${workspaceId}/leads/${id}`, data),
  delete: (workspaceId: string, id: string) => api.delete(`/workspaces/${workspaceId}/leads/${id}`),
  getStats: (workspaceId: string, campaignId?: string) => 
    api.get(`/workspaces/${workspaceId}/leads/stats`, { campaignId }),
  createSources: (workspaceId: string, campaignId: string) => 
    api.post(`/workspaces/${workspaceId}/leads/${campaignId}/sources`),
  getSources: (workspaceId: string, campaignId: string) => 
    api.get(`/workspaces/${workspaceId}/leads/${campaignId}/sources`),
};

export const trackingApi = {
  trackEvent: (workspaceId: string, data: {
    campaignId: string;
    type: string;
    sessionId: string;
    pageUrl?: string;
    elementId?: string;
    elementType?: string;
    metadata?: Record<string, unknown>;
    leadId?: string;
  }) => api.post(`/workspaces/${workspaceId}/tracking`, data),
  trackBatch: (workspaceId: string, events: Array<{
    campaignId: string;
    type: string;
    sessionId: string;
    pageUrl?: string;
    elementId?: string;
    elementType?: string;
    metadata?: Record<string, unknown>;
    leadId?: string;
  }>) => api.post(`/workspaces/${workspaceId}/tracking/batch`, { events }),
  getEvents: (workspaceId: string, params?: {
    campaignId?: string;
    leadId?: string;
    type?: string;
    sessionId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get(`/workspaces/${workspaceId}/tracking`, params),
  getCounts: (workspaceId: string, campaignId?: string, startDate?: string, endDate?: string) => 
    api.get(`/workspaces/${workspaceId}/tracking/counts`, { campaignId, startDate, endDate }),
};

export const analyticsApi = {
  getDashboardStats: (workspaceId: string, params?: {
    campaignId?: string;
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
    channel?: string;
  }) => api.get(`/workspaces/${workspaceId}/analytics/dashboard`, params),
  getCampaignAnalytics: (workspaceId: string, campaignId: string, params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
    channel?: string;
  }) => api.get(`/workspaces/${workspaceId}/analytics/campaign/${campaignId}`, params),
  getRealtimeStats: (workspaceId: string) => api.get(`/workspaces/${workspaceId}/analytics/realtime`),
};

export const notificationApi = {
  getAll: (workspaceId: string, params?: { page?: number; limit?: number; isRead?: boolean; type?: string }) => 
    api.get(`/workspaces/${workspaceId}/notifications`, params),
  getUnreadCount: (workspaceId: string) => api.get(`/workspaces/${workspaceId}/notifications/unread-count`),
  markAsRead: (workspaceId: string, id: string) => api.patch(`/workspaces/${workspaceId}/notifications/${id}/read`),
  markAllAsRead: (workspaceId: string) => api.post(`/workspaces/${workspaceId}/notifications/read-all`),
  delete: (workspaceId: string, id: string) => api.delete(`/workspaces/${workspaceId}/notifications/${id}`),
};

export const auditLogApi = {
  getAll: (workspaceId: string, params?: {
    page?: number;
    limit?: number;
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get(`/workspaces/${workspaceId}/audit-logs`, params),
};