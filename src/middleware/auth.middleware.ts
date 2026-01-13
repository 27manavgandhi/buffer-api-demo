import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/asyncHandler.util';
import { UnauthorizedError } from '../utils/errors.util';
import { verifyToken } from '../utils/jwt.util';

export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);

    const payload = verifyToken(token);

    req.user = payload;

    next();
  }
);