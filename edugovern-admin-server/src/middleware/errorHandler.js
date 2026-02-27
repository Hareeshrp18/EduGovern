/**
 * Error Handler Middleware - Centralized error handling
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Handle 'payload too large' errors (body-parser/raw-body)
  if (err && (err.type === 'entity.too.large' || err.type === 'request.entity.too.large' || err.status === 413)) {
    return res.status(413).json({
      success: false,
      message: 'Payload too large. Please upload smaller files or increase server limits.'
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
};

