import { core } from '@coolwallets/core';

const codec = require('ripple-binary-codec');

type Transport = import('@coolwallets/transport').default;
type Payment = import('./types').Payment

const generateRawTx = (signature: any, payment:Payment): string => {
  /* eslint-disable-next-line no-param-reassign */
  payment.TxnSignature = signature.toUpperCase();
  return codec.encodeForSigning(payment);
};

// eslint-disable-next-line import/prefer-default-export
export const signPayment = async (
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  coinType: string,
  payment: Payment,
  addressIndex: number,
  confirmCB: Function | undefined,
  authorizedCB: Function | undefined
): Promise<string> => {
  const keyId = core.util.addressIndexToKeyId(coinType, addressIndex);
  // eslint-disable-next-line no-param-reassign
  payment.SigningPubKey = payment.SigningPubKey.toUpperCase();
  const payload = Buffer.from(codec.encodeForSigning(payment), 'hex');
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

  return generateRawTx(signature, payment);
};
