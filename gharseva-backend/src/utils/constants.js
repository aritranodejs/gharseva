/**
 * Standardized status labels for the GharSeva platform
 */
const BOOKING_STATUS = {
  PENDING: 'pending',
  SEARCHING: 'searching_worker',
  PENDING_ACCEPTANCE: 'pending_acceptance',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const PRICE_TYPE = {
  FIXED: 'fixed',
  HOURLY: 'hourly',
  VISIT: 'visit',
};

module.exports = { BOOKING_STATUS, PRICE_TYPE };
