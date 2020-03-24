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
      input.address = await this.getP2PKHAddress(input.addressIndex);
    }
    const changeOutput = change;
    if (changeOutput) changeOutput.address = await this.getP2PKHAddress(changeOutput.addressIndex);
    const outputsHex = genUnsignedOutputsHex(output, changeOutput);

    const txDataArray = getUnsignedTxDataArray(inputs, outputsHex);
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

function genUnsignedOutputsHex(output: Output, changeOutput?: Change): string {
  let outputsHex = changeOutput ? '02' : '01';
  outputsHex += satoshiStringToHex(output.value);
  outputsHex += getOutScriptFromAddress(output.address);
  if (changeOutput && changeOutput.address) {
    outputsHex += satoshiStringToHex(changeOutput.value);
    outputsHex += getOutScriptFromAddress(changeOutput.address);
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

function getUnsignedTxDataArray(inputs: [Input], outputsHex: string) {
  const txDataArray = [];
  for (const input of inputs) {
    const keyId = core.util.addressIndexToKeyId('00', input.addressIndex);
    const payload = composeUnsignedTx(input, outputsHex);
    const dataForSE = core.flow.prepareSEData(keyId, payload, 'F5');
  }
  return txDataArray;
}

function composeUnsignedTx(input: Input, outputsHex: string): Buffer {
  const {txHash, outputIndex, address} = input;
  const version = '02000000';
  const inputCount = '01';
  const outputIndexHex = outputIndexNumberToHex(outputIndex);
  const inputScript = getOutScriptFromAddress(input.address);
  let unsignedTx = version + inputCount 
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
