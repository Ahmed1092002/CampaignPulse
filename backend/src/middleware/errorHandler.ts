import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { errorResponse } from '../utils/helpers';
import { AppError, ValidationError, DatabaseError } from '../utils/errors';
import logger from '../config/logger';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.code, err.message, err.details));
    return;
  }

  if (err instanceof ZodError) {
    const details = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));
    res.status(400).json(errorResponse('VALIDATION_ERROR', 'Validation failed', details));
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = err.meta?.target as string[] | undefined;
      res.status(409).json(errorResponse('CONFLICT', 'A record with this value already exists', { field: target }));
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json(errorResponse('NOT_FOUND', 'Record not found'));
      return;
    }
    res.status(500).json(errorResponse('DATABASE_ERROR', 'Database operation failed'));
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid data provided'));
    return;
  }

  res.status(500).json(errorResponse('INTERNAL_ERROR', 'An unexpected error occurred'));
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json(errorResponse('NOT_FOUND', 'Route not found'));
};