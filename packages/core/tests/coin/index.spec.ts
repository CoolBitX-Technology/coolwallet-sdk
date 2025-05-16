import { CardType, Transport } from '../../src';
import { keccak_256 } from '@noble/hashes/sha3';
import { initialize, HDWallet, CURVE } from '@coolwallet/testing-library';
import { createTransport } from '@coolwallet/transport-jre-http';
import { PathType } from '../../src/config';
import { SignatureType } from '../../src/transaction';
import { Signature } from '@noble/secp256k1';
import { CanonicalSignature } from '../../src/coin/config/types';
import { ECDSACoin } from '../../src/coin';
import { ec as EC } from 'elliptic';

const secp256k1 = new EC('secp256k1');
const mnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo cool';
const secpWallet = new HDWallet(CURVE.SECP256K1);
type PromiseValue<T> = T extends Promise<infer V> ? V : never;

const getRecoveryParam = (txHash: string, canonicalSignature: CanonicalSignature, publicKey: string) => {
  const keyPair = secp256k1.keyFromPublic(publicKey, 'hex');
  const recoveryParam = secp256k1.getKeyRecoveryParam(
    Buffer.from(txHash, 'hex') as unknown as Error,
    canonicalSignature,
    keyPair.getPublic() as unknown as any,
  );
  return recoveryParam;

};

describe('Test signECDSA', () => {
  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;

  beforeAll(async () => {
    if (process.env.CARD !== 'go') throw new Error('CARD must be go');
    const cardType = CardType.Go;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    transport = (await createTransport('http://localhost:9527', cardType))!;
    secpWallet.setMnemonic(mnemonic);
    props = await initialize(transport, mnemonic);
  });

  it('should sign eth transaction hash correctly', async () => {
    //    private static final String RLP_ARGUMENT = "a3255ecfe3f6727a62d938f4c29b2f73c361b26c" // to
    //            + "00000000000000989680" // value
    //            + "00000000000000000001" // gasTipCap
    //            + "000000000000000000ff" // gasFeeCap
    //            + "00000000000000005208" // gasLimit
    //            + "000000000000002a" // nonce
    //            + CHAIN_INFO;
    const rlpEncodedRawData = `02e481fa2a0181ff82520894a3255ecfe3f6727a62d938f4c29b2f73c361b26c8398968080c0`;
    const txHash = Buffer.from(keccak_256(Buffer.from(rlpEncodedRawData, 'hex'))).toString('hex');
    const addressIndex = 0;
    const coinType = '8000003c';
    const chainId = 1;
    const ecdsa = new ECDSACoin(coinType);
    const canonicalSignature = (await ecdsa.signTxHash({
      transport,
      addressIndex,
      depth: 5,
      purpose: 44,
      pathType: PathType.BIP32,
      txHash,
      appId: props.appId,
      signatureType: SignatureType.Canonical,
      appPrivateKey: props.appPrivateKey,
      confirmCB: undefined,
      authorizedCB: undefined,
    })) as CanonicalSignature;

    // 只需比對 r、s 是否正確，v 由外面透過 publicKey 算出
    const node = secpWallet.derivePath(`m/44'/60'/0'/0/0`);
    const signature = Signature.fromCompact(canonicalSignature.r + canonicalSignature.s).normalizeS();
    const expected = Buffer.from((await node.sign(txHash)) ?? '').toString('hex');
    expect(signature.toDERHex()).toEqual(expected);

    // 外面如何計算 v值
    const publicKey = await ecdsa.getPublicKey(transport, props.appPrivateKey, props.appId, addressIndex);
    const recoveryParam = getRecoveryParam(txHash, canonicalSignature, publicKey);
    expect(recoveryParam).toEqual(1);

    const v = recoveryParam + 27 + chainId * 2 + 8;
    expect(v).toEqual(38);

    // 外面如何組出 signature
    const rBuf = Buffer.from(canonicalSignature.r.padStart(64, '0'), 'hex'); // 保證 32 bytes
    const sBuf = Buffer.from(canonicalSignature.s.padStart(64, '0'), 'hex');
    const vBuf = Buffer.from([v]);
    const signatureBuf = Buffer.concat([rBuf, sBuf, vBuf]);
    expect(signatureBuf.toString('hex')).toMatchInlineSnapshot(
      `"2a74b787394a1a5580c85f210e2f44c09eb2abe1f4e81a27c2a3dac9c4a7ad8b6dc59ed5484fce255cbc88bfb2b3eaf1db2a98c573ed800c2385b469bfbd564726"`
    );
  });
});
