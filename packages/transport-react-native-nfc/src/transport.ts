import { Transport } from '@coolwallet/core';
import { TransportError } from '@coolwallet/core/lib/error';
import { decodeCommand, encodeApdu, hexStringToNumberArray, numberArrayToHexString } from './utils';
import { CMD_LEN, PID } from './configs/commands';
import NfcManager from 'react-native-nfc-manager';
import { CardType } from '@coolwallet/core/lib/transport';

class NFCTransport implements Transport {
  cardType: CardType;

  constructor(cardType = CardType.Lite) {
    this.cardType = cardType;
  }

  request = async (command: string, packets: string): Promise<string> => {
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

      await NfcManager.isoDepHandler.transceive(hexStringToNumberArray('00a404000e436f6f6c57616c6c65744c495445')); // select applet for COOLWALLET LITE
      const response = await NfcManager.isoDepHandler.transceive(commandBytes);
      return numberArrayToHexString(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      throw new TransportError(this.request.name, errorMessage);
    } finally {
      NfcManager.cancelTechnologyRequest();
    }
  };
}

export default NFCTransport;
