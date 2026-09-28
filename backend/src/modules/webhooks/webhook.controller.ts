import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import crypto from 'crypto';
import { webhookCreateSchema } from '../../utils/validators';

interface WebhookPayload {
  event: 'lead.created' | 'lead.updated' | 'lead.deleted';
  lead: any;
  timestamp: string;
}

export const handleCRMWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId;
    const payload: WebhookPayload = req.body;

    // Verify webhook signature if secret is configured
    const webhook = await prisma.webhook.findFirst({
      where: { workspaceId, url: { contains: 'crm' } },
    });

    if (webhook?.secret) {
      const signature = req.headers['x-webhook-signature'] as string;
      const expectedSignature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    // Process the webhook event
    switch (payload.event) {
      case 'lead.created':
        await prisma.lead.create({
          data: {
            ...payload.lead,
            workspaceId,
            campaignId: payload.lead.campaignId,
          },
        });
        break;
      case 'lead.updated':
        await prisma.lead.update({
          where: { id: payload.lead.id },
          data: payload.lead,
        });
        break;
      case 'lead.deleted':
        await prisma.lead.delete({
          where: { id: payload.lead.id },
        });
        break;
    }

    // Log webhook delivery
    await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook?.id || 'unknown',
        event: payload.event,
        payload,
        status: 'SUCCESS',
        responseCode: 200,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('CRM webhook error:', error);
    
    // Log failed delivery
    try {
      const webhook = await prisma.webhook.findFirst({
        where: { workspaceId: req.params.workspaceId, url: { contains: 'crm' } },
      });
      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook?.id || 'unknown',
          event: req.body.event,
          payload: req.body,
          status: 'FAILED',
          responseCode: 500,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } catch {}

    next(error);
  }
};

export const listWebhooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId;
    const webhooks = await prisma.webhook.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: webhooks });
  } catch (error) {
    next(error);
  }
};

export const createWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId;
    const { url, events, secret } = req.body;

    const webhook = await prisma.webhook.create({
      data: {
        workspaceId,
        url,
        events: events || ['lead.created', 'lead.updated', 'lead.deleted'],
        secret,
      },
    });

    res.status(201).json({ data: webhook });
  } catch (error) {
    next(error);
  }
};

export const deleteWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId;
    const { id } = req.params;

    await prisma.webhook.delete({
      where: { id, workspaceId },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const webhookValidators = {
  create: webhookCreateSchema,
  delete: webhookDeleteSchema,
};