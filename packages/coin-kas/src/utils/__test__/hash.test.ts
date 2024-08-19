import { calculateSigHash, getTransferArgumentBuffer, getUtxoArgumentBuffer, SIGHASH_ALL } from '../hash';
import { testTransaction } from './testData';

describe('Test hash.ts', () => {
  it('Test getTransferArgument', async () => {
    console.log('transaction: ' + JSON.stringify(testTransaction, null, 2));
    const transferArgumentBuf = await getTransferArgumentBuffer(testTransaction);
    expect(transferArgumentBuf.toString('hex')).toMatchInlineSnapshot(
      `"0000b9040cd6c2cc517e2684744b61b9defaeb670312759d8a778007ab72c5d06e020f99135614633e507969d12522c80f967cff6ebc0436863e02ee42b2b66556fc8523b0471bcbea04575ccaa635eef9f9114f2890bda54367e5ff8caa3878bf82e80300000000000000002200000000000000200a3da6e8c7a8795440e60e4662686bc17cd965780095604c85d8d137e0f48079ac0122c8668c00000000328000002c8001b207800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001"`
    );
  });

  it('Test getUtxoArgument', async () => {
    const index = 0;
    const utxo = testTransaction.utxos[index];
    const input = testTransaction.inputs[index];
    console.log('index: ' + index);
    console.log('utxo: ' + JSON.stringify(utxo, null, 2));
    console.log('input: ' + JSON.stringify(utxo, null, 2));
    const utxoArgumentBuf = await getUtxoArgumentBuffer(input, utxo);
    const utxoArgument = utxoArgumentBuf.toString('hex');
    expect(utxoArgument).toMatchInlineSnapshot(
      `"328000002c8001b20780000000000000000000000021aa1aff85fc054381f8536d1ab8dbe68f1673a7c67b7ad7816431603c58d32e010000000000220000000000000020b1b89146cea93cf8bec6fa3d4d79c26586ac09a1e8ebf37aa5904629f63c857daccef3668c00000000000000000000000001"`
    );
  });

  it('Test before sign schnorr', async () => {
    testTransaction.inputs.forEach((_input, index) => {
      const sigHashBuffer = calculateSigHash(testTransaction, SIGHASH_ALL, index, {});
      const sigHash = sigHashBuffer.toString('hex');
      expect(sigHash).toMatchInlineSnapshot(`"5f0fff866d90ff84dbad16155f93fc02811ac97b033c50123c27af46d715ba7d"`);
    });
  });
});
