/**
 * Patch: replaces @css-inline/css-inline with a no-op fallback
 * when the native binary is blocked by Windows Application Control.
 * CSS inlining in emails will be skipped (HTML passes through unchanged).
 */
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, parent, ...args) {
  if (request === '@css-inline/css-inline') {
    return require.resolve('./css-inline-fallback.js');
  }
  return originalResolveFilename.call(this, request, parent, ...args);
};
