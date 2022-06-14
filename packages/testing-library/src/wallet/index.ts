import * as secp256k1 from '@noble/secp256k1';
import * as ed25519 from '@noble/ed25519';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { hmac } from '@noble/hashes/hmac';
import { sha512 } from '@noble/hashes/sha512';
import { bytesToBigInt, mod, numTo32bStr } from './utils';

const HIGHEST_BIT = 0x80000000;
const PUBLIC_KEY_SIZE = 33;
const PRIVATE_KEY_SIZE = 32;

enum CURVE {
  SECP256K1 = 'Bitcoin seed',
  ED25519 = 'ed25519 seed',
}

class Node {
  public privateKey: Buffer;
  public chainCode: Buffer;
  private curve: CURVE;

  constructor(privateKey: Buffer, chainCode: Buffer, curve: CURVE) {
    this.privateKey = privateKey;
    this.chainCode = chainCode;
    this.curve = curve;
  }

  getPrivateKeyHex() {
    return this.privateKey.toString('hex').padStart(PRIVATE_KEY_SIZE * 2, '0');
  }

  getPublicKeyHex() {
    return this.getPublicKey().then((key) => key?.toString('hex').padStart(PUBLIC_KEY_SIZE * 2, '0'));
  }

  async getPublicKey() {
    if (this.curve === CURVE.SECP256K1) return Buffer.from(secp256k1.getPublicKey(this.privateKey, true));
    else if (this.curve === CURVE.ED25519) {
      const publicKey = await ed25519.getPublicKey(this.privateKey);
      return Buffer.from(publicKey);
    }
  }

  async sign(message: string | Buffer) {
    if (this.curve === CURVE.SECP256K1) {
      return secp256k1.sign(message, this.privateKey, {
        canonical: true,
      });
    } else if (this.curve === CURVE.ED25519) {
      return ed25519.sign(message, this.privateKey);
    }
  }
}

class HDWallet {
  public masterNode?: Node;
  private seed?: Buffer;
  private curve: CURVE;

  constructor(curve: CURVE) {
    this.curve = curve;
  }

  setMnemonic(mnemonic: string, iter = 2048, length = 64) {
    const mnemonicBuffer = Buffer.from(mnemonic, 'utf-8');
    const seed = Buffer.from(pbkdf2(sha512, mnemonicBuffer, 'mnemonic', { c: iter, dkLen: length }));
    this.seed = seed;
    this.setSeed(seed);
  }

  setSeed(seed: Buffer) {
    this.seed = seed;
    const I = hmac(sha512, Buffer.from(this.curve, 'utf-8'), seed);
    const IL = Buffer.from(I.slice(0, 32));
    const IR = Buffer.from(I.slice(32));
    this.masterNode = new Node(IL, IR, this.curve);
  }

  derive(index: number, isHardened: boolean, node: Node): Node {
    if (this.curve === CURVE.ED25519 && !isHardened) {
      // If curve is ed25519: return failure.
      throw new Error('ed25519 cannot have non hardened path');
    }
    const data = Buffer.allocUnsafe(37);

    if (isHardened) {
      // Data = 0x00 || ser256(kpar) || ser32(i)
      data[0] = 0x00;
      node.privateKey.copy(data, 1);
      data.writeUInt32BE(HIGHEST_BIT + index, 33);
    } else {
      // Data = serP(point(kpar)) || ser32(i)
      const publicKey = Buffer.from(secp256k1.getPublicKey(node.privateKey, true));
      publicKey.copy(data, 0);
      data.writeUInt32BE(index, 33);
    }

    // HMAC-SHA512(Key = cpar, Data = Data)
    const I = hmac(sha512, node.chainCode, data);
    const IL = Buffer.from(I.slice(0, 32));
    const IR = Buffer.from(I.slice(32));
    // If curve is ed25519: The returned child key ki is parse256(IL).
    if (this.curve === CURVE.ED25519) return new Node(IL, IR, this.curve);
    // If parse256(IL) ≥ n or parse256(IL) + kpar (mod n) = 0 (resulting key is invalid)
    if (!secp256k1.utils.isValidPrivateKey(IL)) return this.derive(index + 1, isHardened, node);

    // ki is parse256(IL) + kpar (mod n).
    const ki = numTo32bStr(mod(bytesToBigInt(node.privateKey) + bytesToBigInt(IL), secp256k1.CURVE.n));

    return new Node(Buffer.from(ki, 'hex'), IR, this.curve);
  }

  derivePath(path: string): Node {
    let splitPath = path.split('/');
    if (splitPath[0] === 'm') {
      splitPath = splitPath.slice(1);
    }

    return splitPath.reduce((prevHd, indexStr) => {
      const isHardened = indexStr.slice(-1) === `'`;
      const index = isHardened ? parseInt(indexStr.slice(0, -1), 10) : parseInt(indexStr, 10);
      return this.derive(index, isHardened, prevHd);
    }, this.masterNode!);
  }

  deriveCurve25519PublicKey() {
    if (this.seed) {
      return ed25519.curve25519.scalarMultBase(this.seed.slice(0, 32));
    }
    return null;
  }
}
export { CURVE };
export default HDWallet;
