/* eslint-disable @typescript-eslint/no-var-requires */
const crypto = require('crypto');
/* eslint-enable @typescript-eslint/no-var-requires */

if (process.env.NODE_ENV !== 'development') {
  global.console = {
    ...console,
    debug: jest.fn(), // Mock console.debug
  };
}

// Polyfill for crypto.getRandomValues in Node.js
if (typeof global.crypto !== 'object') {
  global.crypto = crypto;
}

if (!global.crypto.getRandomValues) {
  global.crypto.getRandomValues = function (buffer) {
    if (!(buffer instanceof Uint8Array)) {
      throw new TypeError('Expected Uint8Array');
    }
    if (buffer.length > 65536) {
      const e = new Error();
      e.message =
        "Failed to execute 'getRandomValues' on 'Crypto': The ArrayBufferView's byte length (" +
        buffer.length +
        ') exceeds the number of bytes of entropy available via this API (65536).';
      e.name = 'QuotaExceededError';
      throw e;
    }
    const bytes = crypto.randomBytes(buffer.length);
    buffer.set(bytes);
    return buffer;
  };
}
