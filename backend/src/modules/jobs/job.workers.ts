import { Queue, Worker, Job } from 'bullmq';
import redis from '../../config/redis';
import prisma from '../../config/prisma';
import logger from '../../config/logger';
import * as notificationService from '../notifications/notification.service';
import * as leadService from '../leads/lead.service';
import * as analyticsService from '../analytics/analytics.service';
import { emailService } from '../email/email.service';
import { NotificationType, LeadStatus } from '@prisma/client';
import env from '../../config/env';

const analyticsQueue = new Queue('analytics', { connection: redis });
const notificationQueue = new Queue('notifications', { connection: redis });
const leadQueue = new Queue('leads', { connection: redis });
const summaryQueue = new Queue('summaries', { connection: redis });
const webhookQueue = new Queue('webhooks', { connection: redis });

export { analyticsQueue, notificationQueue, leadQueue, summaryQueue, webhookQueue };

// Analytics Aggregation Worker
new Worker('analytics', async (job: Job) => {
  const { workspaceId, campaignId, eventType, sessionId, leadId } = job.data;

  try {
    logger.debug('Processing analytics event', { workspaceId, campaignId, eventType });
  } catch (error) {
    logger.error('Analytics worker error', { error, jobId: job.id });
    throw error;
  }
}, { connection: redis, concurrency: 5 });

// Notification Worker
new Worker('notifications', async (job: Job) => {
  const { type, workspaceId, userIds, title, message, data } = job.data;

  try {
    if (userIds && userIds.length > 0) {
      await notificationService.createBulkNotifications(
        userIds.map((userId: string) => ({
          userId,
          workspaceId,
          type: type as NotificationType,
          title,
          message,
          data,
        }))
      );
    }
  } catch (error) {
    logger.error('Notification worker error', { error, jobId: job.id });
    throw error;
  }
}, { connection: redis, concurrency: 10 });

// Lead Processing Worker (deduplication, CRM webhook)
new Worker('leads', async (job: Job) => {
  const { leadId, workspaceId, action } = job.data;

  try {
    if (action === 'deduplicate') {
      logger.debug('Processing lead deduplication', { leadId });
    } else if (action === 'crm_webhook') {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { campaign: true, workspace: true },
      });

      if (lead && lead.status === LeadStatus.QUALIFIED) {
        await simulateCrmWebhook(lead);
      }
    }
  } catch (error) {
    logger.error('Lead worker error', { error, jobId: job.id });
    throw error;
  }
}, { connection: redis, concurrency: 5 });

// Daily Summary Worker
new Worker('summaries', async (job: Job) => {
  const { workspaceId, date } = job.data;

  try {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const campaigns = await prisma.campaign.findMany({
      where: { workspaceId, status: 'PUBLISHED' },
      select: { id: true },
    });

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    });

    let totalVisits = 0;
    let totalLeads = 0;
    let totalNewLeads = 0;

    for (const campaign of campaigns) {
      const stats = await analyticsService.getDashboardStats(workspaceId, 'system', {
        campaignId: campaign.id,
        startDate: targetDate,
        endDate: nextDay,
      });

      totalVisits += stats.totalVisits;
      totalLeads += stats.totalLeads;
      totalNewLeads += stats.totalLeads;

      logger.info('Daily summary generated', { workspaceId, campaignId: campaign.id, stats });
    }

    const conversionRate = totalVisits > 0 ? (totalLeads / totalVisits) * 100 : 0;

    const admins = await prisma.workspaceMember.findMany({
      where: { workspaceId, role: 'ADMIN' },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
    });

    for (const admin of admins) {
      await emailService.send({
        to: admin.user.email,
        template: 'daily_summary',
        templateData: {
          workspaceName: workspace?.name || 'Workspace',
          date: targetDate.toLocaleDateString(),
          visits: totalVisits,
          leads: totalLeads,
          conversionRate,
          newLeads: totalNewLeads,
          dashboardUrl: `${env.FRONTEND_URL}/dashboard`,
        },
      }).catch(err => console.error('Failed to send daily summary email:', err));
    }
  } catch (error) {
    logger.error('Summary worker error', { error, jobId: job.id });
    throw error;
  }
}, { connection: redis, concurrency: 2 });

// Webhook Worker
new Worker('webhooks', async (job: Job) => {
  const { url, payload, retries = 0 } = job.data;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }

    logger.info('Webhook delivered successfully', { url });
  } catch (error) {
    logger.error('Webhook worker error', { error, jobId: job.id, url });
    if (retries < 3) {
      await webhookQueue.add('deliver', { url, payload, retries: retries + 1 }, {
        delay: Math.pow(2, retries) * 1000,
      });
    }
    throw error;
  }
}, { connection: redis, concurrency: 5 });

async function simulateCrmWebhook(lead: any) {
  const webhookUrl = process.env.CRM_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.info('CRM webhook URL not configured, skipping', { leadId: lead.id });
    return;
  }

  const payload = {
    event: 'lead_qualified',
    lead: {
      id: lead.id,
      email: lead.email,
      firstName: lead.firstName,
      lastName: lead.lastName,
      phone: lead.phone,
      customFields: lead.customFields,
      utmSource: lead.utmSource,
      utmMedium: lead.utmMedium,
      utmCampaign: lead.utmCampaign,
      campaignName: lead.campaign?.name,
      workspaceName: lead.workspace?.name,
      qualifiedAt: new Date(),
    },
  };

  await webhookQueue.add('deliver', { url: webhookUrl, payload });
  logger.info('CRM webhook queued', { leadId: lead.id });
}

export async function queueAnalyticsEvent(data: { workspaceId: string; campaignId: string; eventType: string; sessionId: string; leadId?: string }) {
  await analyticsQueue.add('process', data);
}

export async function queueNotification(data: {
  type: NotificationType;
  workspaceId: string;
  userIds: string[];
  title: string;
  message: string;
  data?: Record<string, unknown>;
}) {
  await notificationQueue.add('send', data);
}

export async function queueLeadProcessing(leadId: string, workspaceId: string, action: 'deduplicate' | 'crm_webhook') {
  await leadQueue.add('process', { leadId, workspaceId, action });
}

export async function queueDailySummary(workspaceId: string, date?: Date) {
  await summaryQueue.add('generate', { workspaceId, date });
}

export async function scheduleDailySummaries() {
  const workspaces = await prisma.workspace.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  for (const workspace of workspaces) {
    await summaryQueue.add('generate', { workspaceId: workspace.id }, {
      repeat: { pattern: '0 1 * * *' }, // 1 AM daily
    });
  }
}