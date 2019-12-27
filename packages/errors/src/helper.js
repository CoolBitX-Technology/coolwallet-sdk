import { SDKError } from './SDKError'

let errorClasses = {}

export const createErrorClass = (name, message, code) => {
  const C = function CoolWalletSError(fields) {
    Object.assign(this, fields);
    this.name = name;
    this.message = message || name;
    this.stack = new SDKError(message, code).stack;
  };
  // $FlowFixMe
  C.prototype = new SDKError(message, code);

  errorClasses[name] = C;
  // $FlowFixMe we can't easily type a subset of Error for now...
  return C;
};