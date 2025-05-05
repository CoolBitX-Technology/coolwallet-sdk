import { Transport } from '@coolwallet/core';
import { TransportError } from '@coolwallet/core/lib/error';
import { decodeCommand, encodeApdu, numberArrayToHexString } from './utils';
import { CMD_LEN, PID } from './configs/commands';
import NfcManager from 'react-native-nfc-manager';
import { CardType } from '@coolwallet/core/lib/transport';

type ErrorCallback = (error: Error) => void;

class NFCTransport implements Transport {
  cardType: CardType;
  errorCallbacks: Map<string, ErrorCallback> = new Map();

  constructor(cardType = CardType.Go) {
    this.cardType = cardType;
  }

  addErrorListener = (key: string, callback: ErrorCallback) => {
    this.errorCallbacks.set(key, callback);
  };

  removeErrorListener = (key: string) => {
    this.errorCallbacks.delete(key);
  };

  request = async (command: string, packets: string): Promise<string> => {
    const start = Date.now();

    console.log('NFCTransport.request >> command=', command);
    console.log('NFCTransport.request >> packets=', packets);

    if (!command.startsWith(PID + CMD_LEN)) {
      throw new TransportError(this.request.name, 'Unknown command payload.');
    }
    const { cla, ins, p1, p2 } = decodeCommand(command);
    const requestBody = {
      cla,
      ins,
      p1,
      p2,
      data: packets.slice(0, -2), // slice checksum
    };
    try {
      const commandBytes = encodeApdu(
        requestBody.cla,
        requestBody.ins,
        requestBody.p1,
        requestBody.p2,
        requestBody.data
      );

      const response = await NfcManager.isoDepHandler.transceive(commandBytes);
      console.log('NFCTransport.request >> responseBytes length=', response.length);
      const responseHex = numberArrayToHexString(response);
      console.log('NFCTransport.request >> responseHex=', responseHex);
      const end = Date.now();
      console.log('NFCTransport.request >> time taken=', end - start);
      return responseHex;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      const transportError = new TransportError(this.request.name, errorMessage);

      for (const callback of this.errorCallbacks.values()) {
        callback(transportError);
      }

      throw transportError;
    }
  };
}

export default NFCTransport;
