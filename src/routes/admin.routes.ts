import { Router } from 'express';
import { queueController } from '../controllers/queue.controller';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { strictLimiter } from '../middleware/rateLimit.middleware';
import { param, query } from 'express-validator';
import { handleValidationErrors } from '../middleware/validate.middleware';

const router = Router();

router.use(authenticate, authorize('admin'), strictLimiter);

/**
 * @swagger
 * /api/admin/queue/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get queue statistics
 *     description: Retrieve comprehensive queue health metrics (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Queue statistics retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/QueueStats'
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/queue/stats', queueController.getStats);

/**
 * @swagger
 * /api/admin/queue/jobs:
 *   get:
 *     tags: [Admin]
 *     summary: List jobs by status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [waiting, active, completed, failed, delayed]
 *           default: waiting
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Jobs retrieved successfully
 */
router.get('/queue/jobs', queueController.getJobs);

/**
 * @swagger
 * /api/admin/queue/pause:
 *   post:
 *     tags: [Admin]
 *     summary: Pause queue processing
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Queue paused successfully
 */
router.post('/queue/pause', queueController.pauseQueue);

/**
 * @swagger
 * /api/admin/queue/resume:
 *   post:
 *     tags: [Admin]
 *     summary: Resume queue processing
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Queue resumed successfully
 */
router.post('/queue/resume', queueController.resumeQueue);

/**
 * @swagger
 * /api/admin/queue/clean:
 *   post:
 *     tags: [Admin]
 *     summary: Clean old completed jobs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: grace
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 1000
 *     responses:
 *       200:
 *         description: Queue cleaned successfully
 */
router.post('/queue/clean', queueController.cleanQueue);

/**
 * @swagger
 * /api/admin/queue/retry-failed:
 *   post:
 *     tags: [Admin]
 *     summary: Retry all failed jobs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Failed jobs retried
 */
router.post('/queue/retry-failed', queueController.retryFailed);

// Analytics endpoints
const validateUserId = [param('userId').isMongoId().withMessage('Invalid user ID')];

const validateDateRange = [
  query('startDate').optional().isISO8601().withMessage('Invalid startDate format'),
  query('endDate').optional().isISO8601().withMessage('Invalid endDate format'),
];

/**
 * @swagger
 * /api/admin/analytics/overview:
 *   get:
 *     tags: [Admin]
 *     summary: Get system-wide analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: System analytics retrieved
 */
router.get(
  '/analytics/overview',
  validateDateRange,
  handleValidationErrors,
  analyticsController.getSystemOverview
);

/**
 * @swagger
 * /api/admin/analytics/users/{userId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get user-specific analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
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
 *         description: User analytics retrieved
 */
router.get(
  '/analytics/users/:userId',
  validateUserId,
  validateDateRange,
  handleValidationErrors,
  analyticsController.getUserAnalytics
);

/**
 * @swagger
 * /api/admin/analytics/endpoints:
 *   get:
 *     tags: [Admin]
 *     summary: Get endpoint analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Endpoint analytics retrieved
 */
router.get(
  '/analytics/endpoints',
  validateDateRange,
  handleValidationErrors,
  analyticsController.getEndpointAnalytics
);

/**
 * @swagger
 * /api/admin/analytics/errors:
 *   get:
 *     tags: [Admin]
 *     summary: Get error analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Error analytics retrieved
 */
router.get(
  '/analytics/errors',
  validateDateRange,
  handleValidationErrors,
  analyticsController.getErrorAnalytics
);

/**
 * @swagger
 * /api/admin/analytics/performance:
 *   get:
 *     tags: [Admin]
 *     summary: Get performance analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance analytics retrieved
 */
router.get(
  '/analytics/performance',
  validateDateRange,
  handleValidationErrors,
  analyticsController.getPerformanceAnalytics
);

export default router;