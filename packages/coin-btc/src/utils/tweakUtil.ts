import { sha256 } from './cryptoUtil';
import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';

const TAGS = [
  'BIP0340/challenge',
  'BIP0340/aux',
  'BIP0340/nonce',
  'TapLeaf',
  'TapBranch',
  'TapSighash',
  'TapTweak',
  'KeyAgg list',
  'KeyAgg coefficient',
] as const;
type TaggedHashPrefix = typeof TAGS[number];
type TaggedHashPrefixes = {
  [key in TaggedHashPrefix]: Buffer;
};

function taggedHash(prefix: TaggedHashPrefix, data: Buffer) {
  const TAGGED_HASH_PREFIXES: TaggedHashPrefixes = {
    'BIP0340/challenge': Buffer.from([
      123, 181, 45, 122, 159, 239, 88, 50, 62, 177, 191, 122, 64, 125, 179, 130, 210, 243, 242, 216, 27, 177, 34, 79,
      73, 254, 81, 143, 109, 72, 211, 124, 123, 181, 45, 122, 159, 239, 88, 50, 62, 177, 191, 122, 64, 125, 179, 130,
      210, 243, 242, 216, 27, 177, 34, 79, 73, 254, 81, 143, 109, 72, 211, 124,
    ]),
    'BIP0340/aux': Buffer.from([
      241, 239, 78, 94, 192, 99, 202, 218, 109, 148, 202, 250, 157, 152, 126, 160, 105, 38, 88, 57, 236, 193, 31, 151,
      45, 119, 165, 46, 216, 193, 204, 144, 241, 239, 78, 94, 192, 99, 202, 218, 109, 148, 202, 250, 157, 152, 126, 160,
      105, 38, 88, 57, 236, 193, 31, 151, 45, 119, 165, 46, 216, 193, 204, 144,
    ]),
    'BIP0340/nonce': Buffer.from([
      7, 73, 119, 52, 167, 155, 203, 53, 91, 155, 140, 125, 3, 79, 18, 28, 244, 52, 215, 62, 247, 45, 218, 25, 135, 0,
      97, 251, 82, 191, 235, 47, 7, 73, 119, 52, 167, 155, 203, 53, 91, 155, 140, 125, 3, 79, 18, 28, 244, 52, 215, 62,
      247, 45, 218, 25, 135, 0, 97, 251, 82, 191, 235, 47,
    ]),
    TapLeaf: Buffer.from([
      174, 234, 143, 220, 66, 8, 152, 49, 5, 115, 75, 88, 8, 29, 30, 38, 56, 211, 95, 28, 181, 64, 8, 212, 211, 87, 202,
      3, 190, 120, 233, 238, 174, 234, 143, 220, 66, 8, 152, 49, 5, 115, 75, 88, 8, 29, 30, 38, 56, 211, 95, 28, 181,
      64, 8, 212, 211, 87, 202, 3, 190, 120, 233, 238,
    ]),
    TapBranch: Buffer.from([
      25, 65, 161, 242, 229, 110, 185, 95, 162, 169, 241, 148, 190, 92, 1, 247, 33, 111, 51, 237, 130, 176, 145, 70, 52,
      144, 208, 91, 245, 22, 160, 21, 25, 65, 161, 242, 229, 110, 185, 95, 162, 169, 241, 148, 190, 92, 1, 247, 33, 111,
      51, 237, 130, 176, 145, 70, 52, 144, 208, 91, 245, 22, 160, 21,
    ]),
    TapSighash: Buffer.from([
      244, 10, 72, 223, 75, 42, 112, 200, 180, 146, 75, 242, 101, 70, 97, 237, 61, 149, 253, 102, 163, 19, 235, 135, 35,
      117, 151, 198, 40, 228, 160, 49, 244, 10, 72, 223, 75, 42, 112, 200, 180, 146, 75, 242, 101, 70, 97, 237, 61, 149,
      253, 102, 163, 19, 235, 135, 35, 117, 151, 198, 40, 228, 160, 49,
    ]),
    TapTweak: Buffer.from([
      232, 15, 225, 99, 156, 156, 160, 80, 227, 175, 27, 57, 193, 67, 198, 62, 66, 156, 188, 235, 21, 217, 64, 251, 181,
      197, 161, 244, 175, 87, 197, 233, 232, 15, 225, 99, 156, 156, 160, 80, 227, 175, 27, 57, 193, 67, 198, 62, 66,
      156, 188, 235, 21, 217, 64, 251, 181, 197, 161, 244, 175, 87, 197, 233,
    ]),
    'KeyAgg list': Buffer.from([
      72, 28, 151, 28, 60, 11, 70, 215, 240, 178, 117, 174, 89, 141, 78, 44, 126, 215, 49, 156, 89, 74, 92, 110, 199,
      158, 160, 212, 153, 2, 148, 240, 72, 28, 151, 28, 60, 11, 70, 215, 240, 178, 117, 174, 89, 141, 78, 44, 126, 215,
      49, 156, 89, 74, 92, 110, 199, 158, 160, 212, 153, 2, 148, 240,
    ]),
    'KeyAgg coefficient': Buffer.from([
      191, 201, 4, 3, 77, 28, 136, 232, 200, 14, 34, 229, 61, 36, 86, 109, 100, 130, 78, 214, 66, 114, 129, 192, 145, 0,
      249, 77, 205, 82, 201, 129, 191, 201, 4, 3, 77, 28, 136, 232, 200, 14, 34, 229, 61, 36, 86, 109, 100, 130, 78,
      214, 66, 114, 129, 192, 145, 0, 249, 77, 205, 82, 201, 129,
    ]),
  };
  return sha256(Buffer.concat([TAGGED_HASH_PREFIXES[prefix], data]));
}
function tapTweakHash(pubKey: Buffer, h: Buffer | null) {
  return taggedHash('TapTweak', Buffer.concat(h ? [pubKey, h] : [pubKey]));
}

function tweakKey(pubKey: Buffer, h: Buffer | null) {
  //   if (!Buffer.isBuffer(pubKey)) return null;
  if (pubKey.length !== 32) return null;
  if (h && h.length !== 32) return null;
  const tweakHash = tapTweakHash(pubKey, h);
  const res = ecc.xOnlyPointAddTweak(pubKey, tweakHash);
  if (!res || res.xOnlyPubkey === null) return null;
  return {
    parity: res.parity,
    x: Buffer.from(res.xOnlyPubkey),
  };
}

export function tweak(publicKey: string): string {
  const childNodeXOnlyPubkey = Buffer.from(publicKey, 'hex').subarray(1, 33);
  const tweakPublicKey = tweakKey(childNodeXOnlyPubkey, null);
  return tweakPublicKey?.x.toString('hex') as string;
}
