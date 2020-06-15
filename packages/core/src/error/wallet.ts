import SDKError from './SDKError'

export class WalletExists extends SDKError {
  constructor() {
    super('WalletExists', 'Wallet already exists.');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class NoWallet extends SDKError {
  constructor() {
    super('NoWallet', 'Wallet doesnt exist, create or set seed first.');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class InvalidSeedLength extends SDKError {
  constructor() {
    super('InvalidSeedLength', 'Invalid length of seed, try 12, 18 or 24.');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class IncorrectSum extends SDKError {
  constructor() {
    super('IncorrectSum', 'Incorrect Sum of seeds.');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}
