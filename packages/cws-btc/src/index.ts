import { core } from '@coolwallets/core';
import { ECDSACoin } from '@coolwallets/coin';
import { pubkeyToP2PKHAddress, pubkeyToP2SHAddress } from './util';
import * as bitcoin from 'bitcoinjs-lib';
import BN from 'bn.js';

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

    const outputs = [output];
    if (change) outputs.push({
      value: change.value,
      address: this.getP2PKHAddress(change.addressIndex)
    });
    const outputsHex = genUnsignedOutputsHex(outputs);

    const txDataArray = getTxDataArray();
    const signatures = await core.flow.sendDataArrayToCoolWallet(
      this.transport,
      this.appId,
      this.appPrivateKey,
      txDataArray,
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

function genUnsignedOutputsHex(outputs: [Output]) {
  let outputsHex = '';
  for (let output of outputs) {
    outputsHex += satoshiStringToHex(output.value);
    outputsHex += getOutScriptFromAddress(output.address);
  }
  return outputsHex;
}

function satoshiStringToHex(satoshi: string) {
  const bn = new BN(satoshi);
  const buf = Buffer.from(bn.toString(16), 'hex').reverse();
  return Buffer.alloc(8).fill(buf, 0, buf.length);
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

function getTxDataArray(inputs, output, change) {

}

function getUnsignedDataForInputOfP2PKH(txHash, outputIndex, pubkey, outputHex) {
  const { output } = bitcoin.payments.p2pkh({ pubkey });
  const psbt = new bitcoin.Psbt();
  psbt.addInput({
    hash: txHash,
    index: outputIndex,
  });
  psbt.addOutputs([{
  }, {
  }]);
}
