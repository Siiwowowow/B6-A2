import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.util';

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  sendError(res, `Route ${req.originalUrl} not found.`, 404);
};

export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error('🔥 Unhandled error:', err);
  sendError(res, err.message || 'Internal Server Error', 500);
};