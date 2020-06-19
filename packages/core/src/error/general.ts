/* eslint-disable max-classes-per-file  */
import SDKError from './SDKError';

export class PleaseResetHardware extends SDKError {
  constructor() {
    super('PleaseResetHardware', 'Bad Firmware status. Please reset your CoolWalletS.');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class FirmwareVersionTooLow extends SDKError {
  constructor(requiredVersion: number) {
    super('FirmwareVersionTooLow', `Firmware version too low. Please update to ${requiredVersion}`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class CoinNotSupported extends SDKError {
  constructor() {
    super('CoinNotSupported', 'Coin not supported. Please update your hardware');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class OperationCanceled extends SDKError {
  constructor() {
    super('OperationCanceled', 'Operation canceled by the user.');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

export class UnknownCommand extends SDKError {
  constructor() {
    super('UnknownCommand', 'Wrong Command (May need firmware update)');
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}
