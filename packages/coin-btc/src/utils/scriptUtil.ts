import { CardType, Transport, error } from '@coolwallet/core';
import * as cryptoUtil from './cryptoUtil';
import * as bufferUtil from './bufferUtil';
import * as txUtil from './transactionUtil';
import * as varuint from './varuintUtil';
import { COIN_TYPE } from '../config/param';
import { utils, tx } from '@coolwallet/core';
import { ScriptType, Input, Output, Change, PreparedData, Callback } from '../config/types';
import { pubkeyToAddressAndOutScript, toReverseUintBuffer } from './transactionUtil';
import { PathType } from '@coolwallet/core/lib/config/param';
import { shouldUseLegacyScript10Or11, shouldUseLegacyUtxoScript } from './versionUtil';

// script type 14, 15 only support for se version greater than 330.
const getExtraTransactionType = (cardType: CardType, seVersion: number, redeemScriptType: ScriptType) => {
  if (shouldUseLegacyScript10Or11(cardType, seVersion)) {
    return redeemScriptType === ScriptType.P2PKH ? '10' : '11';
  } else {
    return redeemScriptType === ScriptType.P2PKH ? '14' : '15';
  }
};

const getPath = async (addressIndex: number, purpose?: number, pathType?: PathType) => {
  let path = await utils.getPath(COIN_TYPE, addressIndex, 5, pathType, purpose);
  path = '15' + path;
  return path;
};

export async function getScriptSigningActions(
  transport: Transport,
  redeemScriptType: ScriptType,
  appId: string,
  appPrivateKey: string,
  preparedData: PreparedData,
  seVersion: number
): Promise<{
  actions: Array<Callback>;
}> {
  if (shouldUseLegacyUtxoScript(transport.cardType, seVersion) || redeemScriptType === ScriptType.P2PKH) {
    const utxoArguments = preparedData.preparedInputs.map(async (preparedInput) => {
      const path = await getPath(preparedInput.addressIndex);
      const SEPath = Buffer.from(`${path}`, 'hex');
      const outPoint = preparedInput.preOutPointBuf;
      let inputScriptType;
      // TODO
      if (
        redeemScriptType === ScriptType.P2PKH ||
        redeemScriptType === ScriptType.P2WPKH ||
        redeemScriptType === ScriptType.P2SH_P2WPKH
      ) {
        inputScriptType = varuint.encode(0);
      } else {
        //(scriptType == ScriptType.P2WSH)
        inputScriptType = varuint.encode(1);
      }
      const inputAmount = preparedInput.preValueBuf.reverse();
      const inputHash = cryptoUtil.hash160(preparedInput.pubkeyBuf);
      return Buffer.concat([SEPath, outPoint, inputScriptType, inputAmount, inputHash]).toString('hex');
    });

    const extraTransactionType = getExtraTransactionType(transport.cardType, seVersion, redeemScriptType);
    const actions = utxoArguments.map((utxoArgument) => async () => {
      return tx.command.executeUtxoScript(transport, appId, appPrivateKey, await utxoArgument, extraTransactionType);
    });
    return { actions };
  } else if (redeemScriptType === ScriptType.P2TR) {
    const actions = preparedData.preparedInputs.map((preparedInput, index) => async () => {
      const SEPath = Buffer.from(
        await getPath(preparedInput.addressIndex, preparedInput.purposeIndex, PathType.BIP340),
        'hex'
      );
      return tx.command.executeUtxoSegmentScript(
        transport,
        appId,
        appPrivateKey,
        Buffer.concat([SEPath, bufferUtil.toReverseUintBuffer(index, 4)]).toString('hex')
      );
    });
    return { actions };
  } else {
    const utxoArguments = preparedData.preparedInputs.map(async (preparedInput) => {
      const SEPath = Buffer.from(await getPath(preparedInput.addressIndex, preparedInput.purposeIndex), 'hex');
      const outPoint = preparedInput.preOutPointBuf;
      let inputScript;
      switch (redeemScriptType) {
        case ScriptType.P2SH_P2WPKH:
        case ScriptType.P2WPKH: {
          const { outScript } = pubkeyToAddressAndOutScript(preparedInput.pubkeyBuf, ScriptType.P2PKH);
          inputScript = outScript;
          break;
        }
        case ScriptType.P2WSH:
          inputScript = Buffer.from('', 'hex');
          break;
        default:
          throw new error.SDKError(getScriptSigningActions.name, `Unsupport ScriptType '${redeemScriptType}'`);
      }
      const inputAmount = preparedInput.preValueBuf;
      return Buffer.concat([
        SEPath,
        outPoint,
        Buffer.from(inputScript.length.toString(16), 'hex'),
        inputScript,
        inputAmount,
      ]).toString('hex');
    });

    const actions = utxoArguments.map((utxoArgument) => async () => {
      return tx.command.executeUtxoSegmentScript(transport, appId, appPrivateKey, await utxoArgument);
    });
    return { actions };
  }
}

export function getScriptSigningPreActions(
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  script: string,
  inputArgument: string
): {
  preActions: Array<Callback>;
} {
  // const argument = "00" + getBTCArgument(redeemScriptType, inputs, output, change);// keylength zero
  const argument = '00' + inputArgument; // keylength zero
  console.debug('argument: ', argument);

  const preActions = [];
  const sendScript = async () => {
    await tx.command.sendScript(transport, script);
  };
  preActions.push(sendScript);

  const sendArgument = async () => {
    await tx.command.executeScript(transport, appId, appPrivateKey, argument);
  };
  preActions.push(sendArgument);

  return { preActions };
}

export async function getBTCArgument(
  scriptType: ScriptType,
  inputs: Array<Input>,
  output: Output,
  change?: Change
): Promise<string> {
  const { scriptType: outputType, outHash: outputHash } = txUtil.addressToOutScript(output.address);
  if (!outputHash) {
    throw new error.SDKError(getBTCArgument.name, `OutputHash Undefined`);
  }
  let outputScriptType;
  let outputHashBuf;
  if (outputType === ScriptType.P2PKH || outputType === ScriptType.P2SH_P2WPKH || outputType === ScriptType.P2WPKH) {
    outputScriptType = varuint.encode(outputType);
    outputHashBuf = Buffer.from(`000000000000000000000000${outputHash.toString('hex')}`, 'hex');
  } else if (outputType === ScriptType.P2WSH) {
    outputScriptType = varuint.encode(outputType);
    outputHashBuf = Buffer.from(outputHash.toString('hex'), 'hex');
  } else {
    throw new error.SDKError(getBTCArgument.name, `Unsupport ScriptType '${outputType}'`);
  }
  const outputAmount = bufferUtil.toUintBuffer(output.value, 8);
  //[haveChange(1B)] [changeScriptType(1B)] [changeAmount(8B)] [changePath(21B)]
  let haveChange;
  let changeScriptType;
  let changeAmount;
  let changePath;
  if (change) {
    if (!change.pubkeyBuf) throw new error.SDKError(getBTCArgument.name, 'Public Key not exists !!');
    haveChange = varuint.encode(1);
    changeScriptType = bufferUtil.toUintBuffer(scriptType, 1);
    changeAmount = bufferUtil.toUintBuffer(change.value, 8);
    changePath = Buffer.from(await utils.getPath(COIN_TYPE, change.addressIndex), 'hex');
  } else {
    haveChange = Buffer.from('00', 'hex');
    changeScriptType = Buffer.from('00', 'hex');
    changeAmount = bufferUtil.toUintBuffer(0, 8); //)Buffer.from('0000000000000000', 'hex');
    changePath = bufferUtil.toUintBuffer(0, 21); //Buffer.from('000000000000000000000000000000000000000000', 'hex');
  }
  const prevouts = inputs.map((input) => {
    return Buffer.concat([
      Buffer.from(input.preTxHash, 'hex').reverse(),
      bufferUtil.toReverseUintBuffer(input.preIndex, 4),
    ]);
  });
  const hashPrevouts = cryptoUtil.doubleSha256(Buffer.concat(prevouts));
  const sequences = inputs.map((input) => {
    return Buffer.concat([
      input.sequence ? bufferUtil.toReverseUintBuffer(input.sequence, 4) : Buffer.from('ffffffff', 'hex'),
    ]);
  });
  const hashSequence = cryptoUtil.doubleSha256(Buffer.concat(sequences));

  return Buffer.concat([
    outputScriptType,
    outputAmount,
    outputHashBuf,
    haveChange,
    changeScriptType,
    changeAmount,
    changePath,
    hashPrevouts,
    hashSequence,
  ]).toString('hex');
}

export async function getWitness0Argument(
  scriptType: ScriptType,
  inputs: Array<Input>,
  output: Output,
  change?: Change
): Promise<string> {
  const { scriptType: outputType, scriptPubKey } = txUtil.addressToOutScript(output.address);
  if (!scriptPubKey) {
    throw new error.SDKError(getWitness0Argument.name, `OutputHash Undefined`);
  }
  const reverseVersion = Buffer.from('02000000', 'hex');

  const prevouts = inputs.map((input) => {
    return Buffer.concat([
      Buffer.from(input.preTxHash, 'hex').reverse(),
      bufferUtil.toReverseUintBuffer(input.preIndex, 4),
    ]);
  });

  const hashPrevouts = cryptoUtil.doubleSha256(Buffer.concat(prevouts));
  const sequences = inputs.map((input) => {
    return Buffer.concat([
      input.sequence ? bufferUtil.toReverseUintBuffer(input.sequence, 4) : Buffer.from('ffffffff', 'hex'),
    ]);
  });
  const hashSequences = cryptoUtil.doubleSha256(Buffer.concat(sequences));

  const zeroPadding = Buffer.from('00000000', 'hex');

  let outputScriptType;
  let outputHashBuf;
  if (outputType === ScriptType.P2PKH || outputType === ScriptType.P2SH_P2WPKH || outputType === ScriptType.P2WPKH) {
    outputScriptType = varuint.encode(outputType);
    outputHashBuf = Buffer.from(`000000000000000000000000${scriptPubKey.toString('hex')}`, 'hex');
  } else if (outputType === ScriptType.P2WSH || outputType === ScriptType.P2TR) {
    outputScriptType = varuint.encode(outputType);
    outputHashBuf = scriptPubKey;
  } else {
    throw new error.SDKError(getBTCArgument.name, `Unsupport ScriptType '${outputType}'`);
  }
  const outputAmount = bufferUtil.toUintBuffer(output.value, 8);
  //[haveChange(1B)] [changeScriptType(1B)] [changeAmount(8B)] [changePath(21B)]
  let haveChange;
  let changeScriptType;
  let changeAmount;
  let changePath;
  if (change) {
    if (!change.pubkeyBuf) throw new error.SDKError(getWitness0Argument.name, 'Public Key not exists !!');
    haveChange = varuint.encode(1);
    changeScriptType = bufferUtil.toUintBuffer(scriptType, 1);
    changeAmount = bufferUtil.toUintBuffer(change.value, 8);
    changePath = Buffer.from(
      await utils.getPath(COIN_TYPE, change.addressIndex, 5, PathType.BIP32, change.purposeIndex),
      'hex'
    );
  } else {
    haveChange = Buffer.from('00', 'hex');
    changeScriptType = Buffer.from('00', 'hex');
    changeAmount = bufferUtil.toUintBuffer(0, 8); //)Buffer.from('0000000000000000', 'hex');
    changePath = bufferUtil.toUintBuffer(0, 21); //Buffer.from('000000000000000000000000000000000000000000', 'hex');
  }

  const reverseSequence = Buffer.from('fdffffff', 'hex');

  const reverseLockTime = Buffer.from('00000000', 'hex');

  const reverseHashType = Buffer.from('01000000', 'hex');

  return Buffer.concat([
    reverseVersion,
    hashPrevouts,
    hashSequences,
    zeroPadding,
    outputScriptType,
    outputAmount,
    outputHashBuf,
    haveChange,
    changeScriptType,
    changeAmount,
    changePath,
    reverseSequence,
    reverseLockTime,
    reverseHashType,
  ]).toString('hex');
}

export async function getWitness1Argument(
  scriptType: ScriptType,
  inputs: Array<Input>,
  output: Output,
  change?: Change
): Promise<string> {
  const { scriptType: outputType, scriptPubKey } = txUtil.addressToOutScript(output.address);
  if (!scriptPubKey) {
    throw new error.SDKError(getWitness1Argument.name, `OutputHash Undefined`);
  }
  const reverseVersion = Buffer.from('02000000', 'hex');
  const reverseLockTime = Buffer.from('00000000', 'hex');
  const prevouts = inputs.map((input) => {
    return Buffer.concat([
      Buffer.from(input.preTxHash, 'hex').reverse(),
      bufferUtil.toReverseUintBuffer(input.preIndex, 4),
    ]);
  });

  const hashPrevouts = cryptoUtil.sha256(Buffer.concat(prevouts));
  const amounts = inputs.map((input) => {
    return Buffer.concat([toReverseUintBuffer(input.preValue, 8)]);
  });
  const hashAmounts = cryptoUtil.sha256(Buffer.concat(amounts));

  const scriptPubkeys = inputs.map((input) => {
    let inputScript;
    switch (scriptType) {
      case ScriptType.P2SH_P2WPKH:
      case ScriptType.P2WPKH:
      case ScriptType.P2TR: {
        if (!input.pubkeyBuf) {
          throw new error.SDKError(getWitness1Argument.name, 'Public Key not exists !!');
        }
        const { outScript } = pubkeyToAddressAndOutScript(input.pubkeyBuf, scriptType);
        inputScript = outScript;
        break;
      }
      case ScriptType.P2WSH:
        inputScript = Buffer.from('', 'hex');
        break;
      default:
        throw new error.SDKError(getScriptSigningActions.name, `Unsupport ScriptType '${scriptType}`);
    }
    return Buffer.concat([Buffer.from(inputScript.length.toString(16), 'hex'), inputScript]);
  });
  const hashScriptPubkeys = cryptoUtil.sha256(Buffer.concat(scriptPubkeys));

  const sequences = inputs.map((input) => {
    return Buffer.concat([
      input.sequence ? bufferUtil.toReverseUintBuffer(input.sequence, 4) : Buffer.from('fdffffff', 'hex'),
    ]);
  });
  const hashSequences = cryptoUtil.sha256(Buffer.concat(sequences));

  const zeroPadding = Buffer.from('00000000', 'hex');

  let outputHashBuf;

  if (outputType === ScriptType.P2PKH || outputType === ScriptType.P2SH_P2WPKH || outputType === ScriptType.P2WPKH) {
    outputHashBuf = Buffer.from(`000000000000000000000000${scriptPubKey.toString('hex')}`, 'hex');
  } else if (outputType === ScriptType.P2WSH || outputType === ScriptType.P2TR) {
    outputHashBuf = scriptPubKey;
  } else {
    throw new error.SDKError(getBTCArgument.name, `Unsupport ScriptType '${outputType}'`);
  }
  const outputScriptType = varuint.encode(outputType);

  const outputAmount = bufferUtil.toUintBuffer(output.value, 8);
  //[haveChange(1B)] [changeScriptType(1B)] [changeAmount(8B)] [changePath(21B)]
  let haveChange;
  let changeScriptType;
  let changeAmount;
  let changePath;
  if (change) {
    if (!change.pubkeyBuf) throw new error.SDKError(getWitness1Argument.name, 'Public Key not exists !!');
    haveChange = varuint.encode(1);
    changeScriptType = bufferUtil.toUintBuffer(scriptType, 1);
    changeAmount = bufferUtil.toUintBuffer(change.value, 8);
    changePath = Buffer.from(
      await utils.getPath(COIN_TYPE, change.addressIndex, 5, PathType.BIP340, change.purposeIndex),
      'hex'
    );
  } else {
    haveChange = Buffer.from('00', 'hex');
    changeScriptType = Buffer.from('00', 'hex');
    changeAmount = bufferUtil.toUintBuffer(0, 8); //)Buffer.from('0000000000000000', 'hex');
    changePath = bufferUtil.toUintBuffer(0, 21); //Buffer.from('000000000000000000000000000000000000000000', 'hex');
  }

  return Buffer.concat([
    reverseVersion,
    reverseLockTime,
    hashPrevouts,
    hashAmounts,
    hashScriptPubkeys,
    hashSequences,
    zeroPadding,
    outputScriptType,
    outputAmount,
    outputHashBuf,
    haveChange,
    changeScriptType,
    changeAmount,
    changePath,
  ]).toString('hex');
}

export async function getUSDTArgument(
  scriptType: ScriptType,
  inputs: Array<Input>,
  output: Output,
  value: string,
  change?: Change
) {
  const { scriptType: outputType, outHash: outputHash } = txUtil.addressToOutScript(output.address);
  if (!outputHash) {
    throw new error.SDKError(getBTCArgument.name, `OutputHash Undefined`);
  }
  let outputScriptType;
  let outputHashBuf;
  if (outputType === ScriptType.P2PKH || outputType === ScriptType.P2SH_P2WPKH || outputType === ScriptType.P2WPKH) {
    outputScriptType = varuint.encode(outputType);
    outputHashBuf = Buffer.from(`000000000000000000000000${outputHash.toString('hex')}`, 'hex');
  } else if (outputType === ScriptType.P2WSH) {
    outputScriptType = varuint.encode(outputType);
    outputHashBuf = Buffer.from(outputHash.toString('hex'), 'hex');
  } else {
    throw new error.SDKError(getBTCArgument.name, `Unsupport ScriptType '${outputType}'`);
  }
  const outputAmount = bufferUtil.toUintBuffer(output.value, 8);
  //[haveChange(1B)] [changeScriptType(1B)] [changeAmount(8B)] [changePath(21B)]
  let haveChange;
  let changeScriptType;
  let changeAmount;
  let changePath;
  if (change) {
    if (!change.pubkeyBuf) throw new error.SDKError(getBTCArgument.name, 'Public Key not exists !!');
    haveChange = varuint.encode(1);
    changeScriptType = bufferUtil.toUintBuffer(scriptType, 1);
    changeAmount = bufferUtil.toUintBuffer(change.value, 8);
    changePath = Buffer.from(await utils.getPath(COIN_TYPE, change.addressIndex), 'hex');
  } else {
    haveChange = Buffer.from('00', 'hex');
    changeScriptType = Buffer.from('00', 'hex');
    changeAmount = bufferUtil.toUintBuffer(0, 8); //)Buffer.from('0000000000000000', 'hex');
    changePath = bufferUtil.toUintBuffer(0, 21); //Buffer.from('000000000000000000000000000000000000000000', 'hex');
  }
  const prevouts = inputs.map((input) => {
    return Buffer.concat([
      Buffer.from(input.preTxHash, 'hex').reverse(),
      bufferUtil.toReverseUintBuffer(input.preIndex, 4),
    ]);
  });
  const hashPrevouts = cryptoUtil.doubleSha256(Buffer.concat(prevouts));
  const sequences = inputs.map((input) => {
    return Buffer.concat([
      input.sequence ? bufferUtil.toReverseUintBuffer(input.sequence, 4) : Buffer.from('ffffffff', 'hex'),
    ]);
  });
  const hashSequence = cryptoUtil.doubleSha256(Buffer.concat(sequences));

  const usdtAmount = bufferUtil.toUintBuffer(value, 8);

  return Buffer.concat([
    outputScriptType,
    outputAmount,
    outputHashBuf,
    haveChange,
    changeScriptType,
    changeAmount,
    changePath,
    hashPrevouts,
    hashSequence,
    usdtAmount,
  ]).toString('hex');
}

export async function getUSDTNewArgument(
  scriptType: ScriptType,
  inputs: Array<Input>,
  output: Output,
  value: string,
  change?: Change
): Promise<string> {
  const { scriptType: outputType, outHash: outputHash } = txUtil.addressToOutScript(output.address);
  if (!outputHash) {
    throw new error.SDKError(getBTCArgument.name, `OutputHash Undefined`);
  }
  const reverseVersion = Buffer.from('02000000', 'hex');

  const prevouts = inputs.map((input) => {
    return Buffer.concat([
      Buffer.from(input.preTxHash, 'hex').reverse(),
      bufferUtil.toReverseUintBuffer(input.preIndex, 4),
    ]);
  });

  const hashPrevouts = cryptoUtil.doubleSha256(Buffer.concat(prevouts));
  const sequences = inputs.map((input) => {
    return Buffer.concat([
      input.sequence ? bufferUtil.toReverseUintBuffer(input.sequence, 4) : Buffer.from('ffffffff', 'hex'),
    ]);
  });
  const hashSequences = cryptoUtil.doubleSha256(Buffer.concat(sequences));

  const zeroPadding = Buffer.from('00000000', 'hex');
  const usdtDust = bufferUtil.toUintBuffer(output.value, 8);

  let outputScriptType;
  let outputHashBuf;
  if (outputType === ScriptType.P2PKH || outputType === ScriptType.P2SH_P2WPKH || outputType === ScriptType.P2WPKH) {
    outputScriptType = varuint.encode(outputType);
    outputHashBuf = Buffer.from(`000000000000000000000000${outputHash.toString('hex')}`, 'hex');
  } else if (outputType === ScriptType.P2WSH) {
    outputScriptType = varuint.encode(outputType);
    outputHashBuf = Buffer.from(outputHash.toString('hex'), 'hex');
  } else {
    throw new error.SDKError(getBTCArgument.name, `Unsupport ScriptType '${outputType}'`);
  }
  const usdtAmount = bufferUtil.toUintBuffer(value, 8);
  //[haveChange(1B)] [changeScriptType(1B)] [changeAmount(8B)] [changePath(21B)]
  let haveChange;
  let changeScriptType;
  let changeAmount;
  let changePath;
  if (change) {
    if (!change.pubkeyBuf) throw new error.SDKError(getWitness1Argument.name, 'Public Key not exists !!');
    haveChange = varuint.encode(1);
    changeScriptType = bufferUtil.toUintBuffer(scriptType, 1);
    changeAmount = bufferUtil.toUintBuffer(change.value, 8);
    changePath = Buffer.from(
      await utils.getPath(COIN_TYPE, change.addressIndex, 5, PathType.BIP32, change.purposeIndex),
      'hex'
    );
  } else {
    haveChange = Buffer.from('00', 'hex');
    changeScriptType = Buffer.from('00', 'hex');
    changeAmount = bufferUtil.toUintBuffer(0, 8); //)Buffer.from('0000000000000000', 'hex');
    changePath = bufferUtil.toUintBuffer(0, 21); //Buffer.from('000000000000000000000000000000000000000000', 'hex');
  }

  const reverseSequence = Buffer.from('fdffffff', 'hex');

  const reverseLockTime = Buffer.from('00000000', 'hex');

  const reverseHashType = Buffer.from('01000000', 'hex');

  return Buffer.concat([
    reverseVersion,
    hashPrevouts,
    hashSequences,
    zeroPadding,
    outputScriptType,
    usdtDust,
    usdtAmount,
    outputHashBuf,
    haveChange,
    changeScriptType,
    changeAmount,
    changePath,
    reverseSequence,
    reverseLockTime,
    reverseHashType,
  ]).toString('hex');
}
