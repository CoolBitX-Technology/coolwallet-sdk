import printf from 'printf';
import round from 'lodash/round';

enum TYPE {
  ASC = '00',
  BCD = '01',
  ADDR = '02',
  WRAP = '03',
}

function convertToHex(length: number) {
  const hexString = length.toString(16);
  if (hexString.length % 2 !== 0) {
    return '0' + hexString;
  }
  return hexString;
}

class DisplayBuilder {
  private response = '';

  public wrapPage(lineOneMessage: string, lineTwoMessage: string, signal = 'FF'): this {
    const totalLength = 15 + 2;
    this.response += convertToHex(totalLength);
    this.response += signal;
    this.response += TYPE.WRAP;
    const lineOneMessageLength = lineOneMessage.length;
    if (lineOneMessageLength >= 8) {
      this.response += Buffer.from(lineOneMessage.substring(0, 8)).toString('hex');
    } else {
      this.response += Buffer.from(lineOneMessage.padStart(8, ' ')).toString('hex');
    }
    const lineTwoMessageLength = lineTwoMessage.length;
    if (lineTwoMessageLength >= 7) {
      this.response += Buffer.from(lineTwoMessage.substring(0, 7)).toString('hex');
    } else {
      this.response += Buffer.from(lineTwoMessage.padStart(7, ' ')).toString('hex');
    }
    return this;
  }

  public messagePage(message: string, signal = 'FF'): this {
    const totalLength = message.length + 2;
    this.response += convertToHex(totalLength);
    this.response += signal;
    this.response += TYPE.ASC;
    this.response += Buffer.from(message).toString('hex');
    return this;
  }

  public amountPage(amount: number, signal = 'FF'): this {
    const totalLength = 8 + 2;
    this.response += convertToHex(totalLength);
    this.response += signal;
    this.response += TYPE.BCD;
    const number = printf('%017.8f', round(amount, 8));
    this.response += number.substring(0, 8) + number.substring(9, 17);
    return this;
  }

  public addressPage(address: string, signal = 'FF'): this {
    const totalLength = address.length + 2;
    this.response += convertToHex(totalLength);
    this.response += signal;
    this.response += TYPE.ADDR;
    this.response += Buffer.from(address.toLowerCase()).toString('hex');
    return this;
  }

  public finalize(): string {
    return this.response;
  }
}

export default DisplayBuilder;
