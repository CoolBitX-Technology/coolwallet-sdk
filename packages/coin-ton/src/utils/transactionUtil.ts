// import BN from 'bn.js';
// import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';
// import { error } from '@coolwallet/core';
// import * as bitcoin from 'bitcoinjs-lib';
// import * as varuint from './varuintUtil';
// import { ScriptType, Input, Output, Change, PreparedData } from '../config/types';
// import { network } from '../config/param';

// bitcoin.initEccLib(ecc);

// export function toReverseUintBuffer(numberOrString: number | string, byteSize: number): Buffer {
//   const bn = new BN(numberOrString);
//   const buf = Buffer.from(bn.toArray()).reverse();
//   return Buffer.alloc(byteSize).fill(buf, 0, buf.length);
// }

// export function addressToOutScript(address: string): {
//   scriptType: ScriptType;
//   outScript: Buffer;
//   outHash?: Buffer;
//   scriptPubKey?: Buffer;
// } {
//   let scriptType;
//   let payment;
//   let scriptPubKey;
//   if (address.startsWith('D')) {
//     scriptType = ScriptType.P2PKH;
//     payment = bitcoin.payments.p2pkh({ address, network });
//     scriptPubKey = payment.hash;
//   } else if (address.startsWith('A') || address.startsWith('9')) {
//     scriptType = ScriptType.P2SH;
//     payment = bitcoin.payments.p2sh({ address, network });
//     scriptPubKey = payment.hash;
//   } else {
//     throw new error.SDKError(addressToOutScript.name, `Unsupport Address : ${address}`);
//   }
//   if (!payment.output) throw new error.SDKError(addressToOutScript.name, `No OutScript for Address : ${address}`);
//   const outScript = payment.output;
//   const outHash = payment.hash;
//   return { scriptType, outScript, outHash, scriptPubKey };
// }

// export async function checkRedeemScriptType(redeemScriptType: ScriptType) {
//   if (redeemScriptType !== ScriptType.P2PKH) {
//     throw new error.SDKError(checkRedeemScriptType.name, `Unsupport ScriptType '${redeemScriptType}'`);
//   }
// }

// export function pubkeyToAddressAndOutScript(
//   pubkey: Buffer,
//   scriptType: ScriptType
// ): { address: string; outScript: Buffer } {
//   let payment;
//   switch (scriptType) {
//     case ScriptType.P2PKH:
//       payment = bitcoin.payments.p2pkh({ pubkey, network });
//       break;
//     default:
//       throw new error.SDKError(pubkeyToAddressAndOutScript.name, `Unsupport ScriptType '${scriptType}'`);
//   }
//   if (!payment.address)
//     throw new error.SDKError(pubkeyToAddressAndOutScript.name, `No Address for ScriptType '${scriptType}'`);
//   if (!payment.output)
//     throw new error.SDKError(pubkeyToAddressAndOutScript.name, `No OutScript for ScriptType '${scriptType}'`);
//   return { address: payment.address, outScript: payment.output };
// }

// export function createPreparedData(
//   redeemScriptType: ScriptType,
//   inputs: Array<Input>,
//   output: Output,
//   change?: Change | null,
//   version = 1,
//   lockTime = 0
// ): {
//   preparedData: PreparedData;
// } {
//   const versionBuf = toReverseUintBuffer(version, 4);
//   const lockTimeBuf = toReverseUintBuffer(lockTime, 4);
//   const inputsCount = varuint.encode(inputs.length);
//   const preparedInputs = inputs.map(
//     ({ preTxHash, preIndex, preValue, sequence, addressIndex, pubkeyBuf, purposeIndex }) => {
//       if (!pubkeyBuf) {
//         throw new error.SDKError(createPreparedData.name, 'Public Key not exists !!');
//       }
//       const preOutPointBuf = Buffer.concat([Buffer.from(preTxHash, 'hex').reverse(), toReverseUintBuffer(preIndex, 4)]);

//       const preValueBuf = toReverseUintBuffer(preValue, 8);
//       const sequenceBuf = sequence ? toReverseUintBuffer(sequence, 4) : Buffer.from('ffffffff', 'hex');

//       return {
//         addressIndex,
//         pubkeyBuf,
//         preOutPointBuf,
//         preValueBuf,
//         sequenceBuf,
//         purposeIndex,
//       };
//     }
//   );

//   const { scriptType: outputType, outScript: outputScript } = addressToOutScript(output.address);
//   const outputScriptLen = varuint.encode(outputScript.length);

//   const outputArray = [Buffer.concat([toReverseUintBuffer(output.value, 8), outputScriptLen, outputScript])];

//   if (change) {
//     if (!change.pubkeyBuf) throw new error.SDKError(createPreparedData.name, 'Public Key not exists !!');
//     const changeValue = toReverseUintBuffer(change.value, 8);
//     const { outScript } = pubkeyToAddressAndOutScript(change.pubkeyBuf, redeemScriptType);
//     const outScriptLen = varuint.encode(outScript.length);
//     outputArray.push(Buffer.concat([changeValue, outScriptLen, outScript]));
//   }

//   const outputsCountNum = change ? 2 : 1;
//   const outputsCount = varuint.encode(outputsCountNum);
//   const outputsBuf = Buffer.concat(outputArray);

//   return {
//     preparedData: {
//       versionBuf,
//       inputsCount,
//       preparedInputs,
//       outputType,
//       outputsCount,
//       outputsBuf,
//       lockTimeBuf,
//     },
//   };
// }

// export function composeFinalTransaction(preparedData: PreparedData, signatures: Array<Buffer>): Buffer {
//   const { versionBuf, inputsCount, preparedInputs, outputsCount, outputsBuf, lockTimeBuf } = preparedData;

//   const inputsBuf = Buffer.concat(
//     preparedInputs.map((data, i) => {
//       const { pubkeyBuf, preOutPointBuf, sequenceBuf } = data;
//       const signature = signatures[i];
//       const inScript = Buffer.concat([
//         Buffer.from((signature.length + 1).toString(16), 'hex'),
//         signature,
//         Buffer.from('81', 'hex'),
//         Buffer.from(pubkeyBuf.length.toString(16), 'hex'),
//         pubkeyBuf,
//       ]);
//       return Buffer.concat([preOutPointBuf, varuint.encode(inScript.length), inScript, sequenceBuf]);
//     })
//   );
//   return Buffer.concat([versionBuf, inputsCount, inputsBuf, outputsCount, outputsBuf, lockTimeBuf]);
// }
