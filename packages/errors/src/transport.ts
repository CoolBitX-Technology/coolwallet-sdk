import SDKError from './SDKError';

export class NoTransport extends SDKError {
  constructor() {
    super('NoTransport', 'Transport not specified or no connection established.');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}