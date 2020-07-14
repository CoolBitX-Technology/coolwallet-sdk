
import * as auth from './auth';
import * as apdu from '../apdu/index';
import { APDUError, SDKError } from '../error';
import Transport from '../transport';


export {
   auth
};

/**
 * Get detail card information.
 * @returns {Promise<{"pairStatus":boolean,"freezeStatus":boolean,"walletStatus":boolean,
 * "pairRemainTimes":Number,"accountDigest":String,"showFullAddress":boolean,
 * "isCardRecognized":boolean,"SEVersion":Number,"MCUVersion":String}>}
 */
export const getCardInfo = async (transport: Transport, appId: string) => {
   try {
      const MCUVersion = await apdu.mcu.dfu.getMCUVersion(transport)
      const SEVersion = await apdu.general.getSEVersion(transport)
      const cardInfo = await apdu.info.getCardInfo(transport);
      // const appId = await AsyncStorage.getItem("appId");
      const hiResponse = await apdu.general.hi(transport, appId);
      await apdu.mcu.control.powerOff(transport);
      const outputData  = cardInfo;
      const databuf = Buffer.from(outputData, 'hex');
      const pairIndex = databuf.slice(0, 1).toString('hex');
      const freezeIndex = databuf.slice(1, 2).toString('hex');
      const walletIndex = databuf.slice(3, 4).toString('hex');
      const accountDigest = databuf.slice(4, 9).toString('hex');
      const displayIndex = databuf.slice(9).toString('hex');

      const isCardRecognized = hiResponse;
      let getPairRemainTimes = databuf.slice(2, 3).toString('hex');
      const pairRemainTimes = parseInt(getPairRemainTimes, 16);

      let pairStatus;
      if (pairIndex === '01') {
         pairStatus = true;
      } else if (pairIndex === '00') {
         pairStatus = false;
      } else {
         throw new SDKError(getCardInfo.name, "Unsupported Pair_Status:" + pairIndex );
      }
      const freezeStatus = freezeIndex === '00' ? false : true;
      const walletStatus = walletIndex === '00' ? false : true;
      const showFullAddress = displayIndex === '00' ? true : false;
      if (accountDigest === "81c69f2d90" ||
         accountDigest === "3d84ba58bf" ||
         accountDigest === "83ccf4aab1") {
         throw new SDKError(getCardInfo.name, "Please Recover your wallet")
      }
      const message = {
         pairStatus,
         freezeStatus,
         walletStatus,
         pairRemainTimes,
         accountDigest,
         showFullAddress,
         isCardRecognized,
         SEVersion,
         MCUVersion
      };
      console.log(`CardInfo Package: ${JSON.stringify(message)}`);
      return message;
   } catch (e) {
      throw new SDKError(getCardInfo.name, "SDK Get Card Info Error. ")
   }
};
