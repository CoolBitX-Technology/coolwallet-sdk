import { transport, tx, apdu } from '@coolwallet/core';

type Transport = transport.default;
type protocol = import('./types').protocol

const accountIndexToKeyId = (coinType: string, accountIndex: number) => {
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
  accountIndex: number,
  protocol: protocol,
  confirmCB: Function | undefined,
  authorizedCB: Function | undefined
): Promise<{ r: string; s: string; } | Buffer> {
  const readType = protocol === 'BIP44' ? coinType : `${coinType}10`;
  const preActions = [];


  // 100 flow
  const keyId = accountIndexToKeyId(coinType, accountIndex);
  const dataForSE = tx.flow.prepareSEData(keyId, signatureBase, readType);


  const sayHi = async () => {
    await apdu.general.hi(transport, appId);
  }
  preActions.push(sayHi)

  const prepareTx = async () => {
    return apdu.tx.txPrep(transport, dataForSE, "00", appPrivateKey);
  }


  const signature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    prepareTx,
    false,
    confirmCB,
    authorizedCB,
    false,
  );


  return signature;
}
