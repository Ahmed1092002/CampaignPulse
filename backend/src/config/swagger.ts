import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import env from '../config/env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CampaignPulse API',
      version: '1.0.0',
      description: 'Multi-tenant campaign analytics and lead-management platform API',
      contact: {
        name: 'CampaignPulse Support',
        email: 'support@campaignpulse.com',
      },
    },
    servers: [
      {
        url: env.FRONTEND_URL.replace('3000', '3001'),
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'object' },
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            avatarUrl: { type: 'string', nullable: true },
            locale: { type: 'string' },
            isActive: { type: 'boolean' },
            lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Workspace: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            logoUrl: { type: 'string', nullable: true },
            settings: { type: 'object' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            role: { type: 'string', enum: ['ADMIN', 'MARKETER', 'VIEWER'] },
          },
        },
        Campaign: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            workspaceId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            goal: { type: 'string', nullable: true },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time', nullable: true },
            budget: { type: 'number', format: 'decimal', nullable: true },
            channels: { type: 'array', items: { type: 'string' } },
            status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'PAUSED', 'ARCHIVED'] },
            publishedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Lead: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            campaignId: { type: 'string', format: 'uuid' },
            workspaceId: { type: 'string', format: 'uuid' },
            sourceId: { type: 'string', format: 'uuid', nullable: true },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', nullable: true },
            customFields: { type: 'object' },
            status: { type: 'string', enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST'] },
            utmSource: { type: 'string', nullable: true },
            utmMedium: { type: 'string', nullable: true },
            utmCampaign: { type: 'string', nullable: true },
            utmTerm: { type: 'string', nullable: true },
            utmContent: { type: 'string', nullable: true },
            referrer: { type: 'string', nullable: true },
            ipAddress: { type: 'string', nullable: true },
            userAgent: { type: 'string', nullable: true },
            convertedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        TrackingEvent: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            campaignId: { type: 'string', format: 'uuid' },
            leadId: { type: 'string', format: 'uuid', nullable: true },
            workspaceId: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['PAGE_VIEW', 'CTA_CLICK', 'FORM_START', 'FORM_SUBMIT'] },
            sessionId: { type: 'string' },
            pageUrl: { type: 'string', nullable: true },
            elementId: { type: 'string', nullable: true },
            elementType: { type: 'string', nullable: true },
            metadata: { type: 'object' },
            ipAddress: { type: 'string', nullable: true },
            userAgent: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        DashboardStats: {
          type: 'object',
          properties: {
            totalVisits: { type: 'integer' },
            totalLeads: { type: 'integer' },
            conversionRate: { type: 'number' },
            leadsByCampaign: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  campaignId: { type: 'string' },
                  campaignName: { type: 'string' },
                  count: { type: 'integer' },
                },
              },
            },
            leadsBySource: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  source: { type: 'string' },
                  count: { type: 'integer' },
                },
              },
            },
            dailyTrends: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string' },
                  visits: { type: 'integer' },
                  leads: { type: 'integer' },
                },
              },
            },
            funnel: {
              type: 'object',
              properties: {
                pageViews: { type: 'integer' },
                ctaClicks: { type: 'integer' },
                formStarts: { type: 'integer' },
                formSubmits: { type: 'integer' },
              },
            },
            bestCampaign: {
              type: 'object',
              nullable: true,
              properties: {
                campaignId: { type: 'string' },
                campaignName: { type: 'string' },
                leads: { type: 'integer' },
                conversionRate: { type: 'number' },
              },
            },
            recentActivity: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  message: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Workspaces', description: 'Workspace management' },
      { name: 'Members', description: 'Workspace member management' },
      { name: 'Campaigns', description: 'Campaign management' },
      { name: 'Landing Pages', description: 'Landing page builder' },
      { name: 'Leads', description: 'Lead management' },
      { name: 'Tracking', description: 'Event tracking' },
      { name: 'Analytics', description: 'Analytics and reporting' },
      { name: 'Notifications', description: 'Notifications' },
      { name: 'Audit Logs', description: 'Audit logging' },
    ],
  },
  apis: ['./src/modules/**/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'CampaignPulse API Documentation',
  }));

  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}