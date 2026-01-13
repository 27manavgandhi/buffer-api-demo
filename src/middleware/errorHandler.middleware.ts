import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { AppError, ValidationError } from '../utils/errors.util';
import { logger } from '../utils/logger.util';

interface ErrorResponse {
  success: false;
  message: string;
  requestId: string;
  errors?: Record<string, string[]>;
  stack?: string;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = req.requestId;

  if (err instanceof AppError) {
    logger.warn('Operational error', {
      requestId,
      error: err.message,
      statusCode: err.statusCode,
    });

    const response: ErrorResponse = {
      success: false,
      message: err.message,
      requestId,
    };

    if (err instanceof ValidationError && err.errors) {
      response.errors = err.errors;
    }

    if (config.isDevelopment) {
      response.stack = err.stack;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  logger.error('Unexpected error', {
    requestId,
    error: err.message,
    stack: err.stack,
  });

  const response: ErrorResponse = {
    success: false,
    message: config.isProduction ? 'Internal server error' : err.message,
    requestId,
  };

  if (config.isDevelopment) {
    response.stack = err.stack;
  }

  res.status(500).json(response);
};