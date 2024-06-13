import { Transport } from '@coolwallet/core';
import { TransportError } from '@coolwallet/core/lib/error';
import type { Device } from 'react-native-ble-plx';
import { decodeCommand,encodeApdu,numberArrayToHexString } from './utils';
import { CMD_LEN, PID } from './configs/commands';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

class NFCTransport extends Transport {

  constructor() {
    super({ name: 'NFC' } as Device);
  }

  sendCommandToCard(_: number[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  sendDataToCard(_: number[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  checkCardStatus(): Promise<number> {
    throw new Error('Method not implemented.');
  }

  readDataFromCard = async(nfcTech: NfcTech = NfcTech.Ndef): Promise<number[]> => {
    try {
      await NfcManager.start();
      await NfcManager.requestTechnology(nfcTech);
      const tag = await NfcManager.getTag();
      if (tag?.ndefMessage) {
        const ndefRecords = tag.ndefMessage;
        const payloadNumbers = ndefRecords.flatMap(record => {
          const payload = record.payload instanceof Uint8Array ? record.payload : new Uint8Array(record.payload);
          return Array.from(payload);  
        });
        return payloadNumbers;
      } else {
        return tag?.id ? Array.from(Buffer.from(tag.id, 'utf-8')) : [];
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      throw new TransportError(this.request.name, errorMessage);
    } finally {
      NfcManager.cancelTechnologyRequest();
    }
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
      data: packets.slice(0, -2),// slice checksum
    };
    try {
      const commandBytes =encodeApdu(requestBody.cla,requestBody.ins, requestBody.p1, requestBody.p2, requestBody.data);
      await NfcManager.start();
      await NfcManager.requestTechnology(NfcTech.IsoDep);
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
