import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import env from './config/env';
import logger from './config/logger';
import prisma from './config/prisma';
import redis from './config/redis';
import { initSocketServer } from './config/socket';
import { setupSwagger } from './config/swagger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';

import authRoutes from './modules/auth/auth.routes';
import workspaceRoutes from './modules/workspaces/workspace.routes';
import memberRoutes from './modules/workspace-members/member.routes';
import userRoutes from './modules/users/user.routes';
import campaignRoutes from './modules/campaigns/campaign.routes';
import landingPageRoutes from './modules/landing-pages/landingPage.routes';
import leadRoutes from './modules/leads/lead.routes';
import trackingRoutes from './modules/tracking/tracking.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import auditLogRoutes from './modules/audit-logs/auditLog.routes';
import emailRoutes from './modules/email/email.routes';
import webhookRoutes from './modules/webhooks/webhook.routes';

import './modules/jobs/job.workers';
import { scheduleDailySummaries } from './modules/jobs/job.workers';

const app = express();
const httpServer = createServer(app);
const io = initSocketServer(httpServer);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Workspace-ID'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(apiRateLimiter);

app.set('io', io);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

setupSwagger(app);

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/workspaces/:workspaceId/members', memberRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workspaces/:workspaceId/campaigns', campaignRoutes);
app.use('/api/workspaces/:workspaceId/landing-pages', landingPageRoutes);
app.use('/api/workspaces/:workspaceId/leads', leadRoutes);
app.use('/api/workspaces/:workspaceId/tracking', trackingRoutes);
app.use('/api/workspaces/:workspaceId/analytics', analyticsRoutes);
app.use('/api/workspaces/:workspaceId/notifications', notificationRoutes);
app.use('/api/workspaces/:workspaceId/audit-logs', auditLogRoutes);
app.use('/api/workspaces/:workspaceId/webhooks', webhookRoutes);
app.use('/api/email', emailRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');

    await redis.connect();
    logger.info('✅ Redis connected');

    await scheduleDailySummaries();
    logger.info('✅ Daily summaries scheduled');

    httpServer.listen(env.PORT, env.HOST, () => {
      logger.info(`🚀 Server running on http://${env.HOST}:${env.PORT}`);
      logger.info(`📚 API Docs: http://${env.HOST}:${env.PORT}/api-docs`);
      logger.info(`🔌 Socket.IO ready`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

const shutdown = async () => {
  logger.info('Shutting down...');
  await prisma.$disconnect();
  await redis.quit();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();