import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import env from '../config/env';
import logger from '../config/logger';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: Record<string, unknown>;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured = false;
  private templates: Map<string, (data: Record<string, unknown>) => EmailTemplate> = new Map();

  constructor() {
    this.initializeTransporter();
    this.registerDefaultTemplates();
  }

  private initializeTransporter() {
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
      logger.warn('⚠️ Email not configured - SMTP credentials missing. Emails will be logged only.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: env.NODE_ENV === 'production',
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 10,
      });

      this.transporter.verify((error) => {
        if (error) {
          logger.error('❌ Email transporter verification failed:', error);
          this.isConfigured = false;
        } else {
          logger.info('✅ Email transporter ready');
          this.isConfigured = true;
        }
      });
    } catch (error) {
      logger.error('❌ Failed to create email transporter:', error);
    }
  }

  private registerDefaultTemplates() {
    // Member invitation
    this.registerTemplate('member_invited', (data) => ({
      subject: `You're invited to join ${data.workspaceName} on CampaignPulse`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">CampaignPulse</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <h2 style="color: #1e293b; margin-top: 0;">You're invited!</h2>
            <p><strong>${data.inviterName}</strong> invited you to join <strong>${data.workspaceName}</strong> as a <strong>${data.role}</strong>.</p>
            <p>CampaignPulse helps marketing teams create campaigns, build landing pages, capture leads, and analyze performance in real-time.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.inviteUrl}" style="background: #0ea5e9; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Accept Invitation</a>
            </div>
            <p style="color: #64748b; font-size: 14px;">This invitation expires in 7 days. If you didn't expect this, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #94a3b8; font-size: 12px;">CampaignPulse • Multi-tenant Campaign Analytics Platform</p>
          </div>
        </body>
        </html>
      `,
      text: `You're invited to join ${data.workspaceName} on CampaignPulse!\n\n${data.inviterName} invited you as a ${data.role}.\n\nAccept here: ${data.inviteUrl}\n\nExpires in 7 days.`,
    }));

    // New lead notification
    this.registerTemplate('new_lead', (data) => ({
      subject: `New lead: ${data.leadName} from ${data.campaignName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 New Lead Captured!</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #1e293b;">Lead Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #64748b;">Name</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${data.leadName}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;">Email</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${data.leadEmail}</td></tr>
                ${data.leadPhone ? `<tr><td style="padding: 8px 0; color: #64748b;">Phone</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${data.leadPhone}</td></tr>` : ''}
                <tr><td style="padding: 8px 0; color: #64748b;">Campaign</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${data.campaignName}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;">Source</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${data.source || 'Direct'}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;">Time</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${new Date(data.timestamp).toLocaleString()}</td></tr>
              </table>
            </div>
            <div style="text-align: center;">
              <a href="${data.leadUrl}" style="background: #22c55e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">View Lead in Dashboard</a>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #94a3b8; font-size: 12px;">CampaignPulse • Real-time Lead Notifications</p>
          </div>
        </body>
        </html>
      `,
      text: `New lead: ${data.leadName} from ${data.campaignName}\nEmail: ${data.leadEmail}\nSource: ${data.source || 'Direct'}\nTime: ${new Date(data.timestamp).toLocaleString()}\nView: ${data.leadUrl}`,
    }));

    // Lead status changed
    this.registerTemplate('lead_status_changed', (data) => ({
      subject: `Lead status updated: ${data.leadName} → ${data.newStatus}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📋 Lead Status Updated</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <p><strong>${data.leadName}</strong> (<a href="mailto:${data.leadEmail}">${data.leadEmail}</a>) status changed in <strong>${data.campaignName}</strong>.</p>
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
              <p style="margin: 0;"><span style="background: #fef3c7; color: #b45309; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">${data.oldStatus}</span> → <span style="background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">${data.newStatus}</span></p>
            </div>
            <div style="text-align: center;">
              <a href="${data.leadUrl}" style="background: #f59e0b; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">View Lead</a>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Lead status updated: ${data.leadName} (${data.leadEmail})\n${data.oldStatus} → ${data.newStatus}\nCampaign: ${data.campaignName}\nView: ${data.leadUrl}`,
    }));

    // Campaign published
    this.registerTemplate('campaign_published', (data) => ({
      subject: `Campaign published: ${data.campaignName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🚀 Campaign Published!</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <p><strong>${data.campaignName}</strong> is now live and accepting leads.</p>
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
              <p style="margin: 0 0 10px;"><strong>Public URL:</strong></p>
              <p style="margin: 0; word-break: break-all;"><a href="${data.publicUrl}" style="color: #0ea5e9;">${data.publicUrl}</a></p>
            </div>
            <div style="text-align: center;">
              <a href="${data.publicUrl}" style="background: #8b5cf6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">View Live Campaign</a>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Campaign published: ${data.campaignName}\nPublic URL: ${data.publicUrl}`,
    }));

    // Password reset
    this.registerTemplate('password_reset', (data) => ({
      subject: 'Reset your CampaignPulse password',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Password Reset</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <p>You requested to reset your password. Click the button below to create a new one:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.resetUrl}" style="background: #ef4444; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #64748b; font-size: 14px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
            <p style="color: #94a3b8; font-size: 12px;">For security, this link can only be used once.</p>
          </div>
        </body>
        </html>
      `,
      text: `Reset your password: ${data.resetUrl}\nExpires in 1 hour. If you didn't request this, ignore this email.`,
    }));

    // Daily summary
    this.registerTemplate('daily_summary', (data) => ({
      subject: `Daily Summary - ${data.workspaceName} • ${data.date}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📊 Daily Summary</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">${data.workspaceName} • ${data.date}</p>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                <p style="margin: 0; color: #64748b; font-size: 14px;">Visits</p>
                <p style="margin: 5px 0 0; font-size: 28px; font-weight: 700; color: #0ea5e9;">${data.visits.toLocaleString()}</p>
              </div>
              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                <p style="margin: 0; color: #64748b; font-size: 14px;">Leads</p>
                <p style="margin: 5px 0 0; font-size: 28px; font-weight: 700; color: #22c55e;">${data.leads.toLocaleString()}</p>
              </div>
              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                <p style="margin: 0; color: #64748b; font-size: 14px;">Conversion</p>
                <p style="margin: 5px 0 0; font-size: 28px; font-weight: 700; color: #8b5cf6;">${data.conversionRate.toFixed(2)}%</p>
              </div>
              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                <p style="margin: 0; color: #64748b; font-size: 14px;">New Leads</p>
                <p style="margin: 5px 0 0; font-size: 28px; font-weight: 700; color: #f59e0b;">${data.newLeads.toLocaleString()}</p>
              </div>
            </div>
            <div style="text-align: center;">
              <a href="${data.dashboardUrl}" style="background: #0ea5e9; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">View Full Dashboard</a>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">CampaignPulse • Automated Daily Report</p>
          </div>
        </body>
        </html>
      `,
      text: `Daily Summary - ${data.workspaceName} • ${data.date}\nVisits: ${data.visits}\nLeads: ${data.leads}\nConversion: ${data.conversionRate.toFixed(2)}%\nNew Leads: ${data.newLeads}\nView Dashboard: ${data.dashboardUrl}`,
    }));
  }

  registerTemplate(name: string, generator: (data: Record<string, unknown>) => EmailTemplate) {
    this.templates.set(name, generator);
  }

  async send(options: EmailOptions): Promise<boolean> {
    const { to, subject, html, text, template, templateData } = options;

    let emailHtml = html;
    let emailText = text;

    if (template && this.templates.has(template)) {
      const generated = this.templates.get(template)!(templateData || {});
      emailHtml = generated.html;
      emailText = generated.text;
      if (!subject) subject = generated.subject;
    }

    if (!subject) {
      logger.error('❌ Email subject is required');
      return false;
    }

    const from = env.SMTP_FROM || `CampaignPulse <${env.SMTP_USER}>`;

    const mailOptions: SendMailOptions = {
      from,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html: emailHtml,
      text: emailText,
    };

    // Development mode - log instead of send
    if (!this.isConfigured || env.NODE_ENV === 'development') {
      logger.info('📧 [DEV MODE] Email would be sent:', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        hasHtml: !!emailHtml,
        hasText: !!emailText,
      });
      return true;
    }

    try {
      await this.transporter!.sendMail(mailOptions);
      logger.info('✅ Email sent successfully', { to: mailOptions.to, subject });
      return true;
    } catch (error) {
      logger.error('❌ Failed to send email:', error);
      return false;
    }
  }

  async sendBulk(emails: EmailOptions[]): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      const result = await this.send(email);
      if (result) sent++;
      else failed++;
    }

    return { sent, failed };
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) return false;
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}

export const emailService = new EmailService();
export default emailService;