import { ec as EC } from 'elliptic';
import RLP from 'rlp';
import createKeccakHash from 'keccak';
import { CURVE } from '../config/constants';

const secp256k1 = new EC(CURVE);

/**
 * Compose Signed Transaction
 *
 * @param {Array<Buffer>} payload
 * @param {Number} v
 * @param {String} r
 * @param {String} s
 * @param {number} chainId
 * @return {String}
 */
export const composeSignedTransaction = (
  transaction: (Buffer | Buffer[])[],
  v: number,
  r: string,
  s: string,
  prefix = '0x'
): string => {
  let vBuffer: Buffer;
  if (v !== 0) {
    vBuffer = Buffer.allocUnsafe(6);
    vBuffer.writeIntBE(v, 0, 6);
    vBuffer = Buffer.from(vBuffer.filter((e) => e !== 0));
  } else {
    vBuffer = Buffer.allocUnsafe(0);
  }
  transaction.push(vBuffer, Buffer.from(r, 'hex'), Buffer.from(s, 'hex'));

  const serializedTx = RLP.encode(transaction);
  return `${prefix}${Buffer.from(serializedTx).toString('hex')}`;
};

/**
 * Generate Canonical Signature from Der Signature
 *
 * @param {{r:string, s:string}} canonicalSignature
 * @param {Buffer} payload
 * @param {String} compressedPubkey hex string
 * @return {Promise<{v: Number, r: String, s: String}>}
 */
export const genEthSigFromSESig = async (
  canonicalSignature: { r: string; s: string },
  payload: Buffer,
  compressedPubkey?: string
): Promise<{ v: number; r: string; s: string }> => {
  const data = createKeccakHash('keccak256').update(payload).digest();
  const keyPair = secp256k1.keyFromPublic(compressedPubkey!, 'hex');

  const recoveryParam = secp256k1.getKeyRecoveryParam(
    data as unknown as Error,
    canonicalSignature,
    keyPair.getPublic() as any
  );
  const v = recoveryParam;
  const { r } = canonicalSignature;
  const { s } = canonicalSignature;

  return { v, r, s };
};
