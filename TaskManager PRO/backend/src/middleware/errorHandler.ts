import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  statusCode?: number;
  errors?: any[];
  code?: string | number;
  keyPattern?: any;
  keyValue?: any;
  path?: string;
  value?: any;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the full error detail for server-side debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    statusCode: err.statusCode,
    code: err.code,
  });

  // Set default status code
  const statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorDetails = null;

  // Handle specific error types
  if (err.code === 11000) {
    // MongoDB duplicate key error
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value for ${field}. This ${field} already exists.`;
    errorDetails = { field, value: err.keyValue?.[field] };
    res.status(409); // Conflict
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    message = 'Validation Error';
    errorDetails = err.errors;
    res.status(400); // Bad Request
  } else if (err.name === 'CastError') {
    // Mongoose cast error (usually invalid ID)
    message = `Invalid ${err.path || 'value'}: ${err.value || 'unknown'}`;
    res.status(400); // Bad Request
  } else if (err.name === 'JsonWebTokenError') {
    // JWT error
    message = 'Invalid token';
    res.status(401); // Unauthorized
  } else if (err.name === 'TokenExpiredError') {
    // JWT expired error
    message = 'Token expired';
    res.status(401); // Unauthorized
  } else {
    // Use provided status code or 500
    res.status(statusCode);
  }

  // Return error response
  res.json({
    success: false,
    error: {
      message,
      ...(errorDetails && { details: errorDetails }),
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
}; 