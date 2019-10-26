declare module 'cws-web-ble' {
  export class WebBleTransport {
    constructor()
    connect(): Promise<void>;
    request(command: string, data: string):Promise<string>;
    disconnect(): Promise<void>
  }
}
