import { TransactionInput, TransactionOutput, TxInfo } from '../config/types';

const SompiPerKaspa = 100_000_000;
// MaxSompi is the maximum transaction amount allowed in sompi.
const MaxSompi = 21_000_000 * SompiPerKaspa;
// minimumRelayTransactionFee in sompi per 1kg (or 1000 grams)
export function minimumRequiredTransactionRelayFee(mass: number, minimumRelayTransactionFee = 1000): number {
  let minimumFee = (mass * minimumRelayTransactionFee) / 1000;

  if (minimumFee === 0 && minimumRelayTransactionFee > 0) {
    minimumFee = minimumRelayTransactionFee;
  }
  // Set the minimum fee to the maximum possible value if the calculated
  // fee is not in the valid range for monetary amounts.
  if (minimumFee > MaxSompi) {
    minimumFee = MaxSompi;
  }

  return minimumFee;
}

function estimatedOutpointSerializedSize(): number {
  let txSize = 0;
  txSize += 32; // Previous tx ID
  txSize += 4; // Index (u32)
  return txSize;
}

function estimatedTransactionInputsSerializedSize(input: TransactionInput): number {
  let txSize = 0;
  txSize += estimatedOutpointSerializedSize();

  txSize += 8; // length of signature script (u64)
  if ('signatureScript' in input && input.signatureScript.length > 0) {
    txSize += input.signatureScript.length / 2;
  } else {
    txSize += 66;
  }

  txSize += 8; // sequence (uint64)
  return txSize;
}

function estimatedOutputsSerializedSize(output: TransactionOutput): number {
  let txSize = 0;
  txSize += 8; // value (u64)
  txSize += 2; // output.ScriptPublicKey.Version (u16)
  txSize += 8; // length of script public key (u64)
  txSize += output.scriptPublicKey.scriptPublicKey.length / 2;
  return txSize;
}

const MassPerSigOp = 1000;
const MassPerTxByte = 1;
const MassPerScriptPubKeyByte = 10;
function estimateTransactionSerializedSize(inputs: Array<TransactionInput>, outputs: Array<TransactionOutput>): number {
  let txSize = 0;
  txSize += 2; // Tx version (u16)
  txSize += 8; // length of inputs (u64)
  const inputsSize = inputs
    .map((input) => estimatedTransactionInputsSerializedSize(input))
    .reduce((pre, next) => pre + next, 0);
  txSize += inputsSize;

  txSize += 8; // length of outputs (u64)
  const outputsSize = outputs.map(estimatedOutputsSerializedSize).reduce((pre, next) => pre + next, 0);
  txSize += outputsSize;

  txSize += 8; // lock time (u64)
  txSize += '0000000000000000000000000000000000000000'.length / 2; // subnetworkId
  txSize += 8; // gas (u64)
  txSize += '0000000000000000000000000000000000000000000000000000000000000000'.length / 2; // payload
  txSize += '0000000000000000'.length / 2; // length of unknown (u64)
  return txSize;
}

function calculateInputSigOpCounts(inputs: Array<TransactionInput>): number {
  return inputs.reduce((total, input) => total + input.sigOpCount, 0);
}

function calculateOutputsScriptPubKeySize(outputs: Array<TransactionOutput>): number {
  return outputs.reduce((total, output) => {
    // version (uint16) + scriptPublicKey
    return total + 2 + output.scriptPublicKey.scriptPublicKey.length / 2;
  }, 0);
}

export function getMassAndSize(inputs: Array<TransactionInput>, outputs: Array<TransactionOutput>): TxInfo {
  const txSize = estimateTransactionSerializedSize(inputs, outputs);
  const totalSigOpCount = calculateInputSigOpCounts(inputs);
  const totalScriptPubKeySize = calculateOutputsScriptPubKeySize(outputs);
  return {
    txSize,
    mass: txSize * MassPerTxByte + totalScriptPubKeySize * MassPerScriptPubKeyByte + totalSigOpCount * MassPerSigOp,
  };
}
