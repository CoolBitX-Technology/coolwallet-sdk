import { apdu } from '@coolwallets/core'

/**
 * Get Baisc information of CoolWalletS
 * @param {Tranpsort} transport 
 * @return {Promise<{}>}
 */
export const getCardInfo = async(transport) => {
  const outputData = await apdu.setting.getCardInfo(transport);
  const databuf = Buffer.from(outputData, 'hex')
  const pairIndex = databuf.slice(0, 1).toString('hex')
  const freezeIndex = databuf.slice(1, 2).toString('hex')
  const pairRemainTimes = parseInt(databuf.slice(2, 3).toString('hex'), 16)
  const walletIndex = databuf.slice(3, 4).toString('hex')
  const accountDigest = databuf.slice(4, 9).toString('hex')
  const displayIndex = databuf.slice(9).toString('hex')

  const pairStatus = pairIndex === '01'
  const freezeStatus = freezeIndex === '00' ? false : true
  const walletStatus = walletIndex === '00' ? false : true
  const showFullAddress = displayIndex === '00' ? true : false

  if (accountDigest === '81c69f2d90' || accountDigest === '3d84ba58bf' || accountDigest === '83ccf4aab1') {
    throw Error('Please Recover your CoolWalletS!')
  }
  return {
    pairStatus,
    freezeStatus,
    walletStatus,
    showFullAddress,
    pairRemainTimes,
  }
}