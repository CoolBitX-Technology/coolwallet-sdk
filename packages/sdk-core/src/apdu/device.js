import { executeCommand } from './execute'
import { RESPONSE } from '../config/response'

/**
 * Pair current device with CWS card
 * @param {string} data 
 * @param {string} P1 
 * @return {Promise<string>} appId
 */
export const registerDevice = async (transport, data, P1) => {
  const { outputData:appId }  = await executeCommand(transport, 'REGISTER', 'SE', data, P1)
  return appId
};

/**
 * Reset CoolWalletS (clear all data)
 * @param {Transport} transport 
 * @return {Promise<boolean>}
 */
export const resetCard = async (transport) => {
  await executeCommand(transport, 'RESET_PAIR', 'SE')
  return true
};

/**
 * Response boolean (isCardRecognized)
 * @param {Transport} transport 
 * @param {string} data 
 * @return {Promise<boolean>} isCardRecognized
 */
export const sayHi = (transport, data,) => {
  try {
    const { status } = await executeCommand(transport, 'SAY_HI', 'SE', data)
    return status === RESPONSE.SUCCESS
  } catch (error){
    return false
  }
};

/**
 * Get nonce from CWS
 * @param {Transport} transport 
 * @return {Promise<string>}
 */
export const getNonce = (transport) => {
  const { outputData: nonce } = await executeCommand(transport, 'GET_NONCE', 'SE')
  return nonce
};

/**
 * Get basic card information 
 * @param {Transport} transport 
 */
export const getCardInfo = (transport) => {
  const { outputData } = await executeCommand(transport, 'GET_CARD_INFO', 'SE')
  const databuf = Buffer.from(outputData, 'hex');
  const pairIndex = databuf.slice(0, 1).toString('hex');
  const freezeIndex = databuf.slice(1, 2).toString('hex');
  const pairRemainTimes = parseInt(databuf.slice(2, 3).toString('hex'), 16);
  const walletIndex = databuf.slice(3, 4).toString('hex');
  const accountDigest = databuf.slice(4, 9).toString('hex');
  const displayIndex = databuf.slice(9).toString('hex');

  const pairStatus = pairIndex === '01';
  const freezeStatus = freezeIndex === '00' ? false : true;
  const walletStatus = walletIndex === '00' ? false : true;
  const showFullAddress = displayIndex === '00' ? true : false;
  
  if (accountDigest === "81c69f2d90" || accountDigest === "3d84ba58bf" || accountDigest === "83ccf4aab1" ) {
    throw Error('Please Recover your CoolWalletS!')
  }
  return {
    pairStatus, freezeStatus, walletStatus, showFullAddress, pairRemainTimes
  }
  
};

/**
 * Display "UPDATE" on wallet display
 * @param {Transport} transport
 * @return {Promise<boolean>}
 */
export const startUpdate = (transport) => {
  await executeCommand(transport, 'START_UPDATE', 'SE')
  return true
};

/**
 * Hide "UPDATE" on card
 * @param {Transport}
 * @return {Promise<boolean>}
 */
export const finishUpdate = (transport) => {
  await executeCommand(transport, 'FINISH_UPDATE', 'SE')
  return true
};

/**
 * Power off SE
 * @param {Transport} 
 * @return {Promise<boolean>}
 */
export const powerOff = (transport) => {
  await executeCommand(transport, 'PWR_OFF', 'SE')
  return true
};

/**
 * Upate balances shown on card display
 * @param {Transport} transport 
 * @param {string} data 
 * @return {Promise<boolean>}
 */
export const updateBalance = (transport, data) => {
  await executeCommand(transport, 'UPDATE_BALANCE', 'SE', data)
  return true
};

/**
 * get ENCRYPTED pairing password
 * @param {Transport} transport 
 * @param {string} data 
 * @return {Promise<string>}
 */
export const getPairPassword = (transport, data) => {
  const { outputData } =  await executeCommand(transport, 'GET_PAIR_PWD', 'SE', data)
  return outputData
};

/**
 * Update last used keyId to store in CWS.
 * @param {Transport} transport 
 * @param {string} data 
 * @param {string} P1 
 * @return {Promise<boolean>}
 */
export const updateKeyId = (transport, data, P1) => {
  await executeCommand(transport, 'UPDATE_KEYID', 'SE', data, P1)
  return true
};

/**
 * Fetch last used keyId from CWS
 * @param {Transport} transport 
 * @param {string} P1 
 */
export const getLastKeyId = (transport, P1) => {
  const { outputData } = await executeCommand(transport, 'GET_KEYID', 'SE', null, P1)
  return outputData
};

/**
 * Toggle Lock card (01 to lock, 00 to unluch)
 * @param {string} transport 
 * @param {string} signature data
 * @param {string} lock 01 to lock your card 
 * @return {Promise<string>}
 */
export const switchLockStatus = (transport, signature, lock) => {
  await executeCommand(transport, 'CHANGE_PAIR_STATUS', 'SE', signature, lock)
  return true
};

/**
 * Get list of paired devices
 * @param {Transport} transport 
 * @param {string} signature 
 * @return {Promise<Array<{appId:string, deviceName: string}>>}
 */
export const getPairedDevices = (transport, signature) => {
  const { outputData } = await executeCommand(transport, 'GET_PAIRED_DEVICES', 'SE', signature)
  const devices = outputData.match(/.{100}/g);
  const allDevices = devices.map(device => {
    const appId = device.slice(0, 40);
    const utfDevicename = device.slice(40);
    const toBuf = Buffer.from(utfDevicename, 'hex');
    const deviceName = toBuf.toString().replace(/\u0000/gi, '');
    return { appId, deviceName };
  });
  return allDevices;
};

/**
 * Remove Paired device by id
 * @param {Transport} transport 
 * @param {string} appIdWithSig 
 * @return {Promise<boolean>}
 */
export const removePairedDevice = (transport, appIdWithSig) => {
  await executeCommand(transport, 'REMOVE_DEVICES', 'SE', appIdWithSig)
  return true
};

/**
 * Rename current device
 * @param {Transport} transport 
 * @param {string} nameWithSig 
 * @return {Promise<boolean>}
 */
export const renameDevice = (transport, nameWithSig) => {
  await executeCommand(transport, 'RENAME_DEVICES', 'SE', nameWithSig)
  return true
};


/**
 * 
 * @param {Transport} transport 
 * @param {string} signature 
 * @param {string} detailFlag 00 if want to show detail, 01 otherwise
 * @return {Promise<boolean>}
 */
export const toggleDisplayAddress = (transport, signature, detailFlag) => {
  await executeCommand(transport, 'SHOW_FULL_ADDRESS', 'SE', signature, detailFlag)
  return true
};

/**
 * Get SE Version from CoolWalletS
 * @param {Transport} transport
 * @return {Prmose<number>}
 */
export const getSEVersion = (transport) => {
  const { outputData } = await executeCommand(transport, 'GET_SE_VERSION', 'SE')
  return parseInt(outputData, 16)
};

/**
 * Cancel last APDU
 * @param {Transport} transport 
 */
export const cancelAPDU = (transport) => {
  await executeCommand(transport, 'CANCEL_APDU', 'SE')
};

/**
 * backup seed in SE.
 * @param {Transport} transport 
 * @param {string} signedCommand 
 * @return {Promise<boolean>}
 */
export const backupRegisterData = (transport, signedCommand) => {
  const { status }= await executeCommand(transport, 'BACKUP_REGISTER_DATA', 'SE', signedCommand)
  return status === RESPONSE.SUCCESS
};

/**
 * Recover wallet automatically with backed up seed.
 * @param {Transport} transport 
 * @return {Promise<boolean>}
 */
export const recoverWithBackedUpData = (transport) => {
  await executeCommand(transport, 'RECOVER_REGISER_DATA', 'SE')
  return true;
};

/**
 * check if there's backed up data in SE.
 * @param {Transport} transport 
 * @return {Promise<boolean>} true: may need recovery after update.
 */
export const checkBackuptatus = (transport) => {
  const {outputData} = await executeCommand(transport, 'CHECK_BACKUP_RECOVER', 'SE')
  return outputData === '01'
};

/**
 * Delete backed up seed in SE.
 * @param {Transport} trasnport 
 * @param {string} signedCommand 
 * @return {Promise<boolean>}
 */
export const deleteSeedBackup = (transport, signedCommand) => {
  const { status } = await executeCommand(transport, 'DELETE_REGISTER_BACKUP', 'SE', signedCommand)
  return status === RESPONSE.SUCCESS ;
};
