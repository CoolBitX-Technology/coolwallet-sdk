import { core, apdu, tx } from '@coolwallet/core';

/**
 * Set change address's path to CoolWallet.
 */
export const setChangeKeyid = async (
  transport: any,
  appId: string,
  appPrivateKey: string,
  coinType: string,
  changeAddressIndex: number,
  redeemType: string) => {
  const changeKeyId = core.util.addressIndexToKeyId(coinType, changeAddressIndex);
  const sig = await core.auth.getCommandSignature(
    transport,
    appId,
    appPrivateKey,
    'SET_CHANGE_KEYID',
    changeKeyId,
    redeemType
  );
  const keyData = changeKeyId + sig.signature;
  await tx.setChangeKeyId(transport, keyData, redeemType);


  return true;
};
