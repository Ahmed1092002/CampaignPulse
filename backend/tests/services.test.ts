import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../src/modules/auth/auth.service';
import { campaignService } from '../src/modules/campaigns/campaign.service';
import { leadService } from '../src/modules/leads/lead.service';
import { trackingService } from '../src/modules/tracking/tracking.service';
import { analyticsService } from '../src/modules/analytics/analytics.service';
import { notificationService } from '../src/modules/notifications/notification.service';
import { workspaceService } from '../src/modules/workspaces/workspace.service';
import { memberService } from '../src/modules/workspace-members/member.service';
import { landingPageService } from '../src/modules/landing-pages/landingPage.service';
import { auditLogService } from '../src/modules/audit-logs/auditLog.service';

vi.mock('../src/config/prisma', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    workspace: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    campaign: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    landingPage: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    lead: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    campaignSource: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    trackingEvent: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    notification: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    auditLog: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $transaction: vi.fn((cb) => cb(mockPrisma)),
  };

  return {
    PrismaClient: vi.fn(() => mockPrisma),
    default: mockPrisma,
  };
});

vi.mock('../src/config/redis', () => ({
  default: {
    connect: vi.fn(),
    quit: vi.fn(),
    on: vi.fn(),
  },
}));

vi.mock('bcryptjs', () => ({
  hash: vi.fn(() => 'hashed-password'),
  compare: vi.fn(() => true),
}));

vi.mock('jsonwebtoken', () => ({
  sign: vi.fn(() => 'mock-token'),
  verify: vi.fn(() => ({ userId: 'test-user-id', email: 'test@test.com', type: 'access' })),
  decode: vi.fn(() => ({ userId: 'test-user-id', email: 'test@test.com', type: 'access', exp: Date.now() / 1000 + 3600 })),
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register a new user', async () => {
    const prisma = require('../src/config/prisma').default;
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User',
      passwordHash: 'hashed',
    });
    prisma.workspaceMember.create.mockResolvedValue({});

    const result = await authService.register({
      email: 'test@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(result.user).toBeDefined();
    expect(result.tokens).toBeDefined();
    expect(result.user.email).toBe('test@test.com');
  });

  it('should throw error for duplicate email', async () => {
    const prisma = require('../src/config/prisma').default;
    prisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'test@test.com' });

    await expect(authService.register({
      email: 'test@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    })).rejects.toThrow('Email already registered');
  });
});

describe('Campaign Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a campaign', async () => {
    const prisma = require('../src/config/prisma').default;
    prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'ADMIN' });
    prisma.campaign.findUnique.mockResolvedValue(null);
    prisma.campaign.create.mockResolvedValue({
      id: 'campaign-1',
      name: 'Test Campaign',
      slug: 'test-campaign',
      workspaceId: 'workspace-1',
    });

    const result = await campaignService.createCampaign('workspace-1', 'user-1', {
      name: 'Test Campaign',
      slug: 'test-campaign',
      startDate: new Date(),
      channels: ['facebook'],
    });

    expect(result.name).toBe('Test Campaign');
    expect(result.slug).toBe('test-campaign');
  });
});

describe('Lead Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a lead', async () => {
    const prisma = require('../src/config/prisma').default;
    prisma.campaign.findUnique.mockResolvedValue({ id: 'campaign-1', workspaceId: 'workspace-1', status: 'PUBLISHED' });
    prisma.lead.findFirst.mockResolvedValue(null);
    prisma.lead.create.mockResolvedValue({
      id: 'lead-1',
      email: 'lead@test.com',
      firstName: 'Lead',
      lastName: 'User',
      status: 'NEW',
    });
    prisma.auditLog.create.mockResolvedValue({});

    const result = await leadService.createLead('workspace-1', {
      campaignId: 'campaign-1',
      firstName: 'Lead',
      lastName: 'User',
      email: 'lead@test.com',
    });

    expect(result.lead).toBeDefined();
    expect(result.isDuplicate).toBe(false);
  });

  it('should handle duplicate leads', async () => {
    const prisma = require('../src/config/prisma').default;
    prisma.campaign.findUnique.mockResolvedValue({ id: 'campaign-1', workspaceId: 'workspace-1', status: 'PUBLISHED' });
    prisma.lead.findFirst.mockResolvedValue({ id: 'existing-lead', email: 'lead@test.com' });
    prisma.lead.update.mockResolvedValue({ id: 'existing-lead', email: 'lead@test.com' });

    const result = await leadService.createLead('workspace-1', {
      campaignId: 'campaign-1',
      firstName: 'Lead',
      lastName: 'User',
      email: 'lead@test.com',
    });

    expect(result.isDuplicate).toBe(true);
  });
});

describe('Tracking Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a tracking event', async () => {
    const prisma = require('../src/config/prisma').default;
    prisma.campaign.findUnique.mockResolvedValue({ id: 'campaign-1' });
    prisma.trackingEvent.create.mockResolvedValue({
      id: 'event-1',
      type: 'PAGE_VIEW',
      campaignId: 'campaign-1',
    });

    const result = await trackingService.createTrackingEvent('workspace-1', {
      campaignId: 'campaign-1',
      type: 'PAGE_VIEW',
      sessionId: 'session-1',
    });

    expect(result.type).toBe('PAGE_VIEW');
  });
});

describe('Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return dashboard stats', async () => {
    const prisma = require('../src/config/prisma').default;
    prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'ADMIN' });
    prisma.trackingEvent.count.mockResolvedValue(100);
    prisma.lead.count.mockResolvedValue(10);
    prisma.lead.groupBy.mockResolvedValue([]);
    prisma.trackingEvent.findMany.mockResolvedValue([]);
    prisma.lead.findMany.mockResolvedValue([]);
    prisma.trackingEvent.groupBy.mockResolvedValue([]);
    prisma.campaign.findUnique.mockResolvedValue(null);

    const result = await analyticsService.getDashboardStats('workspace-1', 'user-1', {});

    expect(result.totalVisits).toBe(100);
    expect(result.totalLeads).toBe(10);
    expect(result.conversionRate).toBe(10);
  });
});

describe('Workspace Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a workspace', async () => {
    const prisma = require('../src/config/prisma').default;
    prisma.workspace.findUnique.mockResolvedValue(null);
    prisma.workspace.create.mockResolvedValue({
      id: 'workspace-1',
      name: 'Test Workspace',
      slug: 'test-workspace',
    });
    prisma.auditLog.create.mockResolvedValue({});

    const result = await workspaceService.createWorkspace('user-1', {
      name: 'Test Workspace',
      slug: 'test-workspace',
    });

    expect(result.name).toBe('Test Workspace');
    expect(result.slug).toBe('test-workspace');
  });
});

describe('Member Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should invite a member', async () => {
    const prisma = require('../src/config/prisma').default;
    prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'ADMIN' });
    prisma.user.findUnique.mockResolvedValue({ id: 'user-2', email: 'new@test.com' });
    prisma.workspaceMember.findUnique.mockResolvedValueOnce({ role: 'ADMIN' }).mockResolvedValueOnce(null);
    prisma.workspaceMember.create.mockResolvedValue({
      id: 'member-1',
      userId: 'user-2',
      role: 'MARKETER',
    });
    prisma.auditLog.create.mockResolvedValue({});

    const result = await memberService.inviteMember('workspace-1', 'user-1', {
      email: 'new@test.com',
      role: 'MARKETER',
    });

    expect(result.userId).toBe('user-2');
    expect(result.role).toBe('MARKETER');
  });
});

describe('Landing Page Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get or create landing page', async () => {
    const prisma = require('../src/config/prisma').default;
    prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'ADMIN' });
    prisma.campaign.findUnique.mockResolvedValue({ id: 'campaign-1', workspaceId: 'workspace-1' });
    prisma.landingPage.findUnique.mockResolvedValue(null);
    prisma.landingPage.create.mockResolvedValue({
      id: 'lp-1',
      campaignId: 'campaign-1',
      hero: {},
      features: [],
      testimonials: [],
      cta: {},
      leadForm: [],
      seo: {},
    });

    const result = await landingPageService.getLandingPage('workspace-1', 'user-1', 'campaign-1');

    expect(result.campaignId).toBe('campaign-1');
  });
});

describe('Audit Log Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create an audit log', async () => {
    const prisma = require('../src/config/prisma').default;
    prisma.auditLog.create.mockResolvedValue({
      id: 'audit-1',
      action: 'CAMPAIGN_CREATED',
    });

    const result = await auditLogService.createAuditLog({
      workspaceId: 'workspace-1',
      userId: 'user-1',
      entityType: 'Campaign',
      entityId: 'campaign-1',
      action: 'CAMPAIGN_CREATED',
    });

    expect(result.action).toBe('CAMPAIGN_CREATED');
  });
});