import { core, transport } from '@coolwallet/core';

type Transport = transport.default;
type protocol = import('./types').protocol

const accountIndexToKeyId = (coinType:string, accountIndex:number) => {
  const accountIndexHex = accountIndex.toString(16).padStart(2, '0');
  const keyId = coinType.concat(accountIndexHex).concat('000000');
  return keyId;
};

export default async function signTransaction(
  transport: Transport,
  appPrivateKey: string,
  appId: string,
  coinType: string,
  signatureBase: Buffer,
  accountIndex:number,
  protocol: protocol,
  confirmCB: Function | undefined,
  authorizedCB: Function | undefined

): Promise<{ r: string; s: string; } | Buffer> {
  const readType = protocol === 'BIP44'
    ? coinType
    : `${coinType}10`;
  const keyId = accountIndexToKeyId(coinType, accountIndex);
  const dataForSE = core.flow.prepareSEData(keyId, signatureBase, readType);
  const signature = await core.flow.getSingleSignatureFromCoolWallet(
    transport,
    appId,
    appPrivateKey,
    dataForSE,
    '00',
    true,
    undefined,
    confirmCB,
    authorizedCB,
    false,
  );
  

  return signature;
}
