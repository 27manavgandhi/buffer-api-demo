import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler.util';
import { NotFoundError } from '../utils/errors.util';

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
    const userId = req.user?.userId;

    if (!userId) {
      throw new NotFoundError('User not found');
    }

    const user = await authService.getUserById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
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