import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  next(new AppError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 404));
}

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    details = err.flatten();
  } else if (err.name === 'ValidationError') {
    // Mongoose ValidationError
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'CastError') {
    // Mongoose CastError (invalid ObjectId)
    statusCode = 400;
    message = 'Invalid resource identifier format';
  } else {
    console.error('[Unhandled Error]:', err);
    if (process.env.NODE_ENV === 'development') {
      message = err.message || message;
      details = err.stack;
    }
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(details !== undefined ? { details } : {}),
  });
}
