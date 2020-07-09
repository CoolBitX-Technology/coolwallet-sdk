import * as apdu from '../apdu/index';
import { SDKError, APDUError } from '../error/errorHandle';
import Transport from '../transport/index';

/**
 * Get Baisc information of CoolWallet
 * @param {Tranpsort} transport
 * @return {Promise<{ paired:boolean, locked:boolean, walletCreated:boolean, showDetail:boolean, pairRemainTimes:number }>}
 */
export const getCardInfo = async (transport: Transport): Promise<{ paired: boolean; locked: boolean; walletCreated: boolean; showDetail: boolean; pairRemainTimes: number; }> => {
  const outputData = await apdu.info.getCardInfo(transport);
  const databuf = Buffer.from(outputData, 'hex');
  const pairStatus = databuf.slice(0, 1).toString('hex');
  const lockedStatus = databuf.slice(1, 2).toString('hex');
  const pairRemainTimes = parseInt(databuf.slice(2, 3).toString('hex'), 16);
  const walletStatus = databuf.slice(3, 4).toString('hex');
  const accountDigest = databuf.slice(4, 9).toString('hex');
  const displayType = databuf.slice(9).toString('hex');

  if (accountDigest === '81c69f2d90' || accountDigest === '3d84ba58bf' || accountDigest === '83ccf4aab1') {
    throw new SDKError(getCardInfo.name, 'Bad Firmware statusCode. Please reset your CoolWalletS.');
  }

  const paired = pairStatus === '01';
  const locked = lockedStatus === '01';
  const walletCreated = walletStatus === '01';
  const showDetail = displayType === '00';

  return {
    paired,
    locked,
    walletCreated,
    showDetail,
    pairRemainTimes,
  };
};
