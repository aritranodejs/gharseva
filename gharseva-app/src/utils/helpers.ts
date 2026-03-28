/**
 * Standardized status labels for the GharSeva platform (Frontend Sync)
 */
export const BOOKING_STATUS = {
  PENDING: 'pending',
  SEARCHING: 'searching_worker',
  PENDING_ACCEPTANCE: 'pending_acceptance',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

/**
 * Format currency for display (INR)
 */
export const formatCurrency = (amount: number) => {
  return `₹${amount}`;
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};
