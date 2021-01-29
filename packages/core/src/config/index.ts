
import * as general from '../apdu/general';
import Transport from '../transport';
import { SHA256 } from '../crypto/hash';
import { SE_KEY_PARAM } from './param';
const crypto = require('crypto')
const secp256k1 = require('secp256k1')


const sha512 = (key: Buffer, data: Buffer): Buffer => crypto
  .createHmac('sha512', key)
  .update(data)
  .digest();


/**
 * @param {Transport} transport
 * @return {Promise<string>}
 */
export async function getSEPublicKey(transport: Transport): Promise<string> {
  const cardId = await general.getCardId(transport);
  console.log("cardId: " + cardId)
  const cardIdHash = SHA256(cardId).toString('hex');
  const parseCardIdHash = parseInt((cardIdHash.slice(0, 2)), 16) & 0x7f
  const index = parseCardIdHash.toString(16) + cardIdHash.slice(2, 8)

  const compressedPublicKey = getCompressedPublicKey(SE_KEY_PARAM.chipMasterPublicKey)
  const addend = sha512(Buffer.from(SE_KEY_PARAM.chipMasterChainCode, 'hex'), Buffer.from(compressedPublicKey + index, 'hex')).toString('hex')
  const privateKey = Buffer.from(addend.slice(0, 64), 'hex')

  const fullPubilcKey = secp256k1.publicKeyCreate(privateKey, false)
  const Ki = secp256k1.publicKeyCombine([secp256k1.publicKeyConvert(Buffer.from(fullPubilcKey, 'hex')), secp256k1.publicKeyConvert(Buffer.from(SE_KEY_PARAM.chipMasterPublicKey, 'hex'))], false);

  const SEPublicKey = Buffer.from(Ki).toString('hex')
  return SEPublicKey;
};


function getCompressedPublicKey(publicKey: string) {
  let prefix = "04";
  const c = publicKey.charAt(129);
  if (c == '1' || c == '3' || c == '5' || c == '7' || c == '9' || c == 'B' || c == 'D' || c == 'F' || c == 'b' || c == 'd' || c == 'f') {
    prefix = "03";
  } else if (c == '0' || c == '2' || c == '4' || c == '6' || c == '8' || c == 'A' || c == 'C' || c == 'E' || c == 'a' || c == 'c' || c == 'e') {
    prefix = "02";
  } else {
    prefix = "888887"
  }
  return prefix + publicKey.substring(2, 66);
}
