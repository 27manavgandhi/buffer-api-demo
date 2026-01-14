import { Router } from 'express';
import { postController } from '../controllers/post.controller';
import { authenticate } from '../middleware/auth.middleware';
import { body, param } from 'express-validator';
import { handleValidationErrors } from '../middleware/validate.middleware';
import { PostPlatform } from '../types/post.types';

const router = Router();

const validateCreatePost = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 280 })
    .withMessage('Content cannot exceed 280 characters'),
  body('platform')
    .isIn(Object.values(PostPlatform))
    .withMessage('Invalid platform'),
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('Invalid scheduled date format'),
];

const validateUpdatePost = [
  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Content cannot be empty')
    .isLength({ max: 280 })
    .withMessage('Content cannot exceed 280 characters'),
  body('platform')
    .optional()
    .isIn(Object.values(PostPlatform))
    .withMessage('Invalid platform'),
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('Invalid scheduled date format'),
];

const validatePostId = [
  param('id').isMongoId().withMessage('Invalid post ID'),
];

router.post(
  '/',
  authenticate,
  validateCreatePost,
  handleValidationErrors,
  postController.createPost
);

router.get('/', authenticate, postController.getPosts);

router.get(
  '/:id',
  authenticate,
  validatePostId,
  handleValidationErrors,
  postController.getPost
);

router.put(
  '/:id',
  authenticate,
  validatePostId,
  validateUpdatePost,
  handleValidationErrors,
  postController.updatePost
);

router.delete(
  '/:id',
  authenticate,
  validatePostId,
  handleValidationErrors,
  postController.deletePost
);

export default router;