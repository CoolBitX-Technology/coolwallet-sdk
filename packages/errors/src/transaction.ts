/*  eslint-disable max-classes-per-file  */
import SDKError from './SDKError';

export class CoinNotInitialized extends SDKError {
  constructor() {
    super('CoinNotInitialized', 'Coin Not initialized. Try get its publickey first.');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class InvalidData extends SDKError {
  constructor() {
    super('InvalidData', 'Invalid Transaction Data.');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class HashOutputMissmatch extends SDKError {
  constructor() {
    super('HashOutputMissmatch', 'Hashed output and raw output mismatch');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class InvalidChangeRedeemScript extends SDKError {
  constructor() {
    super('InvalidChangeRedeemScript', 'Invalid change address redeemscript');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class ChangeAddressMismatch extends SDKError {
  constructor() {
    super('ChangeAddressMismatch', 'Change address and index mismatch');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class InvalidOmniData extends SDKError {
  constructor() {
    super('InvalidOmniData', 'Invalid Omni Data.');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class InvalidChainId extends SDKError {
  constructor() {
    super('InvalidChainId', 'Invalid chainId');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class TokenAddressMismatch extends SDKError {
  constructor() {
    super('TokenAddressMismatch', 'Token address mismatch');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class ReadTypeDataMismatch extends SDKError {
  constructor() {
    super('ReadTypeDataMismatch', 'Readytype data mismatch');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class InvalidSideField extends SDKError {
  constructor() {
    super('InvalidSideField', 'Invalid Side Field');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class OmniValueTooHigh extends SDKError {
  constructor() {
    super('OmniValueTooHigh', 'Omni ouput exceed limit: 5420 sat.');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class InvalidRLPFormat extends SDKError {
  constructor() {
    super('InvalidRLPFormat', 'Invalid RLP Data');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class InvalidJsonFormat extends SDKError {
  constructor() {
    super('InvalidJsonFormat', 'Invalid Json Data');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class DataLengthP2Mismatch extends SDKError {
  constructor() {
    super('DataLengthP2Mismatch', 'Truncated Data length and P2 Mismatch.');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}
