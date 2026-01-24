import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors.util';

export const validateRegistration = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

export const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const handleValidationErrors = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => {
      if ('path' in error) {
        return {
          field: error.path,
          message: error.msg,
        };
      }
      return {
        field: 'unknown',
        message: error.msg,
      };
    });

    throw new ValidationError('Validation failed', formattedErrors);
  }

  next();
};