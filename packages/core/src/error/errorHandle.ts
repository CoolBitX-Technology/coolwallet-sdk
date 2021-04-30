import { CommandType } from '../apdu/execute/command';

/**
 *  name: function name (function testFunction() => testFunction.name)
 *  message: error message
 */
export class SDKError extends Error {
  constructor(name: string, message: string) {
    super(`error function: ${name}, message: ${message}`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
  }
}

/**
 *  command: command info
 *  returnCode: statusCode code from SE
 *  message: error message
 */
export class APDUError extends Error {

  constructor(command: CommandType, returnCode: string, message: string) {
    super(`command info: ${JSON.stringify(command)}, returnCode: ${returnCode}, message: ${message}`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = APDUError;
  }
}

/**
 *  name: function name (function testFunction() => testFunction.name)
 *  message: error message
 */
export class TransportError extends Error {
  constructor(name: string, message: string) {
    super(`error function: ${name}, message: ${message}`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = TransportError;
  }
}
