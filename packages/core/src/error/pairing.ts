/* eslint-disable max-classes-per-file  */
import SDKError from './SDKError';

export class NotRegistered extends SDKError {
  constructor() {
    super('NotRegistered', 'App not recognized by CoolWalletS. Please register first');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class CardLocked extends SDKError {
  constructor() {
    super('CardLocked', 'Card Locked. Unlock with a registered App or reset your wallet.');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class MaxAppRegistered extends SDKError {
  constructor() {
    super('MaxAppRegistered', 'Max number of App paired. Delete one of the paired app.');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class WrongPassword extends SDKError {
  constructor() {
    super('WrongPassword', 'Wrong Password');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class MaxPasswordTried extends SDKError {
  constructor() {
    super('MaxPasswordTried', 'Maximum try of password.');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class AlreadyRegistered extends SDKError {
  constructor() {
    super('AlreadyRegistered', 'App already registered.');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}
