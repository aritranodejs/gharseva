// Minimal assert shim for React Native / Expo
module.exports = function assert(condition, message) {
  if (!condition) {
    const error = new Error(message || 'Assertion failed');
    error.name = 'AssertionError';
    throw error;
  }
};
module.exports.ok = module.exports;
module.exports.AssertionError = Error;
