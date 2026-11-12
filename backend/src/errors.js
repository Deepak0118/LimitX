// Shared error helper. Used by auth.js and admin.js.
function httpError(statusCode, message) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

module.exports = { httpError };
