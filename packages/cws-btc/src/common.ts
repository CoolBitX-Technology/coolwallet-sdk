import { core, apdu } from '@coolwallets/core';

/**
 * Set change address's path to CoolWalletS.
 */
export const setChangeKeyid = async (
  transport:any,
  appId:string,
  appPrivateKey:string,
  coinType:string,
  changeAddressIndex:number,
  redeemType:string) => {
  const changeKeyId = core.util.addressIndexToKeyId(coinType, changeAddressIndex);
  const signature = await core.auth.generalAuthorization(
    transport,
    appId,
    appPrivateKey,
    'SET_CHANGE_KEYID',
    changeKeyId,
    redeemType
  );
  const keyData = changeKeyId + signature;
  await apdu.tx.setChangeKeyId(transport, keyData, redeemType);


  return true;
};
