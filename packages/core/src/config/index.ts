import crypto from 'crypto';
import { getPublicKey, Point } from '@noble/secp256k1';
import * as general from '../apdu/general';
import Transport from '../transport';
import { SHA256 } from '../crypto/hash';
import { SE_KEY_PARAM, PathType } from './param';

const sha512 = (key: Buffer, data: Buffer): Buffer => crypto.createHmac('sha512', key).update(data).digest();

function getCompressedPublicKey(publicKey: string) {
  let prefix;
  const c = publicKey.charAt(129);
  switch (c) {
    case '1':
    case '3':
    case '5':
    case '7':
    case '9':
    case 'B':
    case 'D':
    case 'F':
    case 'b':
    case 'd':
    case 'f':
      prefix = '03';
      break;
    case '0':
    case '2':
    case '4':
    case '6':
    case '8':
    case 'A':
    case 'C':
    case 'E':
    case 'a':
    case 'c':
    case 'e':
      prefix = '02';
      break;
    default:
      prefix = '888887';
  }

  return prefix + publicKey.substring(2, 66);
}

/**
 * Using card id to generate public key.
 *
 * @param {Transport} transport
 * @return {Promise<string>} SEPublicKey
 */
async function getSEPublicKey(transport: Transport): Promise<string> {
  const cardId = await general.getCardId(transport);
  console.debug(`cardId: ${cardId}`);
  const cardIdHash = SHA256(cardId).toString('hex');
  const parseCardIdHash = parseInt(cardIdHash.slice(0, 2), 16) & 0x7f;
  const index = parseCardIdHash.toString(16).padStart(2, '0') + cardIdHash.slice(2, 8);

  const compressedPublicKey = getCompressedPublicKey(SE_KEY_PARAM.chipMasterPublicKey);

  const addend = sha512(
    Buffer.from(SE_KEY_PARAM.chipMasterChainCode, 'hex'),
    Buffer.from(compressedPublicKey + index, 'hex')
  ).toString('hex');

  const privateKey = Buffer.from(addend.slice(0, 64), 'hex');

  const fullPublicKey = getPublicKey(privateKey, false);

  const Ki = Point.fromHex(fullPublicKey)
    .add(Point.fromHex(Buffer.from(SE_KEY_PARAM.chipMasterPublicKey, 'hex')))
    .toHex(false);

  return Ki;
}

export { getSEPublicKey, PathType };
