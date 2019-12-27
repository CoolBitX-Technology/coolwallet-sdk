export class SDKError extends Error {
  public name:string
  public code:string

  constructor(message: string, code:string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);;
    this.constructor = SDKError;
    this.name = "SDKError";
    this.code = code
  }
}