import TonWeb from 'tonweb';
import { TransferTxType } from '../config/types';
import { getWalletV4R2, tonweb } from './tonweb';
import { Cell } from 'tonweb/dist/types/boc/cell';

export function getPrepTransaction(transaction: TransferTxType): TransferTxType {
  let { expireAt } = transaction;

  expireAt = expireAt || Math.floor(Date.now() / 1e3) + 60;

  return { ...transaction, expireAt };
}

export async function composeFinalTransaction(
  transaction: TransferTxType,
  publicKey: string,
  signature: Buffer
): Promise<string> {
  const { receiver, amount, seqno, expireAt, payload } = transaction;

  const wallet = getWalletV4R2(publicKey);

  const sendMode = 3;

  const signingMessage = (wallet as any).createSigningMessage(seqno, expireAt) as Cell;
  signingMessage.bits.writeUint8(sendMode);
  signingMessage.refs.push((TonWeb.Contract as any).createOutMsg(receiver, amount, payload, null));

  const body = new tonweb.boc.Cell();
  body.bits.writeBytes(signature);
  body.writeCell(signingMessage);

  let stateInit;

  if (seqno === 0) {
    const deploy = await wallet.createStateInit();
    stateInit = deploy.stateInit;
  }

  const selfAddress = await wallet.getAddress();
  const header = TonWeb.Contract.createExternalMessageHeader(selfAddress);
  const resultMessage = TonWeb.Contract.createCommonMsgInfo(header, stateInit, body);

  const boc = tonweb.utils.bytesToBase64(await resultMessage.toBoc(false));
  return boc;
}
