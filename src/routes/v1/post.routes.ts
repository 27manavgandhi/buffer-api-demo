import { Router } from 'express';
import { postController } from '../../controllers/post.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { body, param } from 'express-validator';
import { handleValidationErrors } from '../../middleware/validate.middleware';
import { PostPlatform } from '../../types/post.types';
import { userLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

const validateCreatePost = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 280 })
    .withMessage('Content cannot exceed 280 characters'),
  body('platform').isIn(Object.values(PostPlatform)).withMessage('Invalid platform'),
  body('scheduledAt').optional().isISO8601().withMessage('Invalid scheduled date format'),
];

const validateUpdatePost = [
  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Content cannot be empty')
    .isLength({ max: 280 })
    .withMessage('Content cannot exceed 280 characters'),
  body('platform').optional().isIn(Object.values(PostPlatform)).withMessage('Invalid platform'),
  body('scheduledAt').optional().isISO8601().withMessage('Invalid scheduled date format'),
];

const validatePostId = [param('id').isMongoId().withMessage('Invalid post ID')];

/**
 * @swagger
 * /api/v1/posts:
 *   post:
 *     tags: [Posts]
 *     summary: Create a new post
 *     description: Create a draft or scheduled social media post
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content, platform]
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 280
 *               platform:
 *                 type: string
 *                 enum: [twitter, linkedin, facebook]
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Post created successfully
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 */
router.post(
  '/',
  authenticate,
  userLimiter,
  validateCreatePost,
  handleValidationErrors,
  postController.createPost
);

/**
 * @swagger
 * /api/v1/posts:
 *   get:
 *     tags: [Posts]
 *     summary: Get user's posts
 *     description: Retrieve paginated list of user's posts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 */
router.get('/', authenticate, userLimiter, postController.getPosts);

/**
 * @swagger
 * /api/v1/posts/{id}:
 *   get:
 *     tags: [Posts]
 *     summary: Get single post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *       404:
 *         description: Post not found
 */
router.get(
  '/:id',
  authenticate,
  userLimiter,
  validatePostId,
  handleValidationErrors,
  postController.getPost
);

/**
 * @swagger
 * /api/v1/posts/{id}:
 *   put:
 *     tags: [Posts]
 *     summary: Update post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       409:
 *         description: Cannot update published post
 */
router.put(
  '/:id',
  authenticate,
  userLimiter,
  validatePostId,
  validateUpdatePost,
  handleValidationErrors,
  postController.updatePost
);

/**
 * @swagger
 * /api/v1/posts/{id}:
 *   delete:
 *     tags: [Posts]
 *     summary: Delete post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted successfully
 */
router.delete(
  '/:id',
  authenticate,
  userLimiter,
  validatePostId,
  handleValidationErrors,
  postController.deletePost
);

export default router;