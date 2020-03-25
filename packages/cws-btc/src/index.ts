import BN from 'bn.js';
import * as bitcoin from 'bitcoinjs-lib';
import { core } from '@coolwallets/core';
import { ECDSACoin } from '@coolwallets/coin';
import { pubkeyToP2PKHAddress, pubkeyToP2SHAddress } from './util';

type Input = import('./types').Input;
type Output = import('./types').Output;
type Change = import('./types').Change;

type Transport = import('@coolwallets/transport').default;

export default class BTC extends ECDSACoin {
  public network: any;

  constructor(transport: Transport, appPrivateKey: string, appId: string, network: any) {
    super(transport, appPrivateKey, appId, '00');
    this.network = network;
  }

  /**
   * Get Bitcoin address by index
   */
  async getP2PKHAddress(addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(addressIndex);
    return pubkeyToP2PKHAddress(publicKey);
  }

  async getP2SHAddress(addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(addressIndex);
    return pubkeyToP2SHAddress(publicKey);
  }

  async signP2PKHTransaction(
    inputs: [Input],
    output: Output,
    change?: Change,
    confirmCB = null,
    authorizedCB = null,
  ): Promise<string> {

    for (const input of inputs) {
      // eslint-disable-next-line no-await-in-loop
      input.address = await this.getP2PKHAddress(input.addressIndex);
    }
    // eslint-disable-next-line no-param-reassign
    if (change) change.address = await this.getP2PKHAddress(change.addressIndex);

    const actions = getP2PKHSigningActions(
      this.transport,
      this.appPrivateKey,
      inputs,
      output,
      change
    );
    const signatures = await core.flow.sendBatchDataToCoolWallet(
      this.transport,
      this.appId,
      this.appPrivateKey,
      actions,
      false,
      confirmCB,
      authorizedCB,
      false
    );
  }

  async signP2SHTransaction(
    inputs: [Input],
    output: Output,
    change: Change,
  ): Promise<string> {

  }
}

function genUnsignedOutputsHex(output: Output, change?: Change): string {
  let outputsHex = '';
  outputsHex += satoshiStringToHex(output.value);
  outputsHex += getOutScriptFromAddress(output.address);
  if (change && change.address) {
    outputsHex += satoshiStringToHex(change.value);
    outputsHex += getOutScriptFromAddress(change.address);
  }
  return outputsHex;
}

function satoshiStringToHex(satoshi: string): string {
  const bn = new BN(satoshi);
  const buf = Buffer.from(bn.toString(16), 'hex').reverse();
  return Buffer.alloc(8).fill(buf, 0, buf.length).toString('hex');
}

function outputIndexNumberToHex(index: number): string {
  const buf = Buffer.from(index.toString(16), 'hex').reverse();
  return Buffer.alloc(4).fill(buf, 0, buf.length).toString('hex');
}

function getOutScriptFromAddress(address: string): string {
  let payment;
  if (address.startsWith('1')) {
    payment = bitcoin.payments.p2pkh({ address });
  } else if (address.startsWith('3')) {
    payment = bitcoin.payments.p2sh({ address });
  } else if (address.startsWith('bc1')) {
    payment = bitcoin.payments.p2wpkh({ address });
  }
  if (!payment || !payment.output) throw new Error(`Unsupport Address : ${address}`);
  const buf = payment.output;
  return `${buf.length.toString(16)}${buf.toString('hex')}`;
}

function getP2PKHSigningActions(
  transport: Transport,
  appPrivateKey: string,
  inputs: [Input],
  output: Output,
  change?: Change
) {
  const p2pkhReadtype = '00';
  const outputsLen = change ? '02' : '01';
  const outputsHex = outputsLen + genUnsignedOutputsHex(output, change);

  return inputs.map((input) => {
    const keyId = core.util.addressIndexToKeyId('00', input.addressIndex);
    const payload = composeUnsignedTx(input, outputsHex);
    const txDataHex = core.flow.prepareSEData(keyId, payload, p2pkhReadtype);
    const txDataType = '00';
    return core.util.createPrepareTxAction(transport, txDataHex, txDataType, appPrivateKey);
  });
}

function composeUnsignedTx(input: Input, outputsHex: string): Buffer {
  const { txHash, outputIndex, address } = input;
  if (!address) throw new Error('Property "address" needed for param input.');
  let unsignedTx = '0200000001'; // version + inputCount
  unsignedTx += txHash;
  unsignedTx += outputIndexNumberToHex(outputIndex);
  unsignedTx += getOutScriptFromAddress(address);
  unsignedTx += 'ffffffff'; // sequence
  unsignedTx += outputsHex;
  unsignedTx += '0000000081000000';
  return Buffer.from(unsignedTx);
}
