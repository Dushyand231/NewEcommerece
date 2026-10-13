const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier';
  }
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  if (process.env.NODE_ENV !== 'test' && statusCode >= 500) {
    console.error(err.stack || err.message);
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? 'Server error' : message,
  });
};

module.exports = { notFound, errorHandler };
