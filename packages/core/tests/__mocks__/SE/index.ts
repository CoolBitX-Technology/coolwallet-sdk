/* eslint-disable class-methods-use-this */
import crypto from 'crypto';
import { APDU_COMMANDS } from './commands';
import { STATUS_CODE } from './codes';
import { MockedError } from '../errors';

type Response<T> = {
  statusCode: STATUS_CODE;
  data?: T;
};

const delay = (sec: number) => new Promise((r) => setTimeout(r, sec * 1000));

class SE {
  private VERSION = 9999;

  public async process(ins: APDU_COMMANDS, argument?: string): Promise<Response<string>> {
    let data;
    let statusCode;
    try {
      switch (ins) {
        case APDU_COMMANDS.GET_NONCE:
          data = this.getNonce();
          await delay(1);
          break;
        case APDU_COMMANDS.VERSION:
          data = this.getVersion();
          await delay(1);
          break;
        case APDU_COMMANDS.ECHO:
          data = argument;
          await delay(2);
          break;
      }
      statusCode = STATUS_CODE.SUCCESS;
    } catch (e) {
      const error = e as MockedError;
      statusCode = error.code;
    }

    return {
      data,
      statusCode,
    };
  }

  getVersion(): string {
    return this.VERSION.toString(16);
  }

  getNonce(): string {
    return crypto.randomBytes(8).toString('hex');
  }
}

export default SE;
