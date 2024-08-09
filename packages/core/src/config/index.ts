import crypto from 'crypto';
import Transport, { CardType } from '../transport';
import { SHA256 } from '../crypto/hash';
import { SE_KEY_PARAM, PathType } from './param';
import { ec as EC } from 'elliptic';
import { info } from '..';
import { SDKError } from '../error';

const secp256k1 = new EC('secp256k1');

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

function hexToAscii(hex: string) {
  let asciiStr = '';

  for (let i = 0; i < hex.length; i += 2) {
    const hexPair = hex.substr(i, 2);
    const decimal = parseInt(hexPair, 16);
    asciiStr += String.fromCharCode(decimal);
  }

  return asciiStr;
}

/**
 * Using card id to generate public key.
 *
 * @param {Transport} transport
 * @return {Promise<string>} SEPublicKey
 */
async function getSEPublicKey(transport: Transport): Promise<string> {
  const cardId = await info.getCardId(transport);
  console.debug('cardId: ' + hexToAscii(cardId));
  const cardIdHash = SHA256(cardId).toString('hex');
  const parseCardIdHash = parseInt(cardIdHash.slice(0, 2), 16) & 0x7f;
  const index = parseCardIdHash.toString(16).padStart(2, '0') + cardIdHash.slice(2, 8);
  const seVersion = await info.getSEVersion(transport);
  console.debug('SE version: ' + seVersion);
  let masterPublicKey;
  let masterChainCode;
  if (transport.cardType === CardType.Pro) {
    if (seVersion < 338) {
      masterPublicKey = SE_KEY_PARAM.Pro.chipMasterPublicKey;
      masterChainCode = SE_KEY_PARAM.Pro.chipMasterChainCode;
    } else {
      masterPublicKey = SE_KEY_PARAM.Pro.chipTransMasterPublicKey;
      masterChainCode = SE_KEY_PARAM.Pro.chipTransMasterChainCode;
    }
  } else if (transport.cardType === CardType.Lite) {
    masterPublicKey = SE_KEY_PARAM.Lite.chipMasterPublicKey;
    masterChainCode = SE_KEY_PARAM.Lite.chipMasterChainCode;
  } else {
    throw new SDKError('getSEPublicKey', 'unknown card type: ' + transport.cardType);
  }

  const compressedPublicKey = getCompressedPublicKey(masterPublicKey);

  const addend = sha512(Buffer.from(masterChainCode, 'hex'), Buffer.from(compressedPublicKey + index, 'hex')).toString(
    'hex'
  );
  const privateKey = Buffer.from(addend.slice(0, 64), 'hex');

  const keyPair = secp256k1.keyFromPrivate(privateKey);
  const publicKey = keyPair.getPublic();
  const chipMasterPublicKey = secp256k1.keyFromPublic(Buffer.from(masterPublicKey, 'hex')).getPublic();

  const Ki = publicKey.add(chipMasterPublicKey);

  return Ki.encode('hex', false);
}

export { getSEPublicKey, PathType };
