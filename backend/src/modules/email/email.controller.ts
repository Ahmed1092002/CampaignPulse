import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { emailTestSchema, emailCustomSchema } from '../../utils/validators';
import { emailService } from './email.service';
import { successResponse } from '../../utils/helpers';

export async function sendTestEmail(req: AuthenticatedRequest, res: Response) {
  if (!req.user) throw new Error('User not authenticated');
  
  const { to, template = 'member_invited' } = req.body;
  
  const result = await emailService.send({
    to: to || req.user.email,
    template,
    templateData: {
      workspaceName: 'Demo Workspace',
      inviterName: 'Admin User',
      role: 'MARKETER',
      inviteUrl: `${process.env.FRONTEND_URL}/invite/demo-token`,
      leadName: 'John Doe',
      leadEmail: 'john@example.com',
      leadPhone: '+1-555-0123',
      campaignName: 'Summer Campaign',
      source: 'Facebook Ads',
      timestamp: new Date().toISOString(),
      leadUrl: `${process.env.FRONTEND_URL}/leads/demo-lead-id`,
      oldStatus: 'NEW',
      newStatus: 'QUALIFIED',
      publicUrl: `${process.env.FRONTEND_URL}/p/summer-campaign`,
      resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=demo`,
      workspaceName: 'Demo Workspace',
      date: new Date().toLocaleDateString(),
      visits: 1250,
      leads: 42,
      conversionRate: 3.36,
      newLeads: 5,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
    },
  });

  res.json(successResponse({ sent: result }));
}

export async function sendCustomEmail(req: AuthenticatedRequest, res: Response) {
  if (!req.user) throw new Error('User not authenticated');
  
  const { to, subject, html, text } = req.body;
  
  const result = await emailService.send({
    to,
    subject,
    html,
    text,
  });

  res.json(successResponse({ sent: result }));
}

export const emailValidators = {
  test: emailTestSchema,
  custom: emailCustomSchema,
};