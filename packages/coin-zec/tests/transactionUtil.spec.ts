import rlp from 'rlp';
import { composeFinalV5Transaction, createUnsignedTransactions } from '../src/utils/transactionUtil';
import { getV5Argument } from '../src/utils/scriptUtil';
import { ScriptType } from '../src/config/types';
import type { Input } from '../src/config/types';

const NU7_BRANCH_ID = 0x77190ad9;
const PUBKEY = Buffer.from('024edfc9ffc53b2be653b2ce5771fad8dd57de250c0710618a9cd0f96980ae4787', 'hex');
const RECIPIENT = { address: 't1Vbw17X8y1PBqYw2TxB9dTWTRrginFA9kX', value: '100000' };
// a DER-shaped signature; composing does not check it
const SIGNATURE = Buffer.from('30440220' + '11'.repeat(32) + '0220' + '22'.repeat(32), 'hex');

function getInputs(count: number): Array<Input> {
  return Array.from({ length: count }, (_, i) => ({
    preTxHash: '9452bdd51aea164d92db842616c9979c72fda81553d3b51d7bffa26858eaf437',
    preIndex: i,
    preValue: '50000',
    addressIndex: 0,
    pubkeyBuf: PUBKEY,
  }));
}

function composeWithInputs(inputCount: number, expiryHeight: number): Buffer {
  const { preparedData } = createUnsignedTransactions(ScriptType.P2PKH, getInputs(inputCount), RECIPIENT, undefined);
  const signatures = Array.from({ length: inputCount }, () => SIGNATURE);
  return composeFinalV5Transaction(preparedData, signatures, NU7_BRANCH_ID, expiryHeight);
}

describe('composeFinalV5Transaction', () => {
  describe('header: version | version group id | branch id | lock time | expiry height', () => {
    it.each`
      expiryHeight | expectedExpiryHeight
      ${0}         | ${'00000000'}
      ${3543500}   | ${'cc113600'}
      ${499999999} | ${'ff64cd1d'}
    `('writes expiry height $expiryHeight as $expectedExpiryHeight', ({ expiryHeight, expectedExpiryHeight }) => {
      const tx = composeWithInputs(1, expiryHeight);
      expect(tx.subarray(0, 20).toString('hex')).toBe(
        '050000800a27a726' + 'd90a1977' + '00000000' + expectedExpiryHeight
      );
    });
  });

  describe('transparent bundle', () => {
    it.each`
      inputCount | expectedInputCount
      ${1}       | ${'01'}
      ${252}     | ${'fc'}
      ${253}     | ${'fdfd00'}
    `('encodes $inputCount inputs as $expectedInputCount', ({ inputCount, expectedInputCount }) => {
      const tx = composeWithInputs(inputCount, 0);
      expect(tx.subarray(20, 20 + expectedInputCount.length / 2).toString('hex')).toBe(expectedInputCount);
    });

    it('signs each P2PKH input with SIGHASH_ALL|ANYONECANPAY and its public key', () => {
      const tx = composeWithInputs(1, 0);
      const scriptSig = Buffer.concat([
        Buffer.from([SIGNATURE.length + 1]),
        SIGNATURE,
        Buffer.from('81', 'hex'),
        Buffer.from([PUBKEY.length]),
        PUBKEY,
      ]);
      const outPoint = tx.subarray(21, 57);
      expect(tx.subarray(57, 58 + scriptSig.length).toString('hex')).toBe(
        Buffer.concat([Buffer.from([scriptSig.length]), scriptSig]).toString('hex')
      );
      expect(outPoint.subarray(32).toString('hex')).toBe('00000000'); // output index 0
      expect(tx.subarray(58 + scriptSig.length, 62 + scriptSig.length).toString('hex')).toBe('ffffffff');
    });

    it('ends with the outputs, then empty Sapling and Orchard bundles', () => {
      const { preparedData } = createUnsignedTransactions(ScriptType.P2PKH, getInputs(1), RECIPIENT, undefined);
      const tx = composeFinalV5Transaction(preparedData, [SIGNATURE], NU7_BRANCH_ID, 0);
      const outputs = Buffer.concat([preparedData.outputsCount, preparedData.outputsBuf]);
      expect(tx.subarray(tx.length - 3 - outputs.length).toString('hex')).toBe(outputs.toString('hex') + '000000');
      expect(preparedData.outputsCount.toString('hex')).toBe('01'); // no change
    });
  });
});

describe('getV5Argument', () => {
  // outputAmount | outputScriptType | outputDest | haveChange | changeAmount | changeScriptType | changePath
  // | consensusBranchId | lockTime | expiryHeight
  it('takes the lock time the transaction is serialized with', async () => {
    const lockTimeBuf = Buffer.from('01020304', 'hex');
    const argument = await getV5Argument(ScriptType.P2PKH, RECIPIENT, undefined, NU7_BRANCH_ID, lockTimeBuf, 3543500);
    const items = (rlp.decode(Buffer.from(argument, 'hex')) as Uint8Array[]).map((item) =>
      Buffer.from(item).toString('hex')
    );
    expect(items).toEqual([
      '0186a0',
      '00',
      '80aab6125e2949882b48d06cf543ae2e5bf97463',
      '00',
      '',
      '',
      '',
      'd90a1977',
      '01020304',
      'cc113600',
    ]);
  });
});
