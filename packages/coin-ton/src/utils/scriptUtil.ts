// import { Transport, apdu, error, utils } from '@coolwallet/core';
// import * as bufferUtil from './bufferUtil';
// import * as txUtil from './transactionUtil';
// import * as varuint from './varuintUtil';
// import { COIN_TYPE } from '../config/param';
// import { Output, Change, PreparedData, Callback, ScriptType } from '../config/types';
// import { PathType } from '@coolwallet/core/lib/config/param';
// import { pubkeyToAddressAndOutScript } from './transactionUtil';

// const getPath = async (addressIndex: number, purpose?: number, pathType?: PathType) => {
//   let path = await utils.getPath(COIN_TYPE, addressIndex, 5, pathType, purpose);
//   path = '15' + path;
//   return path;
// };

// export async function getScriptSigningActions(
//   transport: Transport,
//   appId: string,
//   appPrivateKey: string,
//   preparedData: PreparedData
// ): Promise<{
//   actions: Array<Callback>;
// }> {
//   const utxoArguments = preparedData.preparedInputs.map(async (preparedInput) => {
//     const path = await getPath(preparedInput.addressIndex);
//     const SEPath = Buffer.from(`${path}`, 'hex');
//     const outPoint = preparedInput.preOutPointBuf;
//     const inputScriptType = varuint.encode(0);
//     const inputAmount = preparedInput.preValueBuf.reverse();
//     const inputHash = cryptoUtil.hash160(preparedInput.pubkeyBuf);
//     return Buffer.concat([SEPath, outPoint, inputScriptType, inputAmount, inputHash]).toString('hex');
//   });

//   const actions = utxoArguments.map((utxoArgument) => async () => {
//     return apdu.tx.executeUtxoSegmentScript(transport, appId, appPrivateKey, await utxoArgument);
//   });
//   return { actions };
// }

// export async function getScriptSigningActions(
//   transport: Transport,
//   appId: string,
//   appPrivateKey: string,
//   preparedData: PreparedData
// ): Promise<{
//   actions: Array<Callback>;
// }> {
//   const utxoArguments = preparedData.preparedInputs.map(async (preparedInput) => {
//     const path = await getPath(preparedInput.addressIndex);
//     const SEPath = Buffer.from(`${path}`, 'hex');
//     const outPoint = preparedInput.preOutPointBuf;
//     const { outScript: inputScript } = pubkeyToAddressAndOutScript(preparedInput.pubkeyBuf, ScriptType.P2PKH);
//     // const inputScriptType = varuint.encode(0);
//     // const inputAmount = preparedInput.preValueBuf.reverse();
//     // const inputHash = cryptoUtil.hash160(preparedInput.pubkeyBuf);
//     return Buffer.concat([SEPath, outPoint, Buffer.from(inputScript.length.toString(16), 'hex'), inputScript]).toString(
//       'hex'
//     );
//   });

//   const actions = utxoArguments.map((utxoArgument) => async () => {
//     return apdu.tx.executeUtxoSegmentScript(transport, appId, appPrivateKey, await utxoArgument);
//   });
//   return { actions };
// }

// export function getScriptSigningPreActions(
//   transport: Transport,
//   appId: string,
//   appPrivateKey: string,
//   script: string,
//   inputArgument: string
// ): {
//   preActions: Array<Callback>;
// } {
//   const argument = '00' + inputArgument; // keylength zero
//   console.debug('argument: ', argument);

//   const preActions = [];
//   const sendScript = async () => {
//     await apdu.tx.sendScript(transport, script);
//   };
//   preActions.push(sendScript);

//   const sendArgument = async () => {
//     await apdu.tx.executeScript(transport, appId, appPrivateKey, argument);
//   };
//   preActions.push(sendArgument);

//   return { preActions };
// }

// export async function getArgument(output: Output, change?: Change): Promise<string> {
//   const { scriptType: outputType, outHash: outputHash } = txUtil.addressToOutScript(output.address);
//   if (!outputHash) {
//     throw new error.SDKError(getArgument.name, `OutputHash Undefined`);
//   }
//   const reverseVersion = Buffer.from('02000000', 'hex');
//   const zeroPadding = Buffer.from('00000000', 'hex');
//   const outputScriptType = varuint.encode(outputType);
//   // const outputHashBuf = Buffer.from(`000000000000000000000000${outputHash.toString('hex')}`, 'hex');
//   const outputAmount = bufferUtil.toUintBuffer(output.value, 8);
//   //[haveChange(1B)] [changeScriptType(1B)] [changeAmount(8B)] [changePath(21B)]
//   let haveChange;
//   let changeAmount;
//   let changePath;
//   if (change) {
//     if (!change.pubkeyBuf) {
//       throw new error.SDKError(getArgument.name, 'Change public key does not exist !!');
//     }
//     haveChange = varuint.encode(1);
//     changeAmount = bufferUtil.toUintBuffer(change.value, 8);
//     changePath = Buffer.from(await utils.getPath(COIN_TYPE, change.addressIndex), 'hex');
//   } else {
//     haveChange = Buffer.from('00', 'hex');
//     changeAmount = bufferUtil.toUintBuffer(0, 8); // Buffer.from('0000000000000000', 'hex');
//     changePath = bufferUtil.toUintBuffer(0, 21); // Buffer.from('000000000000000000000000000000000000000000', 'hex');
//   }
//   const reverseSequence = Buffer.from('fdffffff', 'hex');
//   const reverseLockTime = Buffer.from('00000000', 'hex');

//   return Buffer.concat([
//     reverseVersion,
//     zeroPadding,
//     outputScriptType,
//     outputAmount,
//     outputHash,
//     haveChange,
//     changeAmount,
//     changePath,
//     reverseSequence,
//     reverseLockTime,
//   ]).toString('hex');
// }
