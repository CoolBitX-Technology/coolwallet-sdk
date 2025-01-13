import { AddressVersion, ScriptType } from '../../config/types';
import {
  addressToOutScript,
  decodeAddress,
  getAddressByPublicKeyOrScriptHash,
  getPubkeyOrScriptHash,
  pubkeyOrScriptHashToPayment,
  toXOnly,
} from '../address';

describe('Test KAS SDK', () => {
  it('Test getAddressByPublicKey with version 0', async () => {
    const publicKey = '03da8eaa97bf4457368188c78e92661fdf2d96ce166b225d0dc6c1c3e322ef62ef';
    const xOnlyPubKey = toXOnly(publicKey);
    const expectedAddress = 'kaspa:qrdga25hhaz9wd5p3rrcaynxrl0jm9kwze4jyhgdcmqu8cezaa3w7xh9a3xd9';
    expect(getAddressByPublicKeyOrScriptHash(xOnlyPubKey, AddressVersion.PUBKEY)).toBe(expectedAddress);
  });

  it('Test getAddressByPublicKey with version 1', async () => {
    const publicKey = '03da8eaa97bf4457368188c78e92661fdf2d96ce166b225d0dc6c1c3e322ef62ef';
    const expectedAddress = 'kaspa:qypa4r42j7l5g4eksxyv0r5jvc0a7tvkectxkgjaphrvrslrythk9mc0huhkd8a';
    expect(getAddressByPublicKeyOrScriptHash(publicKey, AddressVersion.PUBKEY_ECDSA)).toBe(expectedAddress);
  });

  it('Test getAddressByPublicKey with version 8', async () => {
    const scriptHash = 'b815f3841cfb87b8fd834b2c1cba9a8790fb5f568cc7b3a377acd71350d08691';
    const expectedAddress = 'kaspa:pzuptuuyrnac0w8asd9jc896n2rep76l26xv0varw7kdwy6s6zrfzvsukssy2';
    expect(getAddressByPublicKeyOrScriptHash(scriptHash, AddressVersion.SCRIPT_HASH)).toBe(expectedAddress);
  });

  it('Test addressToOutScript with P2PK_SCHNORR script address', async () => {
    const address = 'kaspa:qrdga25hhaz9wd5p3rrcaynxrl0jm9kwze4jyhgdcmqu8cezaa3w7xh9a3xd9';
    const { scriptType, outScript, outPubkeyOrHash } = addressToOutScript(address);
    expect(scriptType).toBe(ScriptType.P2PK_SCHNORR);
    expect(outScript.toString('hex')).toMatchInlineSnapshot(
      `"20da8eaa97bf4457368188c78e92661fdf2d96ce166b225d0dc6c1c3e322ef62efac"`
    );
    expect(outPubkeyOrHash.toString('hex')).toMatchInlineSnapshot(
      `"da8eaa97bf4457368188c78e92661fdf2d96ce166b225d0dc6c1c3e322ef62ef"`
    );
  });

  it('Test addressToOutScript with P2PK_ECDSA script address', async () => {
    const address = 'kaspa:qypmrwy3gm82j08chmr0502d08pxtp4vpxs736ln02jeq33f7c7g2lgk5a8egc4';
    const { scriptType, outScript, outPubkeyOrHash } = addressToOutScript(address);
    expect(scriptType).toBe(ScriptType.P2PK_ECDSA);
    expect(outScript.toString('hex')).toMatchInlineSnapshot(
      `"2103b1b89146cea93cf8bec6fa3d4d79c26586ac09a1e8ebf37aa5904629f63c857dab"`
    );
    expect(outPubkeyOrHash.toString('hex')).toMatchInlineSnapshot(
      `"03b1b89146cea93cf8bec6fa3d4d79c26586ac09a1e8ebf37aa5904629f63c857d"`
    );
  });

  it('Test addressToOutScript with script P2SH address', async () => {
    const address = 'kaspa:pzuptuuyrnac0w8asd9jc896n2rep76l26xv0varw7kdwy6s6zrfzvsukssy2';
    const { scriptType, outScript, outPubkeyOrHash } = addressToOutScript(address);
    expect(scriptType).toBe(ScriptType.P2SH);
    expect(outScript.toString('hex')).toMatchInlineSnapshot(
      `"aa20b815f3841cfb87b8fd834b2c1cba9a8790fb5f568cc7b3a377acd71350d0869187"`
    );
    expect(outPubkeyOrHash.toString('hex')).toMatchInlineSnapshot(
      `"b815f3841cfb87b8fd834b2c1cba9a8790fb5f568cc7b3a377acd71350d08691"`
    );
  });

  it('Test addressToOutScript with unsupported version address', async () => {
    const address = 'kaspa:q2cm3y2xe65ne797cmar6ntecfjcdtqf585whum65kgyv20k8jzhmtq5q5qe6c9';
    expect(() => addressToOutScript(address)).toThrowErrorMatchingInlineSnapshot(
      `"error function: decodeAddress, message: Unsupported version: 2 with address:kaspa:q2cm3y2xe65ne797cmar6ntecfjcdtqf585whum65kgyv20k8jzhmtq5q5qe6c9"`
    );
  });

  it('Test pubkeyOrScriptHashToPayment with script P2PK_SCHNORR', async () => {
    const publicKey = '03da8eaa97bf4457368188c78e92661fdf2d96ce166b225d0dc6c1c3e322ef62ef';
    const { pubkeyOrScriptHash, addressVersion } = getPubkeyOrScriptHash(ScriptType.P2PK_SCHNORR, publicKey);
    const { address, outScript } = pubkeyOrScriptHashToPayment(pubkeyOrScriptHash, addressVersion);
    expect(address).toMatchInlineSnapshot(`"kaspa:qrdga25hhaz9wd5p3rrcaynxrl0jm9kwze4jyhgdcmqu8cezaa3w7xh9a3xd9"`);
    expect(outScript.toString('hex')).toMatchInlineSnapshot(
      `"20da8eaa97bf4457368188c78e92661fdf2d96ce166b225d0dc6c1c3e322ef62efac"`
    );
  });

  it('Test pubkeyOrScriptHashToPayment with script P2PK_ECDSA', async () => {
    const publicKey = '03da8eaa97bf4457368188c78e92661fdf2d96ce166b225d0dc6c1c3e322ef62ef';
    const { pubkeyOrScriptHash, addressVersion } = getPubkeyOrScriptHash(ScriptType.P2PK_ECDSA, publicKey);
    const { address, outScript } = pubkeyOrScriptHashToPayment(pubkeyOrScriptHash, addressVersion);
    expect(address).toMatchInlineSnapshot(`"kaspa:qypa4r42j7l5g4eksxyv0r5jvc0a7tvkectxkgjaphrvrslrythk9mc0huhkd8a"`);
    expect(outScript.toString('hex')).toMatchInlineSnapshot(
      `"2103da8eaa97bf4457368188c78e92661fdf2d96ce166b225d0dc6c1c3e322ef62efab"`
    );
  });

  it('Test pubkeyOrScriptHashToPayment with script P2SH', async () => {
    const publicKey = '03da8eaa97bf4457368188c78e92661fdf2d96ce166b225d0dc6c1c3e322ef62ef';
    expect(() => getPubkeyOrScriptHash(ScriptType.P2SH, publicKey)).toThrowErrorMatchingInlineSnapshot(
      `"error function: getPubkeyOrScriptHash, message: Unsupported scriptType: 2, publicKey: 03da8eaa97bf4457368188c78e92661fdf2d96ce166b225d0dc6c1c3e322ef62ef"`
    );
  });

  it('Test decodeAddress throws error if address with unknown version', () => {
    const address = 'kaspa:q2cm3y2xe65ne797cmar6ntecfjcdtqf585whum65kgyv20k8jzhmtq5q5qe6c9';
    expect(() => decodeAddress(address)).toThrowErrorMatchingInlineSnapshot(
      `"error function: decodeAddress, message: Unsupported version: 2 with address:kaspa:q2cm3y2xe65ne797cmar6ntecfjcdtqf585whum65kgyv20k8jzhmtq5q5qe6c9"`
    );
  });
});
