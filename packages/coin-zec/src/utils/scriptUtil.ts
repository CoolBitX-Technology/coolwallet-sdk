import { error, utils, tx } from '@coolwallet/core';
import * as params from '../config/params';
import * as cryptoUtil from './cryptoUtil';
import * as txUtil from './transactionUtil';
import * as bufferUtil from './bufferUtil';
import * as types from '../config/types';
import rlp from 'rlp';
import BN from 'bn.js';

export async function getArgument(
  txVersion: params.txVersion,
  scriptType: types.ScriptType,
  inputs: Array<types.Input>,
  output: types.Output,
  change?: types.Change,
  lockTime = 0,
  expiryHeight = 0
): Promise<string> {
  const transaction: Array<Buffer | Buffer[]> = [];
  const versionBuf = bufferUtil.toUintBuffer(params.ZcashTxVersion[txVersion], 4);
  transaction.push(versionBuf);
  const groupIdBuf = bufferUtil.toUintBuffer(params.ZcashGroupId[txVersion], 4);
  transaction.push(groupIdBuf);

  const prevouts = inputs.map((input) => {
    return Buffer.concat([Buffer.from(input.preTxHash, 'hex').reverse(), bufferUtil.toUintBuffer(input.preIndex, 4)]);
  });
  const hashPrevouts = cryptoUtil.blake2b256Personal(Buffer.concat(prevouts), Buffer.from('ZcashPrevoutHash'));
  transaction.push(hashPrevouts);

  const sequences = inputs.map((input) => {
    return Buffer.concat([
      input.sequence ? bufferUtil.toUintBuffer(input.sequence, 4) : Buffer.from('ffffffff', 'hex'),
    ]);
  });
  const hashSequence = cryptoUtil.blake2b256Personal(Buffer.concat(sequences), Buffer.from('ZcashSequencHash'));
  transaction.push(hashSequence);

  const { scriptType: outputType, outHash: outputHash } = txUtil.addressToOutScript(output.address);
  if (!outputHash) {
    throw new error.SDKError(getArgument.name, `OutputHash Undefined`);
  }
  const outputAmount = Buffer.from(new BN(output.value).toArray());
  transaction.push(outputAmount);
  const outputScriptType = bufferUtil.toUintBuffer(outputType, 1);
  transaction.push(outputScriptType);
  const outputDest = outputHash;
  transaction.push(outputDest);

  let haveChange;
  let changeAmount;
  let changeScriptType;
  let changePath;
  if (change) {
    if (!change.pubkeyBuf) throw new error.SDKError(getArgument.name, 'Public Key not exists !!');
    haveChange = bufferUtil.toUintBuffer(1, 1);
    changeAmount = Buffer.from(new BN(change.value).toArray());
    changeScriptType = bufferUtil.toUintBuffer(scriptType, 1);
    changePath = Buffer.from(await utils.getPath(params.COIN_TYPE, change.addressIndex), 'hex');
  } else {
    haveChange = bufferUtil.toUintBuffer(0, 1);
    changeAmount = Buffer.alloc(0);
    changeScriptType = Buffer.alloc(0);
    changePath = Buffer.alloc(0);
  }
  transaction.push(haveChange);
  transaction.push(changeAmount);
  transaction.push(changeScriptType);
  transaction.push(changePath);

  const outputHashPersonal = Buffer.from('ZcashOutputsHash');
  transaction.push(outputHashPersonal);

  const lockTimeBuf = bufferUtil.toUintBuffer(lockTime, 4);
  transaction.push(lockTimeBuf);

  const expiryHeightBuf = bufferUtil.toUintBuffer(expiryHeight, 4);
  transaction.push(expiryHeightBuf);

  const hashTypeBuf = Buffer.from('81000000', 'hex');
  transaction.push(hashTypeBuf);

  const rlpInput = transaction.map((item) =>
    item instanceof Uint8Array ? item : Uint8Array.from(item as unknown as number[])
  );
  return Buffer.from(rlp.encode(rlpInput)).toString('hex');
}

export async function getScriptSigningActions(
  txVersion: params.txVersion,
  transport: types.Transport,
  scriptType: types.ScriptType,
  appId: string,
  appPrivateKey: string,
  inputs: Array<types.Input>,
  preparedData: types.PreparedData,
  output: types.Output,
  change: types.Change | undefined
): Promise<{
  preActions: Array<Function>;
  actions: Array<Function>;
}> {
  const script = params.TRANSFER.script + params.TRANSFER.signature;
  const argument = '00' + (await getArgument(txVersion, scriptType, inputs, output, change)); // keylength zero

  const preActions = [];
  const sendScript = async () => {
    await tx.command.sendScript(transport, script);
  };
  preActions.push(sendScript);

  const sendArgument = async () => {
    await tx.command.executeScript(transport, appId, appPrivateKey, argument);
  };
  preActions.push(sendArgument);

  const utxoArguments = preparedData.preparedInputs.map(async (preparedInput) => {
    const SEPath = Buffer.from(`15${await utils.getPath(params.COIN_TYPE, preparedInput.addressIndex)}`, 'hex');
    const outPoint = preparedInput.preOutPointBuf;
    let inputScript;
    if (scriptType === types.ScriptType.P2PKH) {
      const inputHash = cryptoUtil.hash160(preparedInput.pubkeyBuf);
      inputScript = Buffer.concat([Buffer.from('1976a914', 'hex'), inputHash, Buffer.from('88ac', 'hex')]);
    } else {
      throw new error.SDKError(getScriptSigningActions.name, `Unsupport ScriptType '${scriptType}'`);
    }
    const inputAmount = preparedInput.preValueBuf;
    const inputSequence = preparedInput.sequenceBuf;

    return Buffer.concat([SEPath, outPoint, inputScript, inputAmount, inputSequence]).toString('hex');
  });

  const branchIdBuf = Buffer.allocUnsafe(4);
  branchIdBuf.writeUInt32LE(params.BranchId, 0);
  const transactionSigningHashContext = Buffer.concat([Buffer.from('ZcashSigHash'), branchIdBuf]);

  const actions = utxoArguments.map((utxoArgument) => async () => {
    return tx.command.executeUtxoSegmentScript(
      transport,
      appId,
      appPrivateKey,
      await utxoArgument,
      transactionSigningHashContext.toString('hex')
    );
  });

  return { preActions, actions };
}
