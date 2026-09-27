import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, requireWorkspace, requireMarketer, requireAdmin } from '../../middleware/auth';
import * as leadController from './lead.controller';
import { apiRateLimiter, publicFormRateLimiter } from '../../middleware/rateLimiter';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * /api/workspaces/{workspaceId}/leads:
 *   post:
 *     summary: Create a new lead (public endpoint for form submissions)
 *     tags: [Leads]
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
 *             $ref: '#/components/schemas/CreateLeadRequest'
 *     responses:
 *       201:
 *         description: Lead created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lead'
 *       400:
 *         description: Validation error
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/', publicFormRateLimiter, validate(leadController.leadValidators.create), leadController.createLead);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/leads:
 *   get:
 *     summary: List leads
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: campaignId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NEW, CONTACTED, QUALIFIED, WON, LOST]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of leads
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lead'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */
router.get('/', authenticate, requireWorkspace, apiRateLimiter, validate(leadController.leadValidators.list), leadController.getLeads);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/leads/stats:
 *   get:
 *     summary: Get lead statistics
 *     tags: [Leads]
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
 *     responses:
 *       200:
 *         description: Lead statistics
 */
router.get('/stats', authenticate, requireWorkspace, apiRateLimiter, leadController.getLeadStats);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/leads/{id}:
 *   get:
 *     summary: Get lead by ID
 *     tags: [Leads]
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
 *         description: Lead found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lead'
 *       404:
 *         description: Lead not found
 */
router.get('/:id', authenticate, requireWorkspace, apiRateLimiter, leadController.getLead);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/leads/{id}:
 *   patch:
 *     summary: Update lead
 *     tags: [Leads]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateLeadRequest'
 *     responses:
 *       200:
 *         description: Lead updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lead'
 *       403:
 *         description: Insufficient permissions
 */
router.patch('/:id', authenticate, requireWorkspace, requireMarketer, apiRateLimiter, validate(leadController.leadValidators.update), leadController.updateLead);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/leads/{id}:
 *   delete:
 *     summary: Delete lead
 *     tags: [Leads]
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
 *         description: Lead deleted
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/:id', authenticate, requireWorkspace, requireAdmin, apiRateLimiter, leadController.deleteLead);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/leads/{campaignId}/sources:
 *   post:
 *     summary: Generate UTM sources for campaign
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: string
 *         required: true
 *       - in: path
 *         name: campaignId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       201:
 *         description: Sources created
 */
router.post('/:campaignId/sources', authenticate, requireWorkspace, requireMarketer, apiRateLimiter, leadController.createSources);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/leads/{campaignId}/sources:
 *   get:
 *     summary: Get UTM sources for campaign
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: string
 *         required: true
 *       - in: path
 *         name: campaignId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Campaign sources
 */
router.get('/:campaignId/sources', authenticate, requireWorkspace, apiRateLimiter, leadController.getSources);

export default router;