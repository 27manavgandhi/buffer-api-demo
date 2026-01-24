import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { AppError, ValidationError } from '../utils/errors.util';
import { logger } from '../utils/logger.util';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    requestId: req.requestId,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    const response: {
      success: boolean;
      message: string;
      errors?: Array<{ field: string; message: string }>;
      stack?: string;
    } = {
      success: false,
      message: err.message,
    };

    if (err instanceof ValidationError && err.errors) {
      response.errors = err.errors;
    }

    if (env.NODE_ENV === 'development') {
      response.stack = err.stack;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  const response: {
    success: boolean;
    message: string;
    stack?: string;
  } = {
    success: false,
    message: env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
  };

  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(500).json(response);
};