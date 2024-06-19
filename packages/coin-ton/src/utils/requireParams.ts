import TonWeb from 'tonweb';
import { TokenInfo, TransferTokenTransaction, TransferTransaction } from '../config/types';
import { TOKENS, Token } from '../config/tokenInfos';

function requireExpireAt(expireAt?: number): number {
  return expireAt || Math.floor(Date.now() / 1e3) + 60;
}
function requireMemo(memo?: string): string {
  return memo || '';
}
function requireSendMode(sendMode?: number): number {
  return sendMode === undefined ? 3 : sendMode;
}

export function requireTransferTransaction(transaction: TransferTransaction): Required<TransferTransaction> {
  const { expireAt, payload, sendMode } = transaction;

  return {
    ...transaction,
    expireAt: requireExpireAt(expireAt),
    payload: requireMemo(payload),
    sendMode: requireSendMode(sendMode),
  };
}

function findOfficialToken(address: string): Token | undefined {
  return Object.values(TOKENS).find(
    (official) =>
      Buffer.from(new TonWeb.Address(official.contractAddress).hashPart).toString('hex') ===
      Buffer.from(new TonWeb.Address(address).hashPart).toString('hex')
  );
}

function tryUsingOfficialToken(inputToken: TokenInfo): TokenInfo {
  const officialToken = findOfficialToken(inputToken.address);

  if (officialToken) {
    return {
      symbol: officialToken.symbol,
      decimals: officialToken.unit,
      address: officialToken.contractAddress,
      signature: officialToken.signature,
    };
  }

  return inputToken;
}

export function requireTransferTokenTransaction(
  transaction: TransferTokenTransaction
): Required<TransferTokenTransaction> {
  const { expireAt, sendMode, tokenInfo } = transaction;

  return {
    ...transaction,
    expireAt: requireExpireAt(expireAt),
    sendMode: requireSendMode(sendMode),
    tokenInfo: tryUsingOfficialToken(tokenInfo),
  };
}
