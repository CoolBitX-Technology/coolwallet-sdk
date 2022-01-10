import { STATUS_CODE } from './SE/codes';

class MockedError extends Error {
  code: STATUS_CODE;

  constructor(message: string, code: STATUS_CODE) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

export { MockedError };
