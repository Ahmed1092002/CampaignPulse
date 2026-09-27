import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, requireWorkspace, requireViewer } from '../../middleware/auth';
import * as trackingController from './tracking.controller';
import { apiRateLimiter, trackingRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

/**
 * @swagger
 * /api/workspaces/{workspaceId}/tracking:
 *   post:
 *     summary: Track a single event (public endpoint)
 *     tags: [Tracking]
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
 *             $ref: '#/components/schemas/TrackEventRequest'
 *     responses:
 *       200:
 *         description: Event tracked
 *       400:
 *         description: Validation error
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/', trackingRateLimiter, validate(trackingController.trackingValidators.event), trackingController.trackEvent);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/tracking/batch:
 *   post:
 *     summary: Track multiple events in batch (public endpoint)
 *     tags: [Tracking]
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
 *               events:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TrackEventRequest'
 *     responses:
 *       200:
 *         description: Events tracked
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/batch', trackingRateLimiter, trackingController.trackEventsBatch);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/tracking:
 *   get:
 *     summary: Get tracking events (protected)
 *     tags: [Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: campaignId
 *         schema:
 *           type: string
 *       - in: query
 *         name: leadId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PAGE_VIEW, CTA_CLICK, FORM_START, FORM_SUBMIT]
 *       - in: query
 *         name: sessionId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Tracking events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TrackingEvent'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */
router.get('/', authenticate, requireWorkspace, requireViewer, apiRateLimiter, trackingController.getEvents);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/tracking/counts:
 *   get:
 *     summary: Get event counts by type
 *     tags: [Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: campaignId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Event counts
 */
router.get('/counts', authenticate, requireWorkspace, requireViewer, apiRateLimiter, trackingController.getEventCounts);

export default router;