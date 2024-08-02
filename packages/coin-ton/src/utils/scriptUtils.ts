import BN from 'bn.js';
import { TransferTokenTransaction, TransferTransaction } from '../config/types';
import TonWeb from 'tonweb';
import { config, utils } from '@coolwallet/core';

const removeHex0x = (hex: string): string => (hex.slice(0, 2) === '0x' ? hex.slice(2) : hex);
const evenHexDigit = (hex: string): string => (hex.length % 2 !== 0 ? `0${hex}` : hex);
const handleHex = (hex: string): string => evenHexDigit(removeHex0x(hex));

/**
  1. Currently, Pro card firmware only supports writing data in Byte, so each bit needs to be written
  as a byte, and the bits must be converted into bytes before signing.

  2. Each toncoin transaction data is composed of one or more Cells, and each Cell contains 1023 bits of data.
*/
export function saveBitAsByte(hex: string): string {
  hex = evenHexDigit(hex);

  const buffer = Buffer.from(hex, 'hex');

  let result = '';
  for (let byte of buffer) {
    for (let bit of byte.toString(2).padStart(8, '0')) {
      result += bit === '0' ? '00' : '01';
    }
  }
  return result;
}

function getSEPath(addressIndex: number): string {
  const pathLength = '0D';
  const path = utils.getFullPath({ pathString: `44'/607'/${addressIndex}'`, pathType: config.PathType.SLIP0010 });
  const SEPath = `${pathLength}${path}`;
  return SEPath;
}

// [seqno(4B)] [expireAt(4B)] [sendMode(1B)] [cell2Length(8B)] [isBounceable(1B)] [toAddress(256B)] [amountLength(4B)] [amount(120B)] [memo(512B)]
export function getArgument(transaction: Required<TransferTransaction>, addressIndex: number): string {
  console.debug(`scriptUtils.getArgument transaction=${JSON.stringify(transaction, null, 2)}`);
  const { seqno, expireAt, toAddress, amount, payload, sendMode } = transaction;

  const { isBounceable, hashPart } = new TonWeb.Address(toAddress);
  const amountBuffer = new BN(amount).toBuffer();

  const seqnoArg = seqno.toString(16).padStart(8, '0');
  const expireAtArg = expireAt.toString(16).padStart(8, '0');
  const sendModeArg = sendMode.toString(16).padStart(2, '0');
  const isBounceableArg = isBounceable ? '01' : '00';
  const toAddressArg = Buffer.from(hashPart).toString('hex');
  const amountLengthArg = amountBuffer.byteLength.toString(16);
  const amountArg = amountBuffer.toString('hex');
  const memoArg = payload ? '00000000' + Buffer.from(new TextEncoder().encode(payload || '')).toString('hex') : '';
  const memoLength = ((memoArg.length / 2) * 8).toString(16).padStart(4, '0');
  const cell2LengthArg = (96 + memoArg.length + amountArg.length).toString(16);

  const argument =
    seqnoArg +
    expireAtArg +
    sendModeArg +
    saveBitAsByte(cell2LengthArg) +
    isBounceableArg +
    saveBitAsByte(toAddressArg) +
    saveBitAsByte(amountLengthArg).slice(8, 16) +
    saveBitAsByte(amountArg).padEnd(240, '0') +
    memoLength +
    saveBitAsByte(memoArg).padEnd(1024, '0');

  return getSEPath(addressIndex) + argument;
}

// Cell3: [cell3Length(8B)][jettonAmountLength(4B)][jettonAmount(120B)][receiver(256B)][receiverWorkchain(8B)][responser(256B)][responserWorkchain(8B)][forwardAmountLength(4B)][forwardAmount(120B)][memoLength(2B)][memo(512)]
// Cell2: [cell2Length(8B)][fromTokenAccount(256B)][fromTokenAccountIsBounceable(1B)][fromTokenAccountWorkchain(8B)][amountLength(4B)][amount(120B)]
// Cell1: [seqno(4B)][expireAt(4B)][sendMode(1B)]
// Token: [tokenDecimal(1B)][tokenNameLength(1B)][tokenName(7B)][tokenContractAddress(36B)][tokenSign(72B)]
export function getTransferTokenArgument(
  transaction: Required<TransferTokenTransaction>,
  addressIndex: number
): string {
  console.debug(`scriptUtils.getArgument transaction=${JSON.stringify(transaction, null, 2)}`);
  const { seqno, expireAt, toAddress: fromTokenAccount, amount, payload, sendMode, tokenInfo } = transaction;
  const { jettonAmount, toAddress: receiver, forwardAmount, forwardPayload, responseAddress } = payload;
  const { symbol, decimals, address: tokenAddress, signature: tokenSignature = '' } = tokenInfo;

  // Cell3
  const { wc: receiverWorkchain, hashPart: receiverHashPart } = new TonWeb.Address(receiver);
  const { wc: responserWorkchain, hashPart: responserHashPart } = new TonWeb.Address(responseAddress);
  const forwardAmountBuffer = new BN(forwardAmount).toBuffer();
  const jettonAmountBuffer = new BN(jettonAmount).toBuffer();

  const jettonAmountLengthArg = jettonAmountBuffer.byteLength.toString(16);
  const jettonAmountArg = jettonAmountBuffer.toString('hex');
  const receiverArg = Buffer.from(receiverHashPart).toString('hex');
  const receiverWorkchainArg = new BN(receiverWorkchain).toString('hex');
  const responserArg = Buffer.from(responserHashPart).toString('hex');
  const responserWorkchainArg = new BN(responserWorkchain).toString('hex');
  const forwardAmountLengthArg = forwardAmountBuffer.byteLength.toString(16);
  const forwardAmountArg = forwardAmountBuffer.toString('hex');
  const memoArg = '00000000' + Buffer.from(new TextEncoder().encode(forwardPayload || '')).toString('hex');
  const memoLength = ((memoArg.length / 2) * 8).toString(16).padStart(4, '0');
  const cell3LengthArg = (160 + memoArg.length + jettonAmountArg.length + forwardAmountArg.length).toString(16);

  // Cell2
  const {
    wc: fromTokenAccountWorkchain,
    hashPart: fromTokenAccountHashPart,
    isBounceable,
  } = new TonWeb.Address(fromTokenAccount);
  const amountBuffer = new BN(amount).toBuffer();

  const fromTokenAccountArg = Buffer.from(fromTokenAccountHashPart).toString('hex');
  const fromTokenAccountIsBounceableArg = isBounceable ? '01' : '00';
  const fromTokenAccountWorkchainArg = new BN(fromTokenAccountWorkchain).toString('hex');
  const amountLengthArg = amountBuffer.byteLength.toString(16);
  const amountArg = amountBuffer.toString('hex');
  const cell2LengthArg = (96 + amountArg.length).toString(16);

  // Cell1
  const seqnoArg = seqno.toString(16).padStart(8, '0');
  const expireAtArg = expireAt.toString(16).padStart(8, '0');
  const sendModeArg = sendMode.toString(16).padStart(2, '0');

  // display info
  const decimalsHex = handleHex(parseInt(decimals.toString(), 10).toString(16));
  const symbolLengthHex = handleHex(symbol.length.toString(16));
  const symbolHex = handleHex(Buffer.from(symbol).toString('hex'));
  const tokenInfoArg =
    decimalsHex +
    symbolLengthHex +
    symbolHex.padEnd(14, '0') +
    removeHex0x(Buffer.from(tokenAddress, 'base64').toString('hex'));
  const signatureArg = tokenSignature.padStart(144, '0');

  const argument =
    // Cell3
    saveBitAsByte(cell3LengthArg) +
    saveBitAsByte(jettonAmountLengthArg).slice(8, 16) +
    saveBitAsByte(jettonAmountArg).padEnd(240, '0') +
    saveBitAsByte(receiverArg) +
    saveBitAsByte(receiverWorkchainArg) +
    saveBitAsByte(responserArg) +
    saveBitAsByte(responserWorkchainArg) +
    saveBitAsByte(forwardAmountLengthArg).slice(8, 16) +
    saveBitAsByte(forwardAmountArg).padEnd(240, '0') +
    memoLength +
    saveBitAsByte(memoArg).padEnd(1024, '0') +
    // Cell2
    saveBitAsByte(cell2LengthArg) +
    saveBitAsByte(fromTokenAccountArg) +
    fromTokenAccountIsBounceableArg +
    saveBitAsByte(fromTokenAccountWorkchainArg) +
    saveBitAsByte(amountLengthArg).slice(8, 16) +
    saveBitAsByte(amountArg).padEnd(240, '0') +
    // Cell1
    seqnoArg +
    expireAtArg +
    sendModeArg +
    // Token Info
    tokenInfoArg +
    signatureArg;

  console.debug(`argument: ${argument}`);

  return getSEPath(addressIndex) + argument;
}
