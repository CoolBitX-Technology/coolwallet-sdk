import { ScriptType, TransactionInput, TransactionOutput, TransactionUtxo, TxData, TxInfo } from '../config/types';
import { addressToOutScript, pubkeyOrScriptHashToPayment, toXOnly } from '../utils/address';
import { toHex } from '../utils/utils';
import { SIGHASH_ALL } from '../utils/hash';
import BigNumber from 'bignumber.js';
import { getMassAndSize, minimumRequiredTransactionRelayFee } from '../utils/estimateFee';

export class Transaction {
  version: number = 0;
  inputs: TransactionInput[] = [];
  outputs: TransactionOutput[] = [];
  lockTime: number = 0;
  subnetworkId: string = '0000000000000000000000000000000000000000';
  utxos: TransactionUtxo[] = [];
  feeValue: string = '0';

  static fromTxData(txData: TxData): Transaction {
    return new Transaction(txData);
  }

  constructor(txData: TxData) {
    let totalInput = 0;
    txData.inputs.forEach((input) => {
      this.inputs.push({
        previousOutpoint: {
          transactionId: input.preTxHash,
          index: input.preIndex,
        },
        signatureScript: '',
        sequence: 0,
        sigOpCount: 1,
        addressIndex: input.addressIndex,
      });

      const pubKey = input.pubkeyBuf?.toString('hex') as string;
      const xonlyPublicKey = toXOnly(pubKey)
      const inputPreValueBN = new BigNumber(input.preValue);
      this.utxos.push({
        pkScript: pubkeyOrScriptHashToPayment(xonlyPublicKey, ScriptType.P2PK_SCHNORR).outScript,
        amount: inputPreValueBN.toNumber(),
      });

      totalInput = inputPreValueBN.plus(new BigNumber(totalInput)).toNumber();
    });

    let totalOutput = 0;
    const output = txData.output;
    const outputValueBN = new BigNumber(output.value);
    this.outputs.push({
      scriptPublicKey: {
        version: 0,
        scriptPublicKey: toHex(addressToOutScript(output.address).outScript),
      },
      amount: outputValueBN.toNumber(),
    });
    totalOutput += outputValueBN.plus(new BigNumber(totalOutput)).toNumber();

    this.feeValue = new BigNumber(totalInput).minus(new BigNumber(totalOutput)).toFixed();
    const change = txData.change;
    if (change) {
      const pubKey = change.pubkeyBuf?.toString('hex') as string;
      const xonlyPublicKey = toXOnly(pubKey)
      const changeValueBN = new BigNumber(change.value);
      this.outputs.push({
        scriptPublicKey: {
          version: 0,
          scriptPublicKey: toHex(pubkeyOrScriptHashToPayment(xonlyPublicKey, ScriptType.P2PK_SCHNORR).outScript),
        },
        amount: changeValueBN.toNumber(),
        addressIndex: change.addressIndex,
      });
      this.feeValue = new BigNumber(this.feeValue).minus(changeValueBN).toFixed();
    }
  }

  addSignatures(signatures: Buffer[]): this {
    this.inputs.forEach((input, i) => {
      if (input.signatureScript.length > 0) return;
      const signature = signatures[i];
      input.signatureScript = toHex(Buffer.concat([Buffer.from([0x41]), signature, Buffer.from([SIGHASH_ALL])]));
    });
    return this;
  }

  getTxInfo(): TxInfo {
    return getMassAndSize(this.inputs, this.outputs);
  }

  estimateFee(feeRate = 1000): number {
    const { mass } = this.getTxInfo();
    return minimumRequiredTransactionRelayFee(mass, feeRate);
  }

  getMessage(): string {
    return JSON.stringify({
      transaction: {
        version: this.version,
        inputs: this.inputs.map(({ previousOutpoint, signatureScript, sequence, sigOpCount }) => {
          return {
            previousOutpoint,
            signatureScript,
            sequence,
            sigOpCount,
          };
        }),
        outputs: this.outputs.map(({ amount, scriptPublicKey }) => {
          return {
            amount,
            scriptPublicKey,
          };
        }),
        lockTime: this.lockTime,
        subnetworkId: this.subnetworkId,
      },
      allowOrphan: false,
    });
  }
}
