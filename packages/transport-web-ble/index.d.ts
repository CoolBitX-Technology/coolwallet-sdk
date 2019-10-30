declare class WebBleTransport {
  constructor(verbose?: boolean)
    connect(): Promise<void>;
    request(command: string, data: string):Promise<string>;
    disconnect(): Promise<void>
}

export = WebBleTransport