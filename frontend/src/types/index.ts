export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  locale: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  workspaces?: WorkspaceMembership[];
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  settings: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role?: UserRole;
  _count?: {
    campaigns: number;
    members: number;
  };
}

export interface WorkspaceMembership {
  id: string;
  userId: string;
  workspaceId: string;
  role: UserRole;
  joinedAt: string;
  workspace: Workspace;
  user?: User;
}

export type UserRole = 'ADMIN' | 'MARKETER' | 'VIEWER';

export interface Campaign {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description?: string;
  goal?: string;
  startDate: string;
  endDate?: string;
  budget?: number;
  channels: string[];
  status: CampaignStatus;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  landingPage?: LandingPage;
  sources?: CampaignSource[];
  _count?: {
    leads: number;
    trackingEvents: number;
  };
}

export type CampaignStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED';

export interface LandingPage {
  id: string;
  campaignId: string;
  hero: HeroSection;
  features: FeatureSection[];
  testimonials: TestimonialSection[];
  cta: CTASection;
  leadForm: LeadFormField[];
  seo: SEOSection;
  customCss?: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HeroSection {
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaLink: string;
  backgroundImage?: string;
}

export interface FeatureSection {
  title: string;
  description: string;
  icon: string;
}

export interface TestimonialSection {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar?: string;
}

export interface CTASection {
  headline: string;
  subheadline: string;
  buttonText: string;
  buttonLink: string;
}

export interface LeadFormField {
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea';
  name: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export interface SEOSection {
  title: string;
  description: string;
  ogImage?: string;
  canonicalUrl?: string;
}

export interface CampaignSource {
  id: string;
  campaignId: string;
  name: string;
  channel: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm?: string;
  utmContent?: string;
  qrCodeUrl?: string;
  shortUrl?: string;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  campaignId: string;
  workspaceId: string;
  sourceId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  customFields: Record<string, unknown>;
  status: LeadStatus;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrer?: string;
  ipAddress?: string;
  userAgent?: string;
  convertedAt?: string;
  createdAt: string;
  updatedAt: string;
  campaign?: Pick<Campaign, 'id' | 'name' | 'slug'>;
  source?: Pick<CampaignSource, 'id' | 'name' | 'channel'>;
  trackingEvents?: TrackingEvent[];
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'WON' | 'LOST';

export interface TrackingEvent {
  id: string;
  campaignId: string;
  leadId?: string;
  workspaceId: string;
  type: TrackingEventType;
  sessionId: string;
  pageUrl?: string;
  elementId?: string;
  elementType?: string;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export type TrackingEventType = 'PAGE_VIEW' | 'CTA_CLICK' | 'FORM_START' | 'FORM_SUBMIT';

export interface Notification {
  id: string;
  userId: string;
  workspaceId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export type NotificationType =
  | 'NEW_LEAD'
  | 'LEAD_STATUS_CHANGED'
  | 'CAMPAIGN_PUBLISHED'
  | 'CAMPAIGN_PAUSED'
  | 'MEMBER_INVITED'
  | 'MEMBER_REMOVED';

export interface AuditLog {
  id: string;
  workspaceId: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
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
    createdAt: string;
  }>;
  compareData?: DashboardStats;
}

export interface RealtimeStats {
  activeVisitors: number;
  recentLeads: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    campaign: { name: string };
    createdAt: string;
  }>;
  recentEvents: Array<{
    type: string;
    campaign: { name: string };
    createdAt: string;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
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
  startDate: string;
  endDate?: string;
  budget?: number;
  channels: string[];
  status?: CampaignStatus;
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  channels?: string[];
  status?: CampaignStatus;
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

export interface AnalyticsQueryParams {
  campaignId?: string;
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
  channel?: string;
  compareEnabled?: boolean;
  compareStartDate?: string;
  compareEndDate?: string;
}