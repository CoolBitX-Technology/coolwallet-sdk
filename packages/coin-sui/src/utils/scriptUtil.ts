import { PathType } from '@coolwallet/core/lib/config';
import { utils } from '@coolwallet/core';
import { messageWithIntent } from '@mysten/sui/cryptography';
import { TokenInfo, ArgumentWithBytes } from '../config/types';
import * as param from '../config/param';

// message: [intent(3 bytes)] [header(3 bytes)] [inputs[0] amount(10 bytes)] [inputs[1] toAddress(34 bytes)] [inputs[2] ...]
// -> intent：scope(1) | version(1) | appId(1)
const INTENT_LENGTH = 3;
// -> pure input：[tag(1 byte)] [length(1 byte)] [value]
const VALUE_PREFIX_LENGTH = 2;

function getTransactionParamsIndex(inputOffset: number): string {
  return (INTENT_LENGTH + VALUE_PREFIX_LENGTH + inputOffset).toString(16).padStart(4, '0');
}

function getScriptArgumentHeader(tokenInfo?: TokenInfo): string {
  const toAddressIndex = getTransactionParamsIndex(param.TRANSACTION_LAYOUT.toAddressInputOffset);
  const amountIndex = getTransactionParamsIndex(param.TRANSACTION_LAYOUT.amountInputOffset);

  const header = toAddressIndex + amountIndex; // 0012 0008
  if (tokenInfo) {
    const tokenInfoArgs = getTokenInfoArgs(tokenInfo);
    return header + tokenInfoArgs; // 0012 0008 060455534443000000
  }
  return header;
}

function getCoinTransferArguments(transaction: string, addressIndex: number): ArgumentWithBytes {
  const SEPath = getSEPath(addressIndex);
  console.debug('SUI.getCoinTransferArguments >>> SEPath: ', SEPath);

  const intentMessageHex = getIntentMessageHex(transaction);
  console.debug('SUI.getCoinTransferArguments >>> intentMessage: ', intentMessageHex);

  const header = getScriptArgumentHeader();
  console.debug('SUI.getCoinTransferArguments >>> header: ', header);

  return {
    argument: SEPath + header + intentMessageHex,
    bytes: transaction,
  };
}

function getTokenInfoArgs(tokenInfo: TokenInfo): string {
  const tokenDecimalsHex = Buffer.from([tokenInfo.decimals]).toString('hex'); // 06
  const scriptTokenSymbol = tokenInfo.symbol.slice(0, 7).toUpperCase(); // USDC
  const tokenSymbolLengthHex = Buffer.from([scriptTokenSymbol.length]).toString('hex'); // 04
  const tokenSymbolHex = Buffer.from(scriptTokenSymbol).toString('hex').padEnd(14, '0'); // 55534443000000

  return tokenDecimalsHex + tokenSymbolLengthHex + tokenSymbolHex;
}

function getTokenTransferArguments(transaction: string, addressIndex: number, tokenInfo: TokenInfo): ArgumentWithBytes {
  const SEPath = getSEPath(addressIndex);
  console.debug('SUI.getTokenTransferArguments >>> SEPath: ', SEPath);

  const intentMessageHex = getIntentMessageHex(transaction);
  console.debug('SUI.getTokenTransferArguments >>> intentMessage: ', intentMessageHex);

  const header = getScriptArgumentHeader(tokenInfo);
  console.debug('SUI.getTokenTransferArguments >>> header: ', header);
  return {
    argument: SEPath + header + intentMessageHex,
    bytes: transaction,
  };
}

function getSmartContractArguments(transaction: string, addressIndex: number): ArgumentWithBytes {
  const SEPath = getSEPath(addressIndex);
  console.debug('SUI.getSmartContractArguments >>> SEPath: ', SEPath);

  const intentMessageHex = getIntentMessageHex(transaction);
  console.debug('SUI.getSmartContractArguments >>> intentMessage: ', intentMessageHex);

  return {
    argument: SEPath + intentMessageHex,
    bytes: transaction,
  };
}

function getSEPath(addressIndex: number): string {
  const path = utils.getFullPath({ pathType: PathType.SLIP0010, pathString: `44'/784'/0'/0'/${addressIndex}'` });
  const pathLength = '15';
  return `${pathLength}${path}`;
}

function getIntentMessageHex(transaction: string): string {
  const txBytes = new Uint8Array(Buffer.from(transaction, 'base64'));
  const intentMessage = messageWithIntent('TransactionData', txBytes); // tx.sign 需要先包一層 intentMessage 才能簽署
  return Buffer.from(intentMessage).toString('hex');
}

export { getCoinTransferArguments, getTokenTransferArguments, getSmartContractArguments };
