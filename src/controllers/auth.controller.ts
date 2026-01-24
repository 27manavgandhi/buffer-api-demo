import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler.util';
import { NotFoundError, InternalServerError } from '../utils/errors.util';
import { logger } from '../utils/logger.util';

export class AuthController {
  
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const requestId = req.requestId;

    const result = await authService.register({ email, password }, requestId);

    res.status(201).json({
      success: true,
      data: result,
    });
  });

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const requestId = req.requestId;

    const result = await authService.login({ email, password }, requestId);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getCurrentUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    
    if (!req.user || !req.user.userId) {
      
      logger.error('Authentication state corrupted', {
        requestId: req.requestId,
        path: req.path,
        method: req.method,
        hasUser: !!req.user,
        hasUserId: !!req.user?.userId,
        message: 'Auth middleware did not populate req.user - check route configuration',
      });

      throw new InternalServerError(
        'Authentication state is invalid. Please contact support if this persists.'
      );
    }

    const userId = req.user.userId;

    const user = await authService.getUserById(userId);

    if (!user) {
      
      throw new NotFoundError('User account no longer exists');
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  });
}

export const authController = new AuthController();