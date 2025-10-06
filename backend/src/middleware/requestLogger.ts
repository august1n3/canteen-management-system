import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  // Skip logging for health checks in production
  if (req.path === '/health' && process.env.NODE_ENV === 'production') {
    return next();
  }

  console.log(`[${timestamp}] ${req.method} ${req.url} - Started`);
  
  // Log request body for POST/PUT/PATCH requests (excluding sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const logBody = { ...req.body };
    
    // Remove sensitive fields from logs
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'pin'];
    sensitiveFields.forEach(field => {
      if (logBody[field]) {
        logBody[field] = '[REDACTED]';
      }
    });
    
    if (Object.keys(logBody).length > 0) {
      console.log(`[${timestamp}] Request Body:`, logBody);
    }
  }

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body) {
    const duration = Date.now() - start;
    const endTimestamp = new Date().toISOString();
    
    console.log(`[${endTimestamp}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    
    // Log response body for errors or in development
    if (res.statusCode >= 400 || process.env.NODE_ENV === 'development') {
      console.log(`[${endTimestamp}] Response:`, body);
    }
    
    return originalJson.call(this, body);
  };

  next();

  // TODO: Integrate with structured logging library (Winston, Pino)
  // TODO: Add request ID tracking for distributed tracing
  // TODO: Implement log aggregation and monitoring
};