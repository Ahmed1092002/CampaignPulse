import { z } from 'zod';
import { UserRole, CampaignStatus, LeadStatus, TrackingEventType } from '@prisma/client';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
    description: z.string().max(500).optional(),
  }),
});

export const updateWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    logoUrl: z.string().url().optional().nullable(),
    settings: z.record(z.unknown()).optional(),
  }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email(),
    role: z.nativeEnum(UserRole),
  }),
});

export const updateMemberRoleSchema = z.object({
  body: z.object({
    role: z.nativeEnum(UserRole),
  }),
  params: z.object({
    memberId: z.string().uuid(),
  }),
});

export const createCampaignSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
    description: z.string().max(2000).optional(),
    goal: z.string().max(1000).optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional().nullable(),
    budget: z.number().positive().max(999999999.99).optional().nullable(),
    channels: z.array(z.string()).min(1),
    status: z.nativeEnum(CampaignStatus).default(CampaignStatus.DRAFT),
  }),
});

export const updateCampaignSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    goal: z.string().max(1000).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional().nullable(),
    budget: z.number().positive().max(999999999.99).optional().nullable(),
    channels: z.array(z.string()).optional(),
    status: z.nativeEnum(CampaignStatus).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const landingPageSchema = z.object({
  body: z.object({
    hero: z.record(z.unknown()).optional(),
    features: z.array(z.unknown()).optional(),
    testimonials: z.array(z.unknown()).optional(),
    cta: z.record(z.unknown()).optional(),
    leadForm: z.array(z.unknown()).optional(),
    seo: z.record(z.unknown()).optional(),
    customCss: z.string().optional(),
    isPublished: z.boolean().optional(),
  }),
});

export const createLeadSchema = z.object({
  body: z.object({
    campaignId: z.string().uuid(),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().max(20).optional(),
    customFields: z.record(z.unknown()).optional(),
    utmSource: z.string().max(100).optional(),
    utmMedium: z.string().max(100).optional(),
    utmCampaign: z.string().max(100).optional(),
    utmTerm: z.string().max(100).optional(),
    utmContent: z.string().max(100).optional(),
    referrer: z.string().url().optional(),
    ipAddress: z.string().max(45).optional(),
    userAgent: z.string().max(500).optional(),
  }),
});

export const updateLeadSchema = z.object({
  body: z.object({
    status: z.nativeEnum(LeadStatus).optional(),
    customFields: z.record(z.unknown()).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const trackingEventSchema = z.object({
  body: z.object({
    campaignId: z.string().uuid(),
    type: z.nativeEnum(TrackingEventType),
    sessionId: z.string().min(1),
    pageUrl: z.string().url().optional(),
    elementId: z.string().optional(),
    elementType: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    ipAddress: z.string().max(45).optional(),
    userAgent: z.string().max(500).optional(),
    leadId: z.string().uuid().optional(),
  }),
});

export const createSourceSchema = z.object({
  body: z.object({
    campaignId: z.string().uuid(),
    name: z.string().min(1).max(100),
    channel: z.string().min(1).max(50),
    utmSource: z.string().min(1).max(100),
    utmMedium: z.string().min(1).max(100),
    utmCampaign: z.string().min(1).max(100),
    utmTerm: z.string().max(100).optional(),
    utmContent: z.string().max(100).optional(),
  }),
});

export const analyticsQuerySchema = z.object({
  query: z.object({
    campaignId: z.string().uuid().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    groupBy: z.enum(['day', 'week', 'month']).default('day'),
    channel: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(8).max(128),
    newPassword: z.string().min(8).max(128),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8).max(128),
  }),
});

export const verifyResetTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1),
  }),
});

export const emailTestSchema = z.object({
  body: z.object({
    to: z.string().email(),
    template: z.string().optional(),
  }),
});

export const emailCustomSchema = z.object({
  body: z.object({
    to: z.string().email(),
    subject: z.string().min(1).max(200),
    html: z.string().optional(),
    text: z.string().optional(),
  }),
});

export const auditLogQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    entityType: z.string().optional(),
    entityId: z.string().optional(),
    userId: z.string().optional(),
    action: z.string().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
});

export const trackingBatchSchema = z.object({
  body: z.object({
    events: z.array(trackingEventSchema.shape.body).min(1).max(100),
  }),
});

export const webhookCreateSchema = z.object({
  body: z.object({
    url: z.string().url(),
    events: z.array(z.string()).optional(),
    secret: z.string().optional(),
  }),
  params: z.object({
    workspaceId: z.string().uuid(),
  }),
});

export const webhookDeleteSchema = z.object({
  params: z.object({
    workspaceId: z.string().uuid(),
    id: z.string().uuid(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    locale: z.enum(['en', 'ar']).optional(),
    avatarUrl: z.string().url().optional().nullable(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    avatarUrl: z.string().url().optional().nullable(),
    locale: z.enum(['en', 'ar']).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const updateWorkspaceSettingsSchema = z.object({
  body: z.object({
    settings: z.record(z.unknown()).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const createSourceParamsSchema = z.object({
  params: z.object({
    campaignId: z.string().uuid(),
  }),
});

export const leaveWorkspaceSchema = z.object({
  params: z.object({
    workspaceId: z.string().uuid(),
  }),
});

export const duplicateLandingPageSchema = z.object({
  body: z.object({
    targetCampaignId: z.string().uuid(),
  }),
  params: z.object({
    campaignId: z.string().uuid(),
  }),
});

export const campaignAnalyticsParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    groupBy: z.enum(['day', 'week', 'month']).default('day'),
    channel: z.string().optional(),
  }),
});