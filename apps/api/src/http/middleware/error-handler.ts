import { ZodError } from 'zod';
import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';

import { AppError, ConflictError, InternalError, ValidationError } from '../errors.js';
import { getRequestId } from './request-id.js';

export function formatZodFields(error: ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join('.') : '_root';
    if (!fields[path]) {
      fields[path] = [];
    }
    fields[path].push(issue.message);
  }

  return fields;
}

/**
 * Global centralized Express error handler.
 *
 * Guarantees that:
 * - All error responses strictly match the ApiErrorResponse contract.
 * - Sensitive database errors, Mongoose CastErrors, and stack traces are never leaked.
 * - Every error payload is attributed with the matching X-Request-Id.
 * - All error responses carry 'Cache-Control: no-store'.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  const requestId = getRequestId(res);
  res.setHeader('Cache-Control', 'no-store');

  // 1. Handled domain / application error
  if (err instanceof AppError) {
    res.status(err.statusCode).json(err.toResponse(requestId));
    return;
  }

  // 2. Zod transport validation error
  if (err instanceof ZodError) {
    const fields = formatZodFields(err);
    const validationError = new ValidationError('The request is invalid.', fields);
    res.status(validationError.statusCode).json(validationError.toResponse(requestId));
    return;
  }

  // 3. Mongoose CastError (e.g. malformed ObjectId in database query)
  if (err instanceof mongoose.Error.CastError) {
    const validationError = new ValidationError(`Invalid format for ${err.path}.`);
    res.status(validationError.statusCode).json(validationError.toResponse(requestId));
    return;
  }

  // 4. Mongoose Schema ValidationError
  if (err instanceof mongoose.Error.ValidationError) {
    const fields: Record<string, string[]> = {};
    for (const [key, val] of Object.entries(err.errors)) {
      fields[key] = [val.message];
    }
    const validationError = new ValidationError('Validation failed.', fields);
    res.status(validationError.statusCode).json(validationError.toResponse(requestId));
    return;
  }

  // 5. MongoDB Duplicate Key Error (E11000)
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: unknown }).code === 11000
  ) {
    const conflictError = new ConflictError(
      'A resource with these unique attributes already exists.',
    );
    res.status(conflictError.statusCode).json(conflictError.toResponse(requestId));
    return;
  }

  // 6. JSON body payload size limit exceeded (413 from express.json())
  if (
    typeof err === 'object' &&
    err !== null &&
    (('type' in err && (err as { type: unknown }).type === 'entity.too.large') ||
      ('status' in err && (err as { status: unknown }).status === 413))
  ) {
    const validationError = new ValidationError('Request payload exceeds size limit (100kb).');
    res.status(413).json(validationError.toResponse(requestId));
    return;
  }

  // 7. JSON body parsing error (SyntaxError from express.json())
  if (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as { status: unknown }).status === 400
  ) {
    const validationError = new ValidationError('Malformed JSON in request body.');
    res.status(400).json(validationError.toResponse(requestId));
    return;
  }

  // 8. Unhandled / internal server error (sanitize completely)
  console.error(`[Unhandled Error] requestId=${requestId}:`, err);
  const internalError = new InternalError('An unexpected internal server error occurred.');
  res.status(internalError.statusCode).json(internalError.toResponse(requestId));
}
