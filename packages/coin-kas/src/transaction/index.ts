import { TransactionInput, TransactionOutput, TransactionUtxo, TxData, TxInfo } from '../config/type';
import { payToAddrScript } from '../utils/address';
import { toHex } from '../utils/utils';
import { SIGHASH_ALL } from '../utils/hash';
import BigNumber from 'bignumber.js';
import { getMassAndSize, minimumRequiredTransactionRelayFee } from '../utils/estimateFee';

export class Transaction {
  version: number = 0;
  inputs: TransactionInput[] = [];
  outputs: TransactionOutput[] = [];
  lockTime: string = '0';
  subnetworkId: string = '0000000000000000000000000000000000000000';
  utxos: TransactionUtxo[] = [];

  static fromTxData(txData: TxData): Transaction {
    return new Transaction(txData);
  }

  constructor(txData: TxData) {
    let totalInput = 0;
    txData.inputs.forEach((input) => {
      this.inputs.push({
        previousOutpoint: {
          transactionId: input.txId,
          index: input.vout,
        },
        signatureScript: '',
        sequence: '0',
        sigOpCount: 1,
      });

      this.utxos.push({
        pkScript: payToAddrScript(input.address),
        amount: input.value,
      });

      totalInput = new BigNumber(input.value).plus(new BigNumber(totalInput)).toNumber();
    });

    let totalOutput = 0;
    txData.outputs.forEach((output) => {
      this.outputs.push({
        scriptPublicKey: {
          version: 0,
          scriptPublicKey: toHex(payToAddrScript(output.address)),
        },
        amount: output.value,
      });

      totalOutput += new BigNumber(output.value).plus(new BigNumber(totalOutput)).toNumber();
    });

    const changeAmount = new BigNumber(totalInput).minus(new BigNumber(totalOutput)).minus(new BigNumber(txData.fee));
    if (!changeAmount.isZero()) {
      this.outputs.push({
        scriptPublicKey: {
          version: 0,
          scriptPublicKey: toHex(payToAddrScript(txData.changeAddress)),
        },
        amount: changeAmount.toString(),
      });
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
        inputs: this.inputs,
        outputs: this.outputs,
        lockTime: this.lockTime,
        subnetworkId: this.subnetworkId,
      },
      allowOrphan: false,
    });
  }
}
