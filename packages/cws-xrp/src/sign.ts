import { core } from '@coolwallets/core';

type Transport = import('@coolwallets/transport').default;

const generateRawTx = (signature: any, payload:Buffer): string => {
  const newPayload = payload.slice(8).toString('hex'); // Remove Hash Prefix

  const payloadBody = newPayload.slice(84);

  if (payloadBody.slice(0, 2) !== '73') throw Error('Slicing XRP Payload Error, expect 73');
  const pubKeyLen = parseInt(payloadBody.slice(2, 4), 16) * 2;


  const payloadPre = newPayload.slice(0, 88 + pubKeyLen); // before signingPubKey
  const payloadPost = newPayload.slice(88 + pubKeyLen); // after, including [account, destination]

  if (payloadPost.length !== 88 || payloadPost.slice(0, 2) !== '81') {
    throw Error(`Slicing error: wrong cut of postfix ${payloadPost}`);
  }

  const signatureHeader = '74';
  const sigLen = signature.length / 2;
  const sigHexLen = sigLen.toString(16);

  const sigHex = signatureHeader + sigHexLen + signature;
  const fullTx = payloadPre + sigHex + payloadPost;
  return fullTx;
};


// eslint-disable-next-line import/prefer-default-export
export const signTransaction = async (
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  coinType: string,
  payload: Buffer,
  addressIndex: number,
  confirmCB: Function | undefined,
  authorizedCB: Function | undefined
): Promise<string> => {
  const keyId = core.util.addressIndexToKeyId(coinType, addressIndex);
  const dataForSE = core.flow.prepareSEData(keyId, payload, coinType);
  const signature = await core.flow.sendDataToCoolWallet(
    transport,
    appId,
    appPrivateKey,
    dataForSE,
    '00',
    '00',
    false,
    undefined,
    confirmCB,
    authorizedCB,
    false
  );

  return generateRawTx(signature, payload);
};
