import TonWeb from 'tonweb';
import { TransferTokenTransaction, TransferTransaction } from '../config/types';
import { getJettonWallet, getWalletV4R2, tonweb } from './tonweb';
import { Cell } from 'tonweb/dist/types/boc/cell';
import { WalletV4ContractR2 } from 'tonweb/dist/types/contract/wallet/v4/wallet-v4-contract-r2';

async function finalize(props: {
  wallet: WalletV4ContractR2;
  signature: Buffer;
  signingMessage: Cell;
  seqno: number;
}): Promise<string> {
  const { wallet, signature, signingMessage, seqno } = props;

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

export async function finalizeTransferTransaction(
  transaction: Required<TransferTransaction>,
  publicKey: string,
  signature: Buffer
): Promise<string> {
  const { toAddress, amount, seqno, expireAt, payload, sendMode } = transaction;

  const wallet = getWalletV4R2(publicKey);

  const signingMessage = (wallet as any).createSigningMessage(seqno, expireAt) as Cell;
  signingMessage.bits.writeUint8(sendMode);
  signingMessage.refs.push((TonWeb.Contract as any).createOutMsg(toAddress, amount, payload));

  return await finalize({ wallet, signature, signingMessage, seqno });
}

export async function finalizeTransferTokenTransaction(
  transaction: Required<TransferTokenTransaction>,
  publicKey: string,
  signature: Buffer
): Promise<string> {
  const { toAddress: fromTokenAccount, amount, seqno, expireAt, payload, sendMode, tokenInfo } = transaction;
  const { jettonAmount, toAddress: receiver, forwardAmount, forwardPayload, responseAddress } = payload;

  const wallet = getWalletV4R2(publicKey);
  const jettonWallet = await getJettonWallet(fromTokenAccount);

  const tokenTransferBody = await jettonWallet.createTransferBody({
    jettonAmount,
    toAddress: new TonWeb.utils.Address(receiver),
    forwardAmount,
    forwardPayload: new Uint8Array([...new Uint8Array(4), ...new TextEncoder().encode(forwardPayload || '')]),
    responseAddress: new TonWeb.utils.Address(responseAddress),
  } as any);

  const signingMessage = (wallet as any).createSigningMessage(seqno, expireAt) as Cell;
  signingMessage.bits.writeUint8(sendMode);
  signingMessage.refs.push((TonWeb.Contract as any).createOutMsg(fromTokenAccount, amount, tokenTransferBody));

  return await finalize({ wallet, signature, signingMessage, seqno });
}
