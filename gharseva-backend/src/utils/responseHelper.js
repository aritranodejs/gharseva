/**
 * Standardized API Response Structure
 * Format: { success: boolean, data: any, message: string }
 */

const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message
  });
};

const sendError = (res, message = 'Internal Server Error', statusCode = 500, error = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(error && { details: error.message || error })
  });
};

module.exports = { sendSuccess, sendError };
