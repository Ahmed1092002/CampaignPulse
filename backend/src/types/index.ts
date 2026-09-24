import { Request } from 'express';
import { UserRole, CampaignStatus, LeadStatus, TrackingEventType, NotificationType } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  workspaceId?: string;
  role?: UserRole;
  type: 'access' | 'refresh';
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  workspaceId?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type UserRoleType = UserRole;
export type CampaignStatusType = CampaignStatus;
export type LeadStatusType = LeadStatus;
export type TrackingEventTypeType = TrackingEventType;
export type NotificationTypeType = NotificationType;

export interface CreateWorkspaceInput {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
  logoUrl?: string;
  settings?: Record<string, unknown>;
}

export interface InviteMemberInput {
  email: string;
  role: UserRole;
}

export interface UpdateMemberRoleInput {
  role: UserRole;
}

export interface CreateCampaignInput {
  name: string;
  slug: string;
  description?: string;
  goal?: string;
  startDate: Date;
  endDate?: Date;
  budget?: number;
  channels: string[];
  status?: CampaignStatus;
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  goal?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  channels?: string[];
  status?: CampaignStatus;
}

export interface CreateLandingPageInput {
  hero?: Record<string, unknown>;
  features?: unknown[];
  testimonials?: unknown[];
  cta?: Record<string, unknown>;
  leadForm?: unknown[];
  seo?: Record<string, unknown>;
  customCss?: string;
}

export interface UpdateLandingPageInput {
  hero?: Record<string, unknown>;
  features?: unknown[];
  testimonials?: unknown[];
  cta?: Record<string, unknown>;
  leadForm?: unknown[];
  seo?: Record<string, unknown>;
  customCss?: string;
  isPublished?: boolean;
}

export interface CreateLeadInput {
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
  ipAddress?: string;
  userAgent?: string;
}

export interface UpdateLeadInput {
  status?: LeadStatus;
  customFields?: Record<string, unknown>;
}

export interface TrackingEventInput {
  campaignId: string;
  type: TrackingEventType;
  sessionId: string;
  pageUrl?: string;
  elementId?: string;
  elementType?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  leadId?: string;
}

export interface CreateSourceInput {
  campaignId: string;
  name: string;
  channel: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm?: string;
  utmContent?: string;
}

export interface AnalyticsQueryParams {
  campaignId?: string;
  startDate?: Date;
  endDate?: Date;
  groupBy?: 'day' | 'week' | 'month';
  channel?: string;
}

export interface DashboardStats {
  totalVisits: number;
  totalLeads: number;
  conversionRate: number;
  leadsByCampaign: Array<{ campaignId: string; campaignName: string; count: number }>;
  leadsBySource: Array<{ source: string; count: number }>;
  dailyTrends: Array<{ date: string; visits: number; leads: number }>;
  weeklyTrends: Array<{ week: string; visits: number; leads: number }>;
  funnel: {
    pageViews: number;
    ctaClicks: number;
    formStarts: number;
    formSubmits: number;
  };
  bestCampaign: { campaignId: string; campaignName: string; leads: number; conversionRate: number } | null;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: Date;
  }>;
}

export interface RealTimeLeadEvent {
  type: 'NEW_LEAD' | 'LEAD_STATUS_CHANGED';
  payload: {
    lead: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      status: LeadStatus;
      campaignId: string;
      campaignName: string;
      createdAt: Date;
    };
    workspaceId: string;
  };
}

export interface SocketEvents {
  'join-workspace': (workspaceId: string) => void;
  'leave-workspace': (workspaceId: string) => void;
  'new-lead': (data: RealTimeLeadEvent) => void;
  'lead-status-changed': (data: RealTimeLeadEvent) => void;
  'analytics-update': (data: { campaignId: string; stats: Partial<DashboardStats> }) => void;
}