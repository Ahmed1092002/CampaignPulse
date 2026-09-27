import { Router } from 'express';
import { authenticate, requireWorkspace, requireAdmin } from '../../middleware/auth';
import * as webhookController from './webhook.controller';
import { apiRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

/**
 * @swagger
 * /api/workspaces/{workspaceId}/webhooks/crm:
 *   post:
 *     summary: CRM webhook endpoint for lead synchronization
 *     tags: [Webhooks]
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 enum: [lead.created, lead.updated, lead.deleted]
 *               lead:
 *                 $ref: '#/components/schemas/Lead'
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Webhook processed
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Invalid signature
 */
router.post('/crm', webhookController.handleCRMWebhook);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/webhooks:
 *   get:
 *     summary: List configured webhooks
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: List of webhooks
 */
router.get('/', authenticate, requireWorkspace, requireAdmin, apiRateLimiter, webhookController.listWebhooks);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/webhooks:
 *   post:
 *     summary: Create a new webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *               secret:
 *                 type: string
 *     responses:
 *       201:
 *         description: Webhook created
 */
router.post('/', authenticate, requireWorkspace, requireAdmin, apiRateLimiter, webhookController.createWebhook);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/webhooks/{id}:
 *   delete:
 *     summary: Delete a webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: string
 *         required: true
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Webhook deleted
 */
router.delete('/:id', authenticate, requireWorkspace, requireAdmin, apiRateLimiter, webhookController.deleteWebhook);

export default router;