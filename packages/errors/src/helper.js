import { SDKError } from './SDKError'

/**
 * Create CoolWalletSError class
 * @param {string} name 
 * @param {string} message 
 * @return { object }
 */
export const createErrorClass = (name, message) => {
  const C = function CoolWalletSError(fields) {
    Object.assign(this, fields);
    this.name = name;
    this.message = message || name;
    this.stack = new SDKError(name, message).stack;
  };
  C.prototype = new SDKError(name, message);

  return C;
};