export default class SDKError extends Error {
  public name:string

  constructor(name:string, message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.constructor = SDKError;
    this.name = name;
  }
}
