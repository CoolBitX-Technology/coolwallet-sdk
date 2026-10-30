import { CardType, Transport, info, tx as coreTx } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import ZEC from '../src';
import { ScriptType } from '../src/config/types';
import type { signTxType } from '../src/config/types';
import { parseV5Transaction, verifyInputSignature, p2pkhScriptPubKey } from './zip244';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

describe('Test ZEC SDK', () => {
  let transport: Transport;
  let props: Mandatory;
  let cardType: CardType;
  const zecSDK = new ZEC();
  const mnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo abstract';

  beforeAll(async () => {
    if (process.env.CARD === 'go') {
      cardType = CardType.Go;
    } else {
      cardType = CardType.Pro;
    }

    if (cardType === CardType.Go) {
      transport = (await createTransport('http://localhost:9527', CardType.Go))!;
    } else {
      transport = (await createTransport())!;
    }
    props = await initialize(transport, mnemonic);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Test Get Address', () => {
    const ADDRESS_INDEX = 0;
    it('P2PKH', async () => {
      const p2pkh = await zecSDK.getAddress(
        transport,
        props.appPrivateKey,
        props.appId,
        ScriptType.P2PKH,
        ADDRESS_INDEX
      );
      expect(p2pkh).toMatchInlineSnapshot(`"t1V9sXRC68WHVrBqtvG8bCx8Pw6PmXQKTHj"`);
    });

    // it('P2SH', async () => {
    //   const p2sh = await zecSDK.getAddress(transport, props.appPrivateKey, props.appId, ScriptType.P2SH, ADDRESS_INDEX);
    //   expect(p2sh).toMatchInlineSnapshot(`""`);
    // });
  });

  describe('Test Sign Transfer Tx', () => {
    // SE before 348 cannot run a UTXO section, so the SDK keeps signing v4
    it('P2PKH', async () => {
      jest.spyOn(info, 'getSEVersion').mockResolvedValueOnce(347);
      const options: signTxType = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        scriptType: ScriptType.P2PKH,
        inputs: [
          {
            preTxHash: '9452bdd51aea164d92db842616c9979c72fda81553d3b51d7bffa26858eaf437',
            preIndex: 1,
            preValue: '739147',
            sequence: 4294967293,
            addressIndex: 0,
          },
        ],
        output: { address: 't1Vbw17X8y1PBqYw2TxB9dTWTRrginFA9kX', value: '100000' },
        change: { addressIndex: 0, value: '629147' },
        branchId: 0x5437f330,
      };

      const signedTx = await zecSDK.signTransaction(options);
      expect(signedTx).toMatchInlineSnapshot(
        `"0400008085202f890137f4ea5868a2ff7b1db5d35315a8fd729c97c9162684db924d16ea1ad5bd5294010000006b483045022100b39794215d8de13f2339086a1af136fba60e3661f15dee1f7cc8ad31c016fc25022020e84981e113ae9bfe66dd31ff884936d6f99c3f767dab63bd25ef9f0b51a2328121024edfc9ffc53b2be653b2ce5771fad8dd57de250c0710618a9cd0f96980ae4787fdffffff02a0860100000000001976a91480aab6125e2949882b48d06cf543ae2e5bf9746388ac9b990900000000001976a9147bbcfe4b425a1b2b8c46904c08ed5b0a7fe49a9888ac00000000000000000000000000000000000000"`
      );
    });
  });

  describe('Test Sign Transfer Tx v5 (SE 348+)', () => {
    const NU7_BRANCH_ID = 0x77190ad9;
    const RECIPIENT = { address: 't1Vbw17X8y1PBqYw2TxB9dTWTRrginFA9kX', value: '100000' };
    const RECIPIENT_SCRIPT = '1976a91480aab6125e2949882b48d06cf543ae2e5bf9746388ac';

    async function getSpentOutput(addressIndex: number, preValue: string) {
      const pubkey = await zecSDK.getPublicKey(transport, props.appPrivateKey, props.appId, addressIndex);
      const value = Buffer.alloc(8);
      value.writeBigUInt64LE(BigInt(preValue));
      return { value, scriptPubKey: p2pkhScriptPubKey(Buffer.from(pubkey, 'hex')) };
    }

    it('signs one input with change', async () => {
      // Given one input of 739147 zatoshi at address index 0
      // And the recipient gets 100000 and the change (address index 1) gets 629147
      // And the branch id is NU7's and the expiry height is 3543500
      const options: signTxType = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        scriptType: ScriptType.P2PKH,
        inputs: [
          {
            preTxHash: '9452bdd51aea164d92db842616c9979c72fda81553d3b51d7bffa26858eaf437',
            preIndex: 1,
            preValue: '739147',
            addressIndex: 0,
          },
        ],
        output: RECIPIENT,
        change: { addressIndex: 1, value: '629147' },
        branchId: NU7_BRANCH_ID,
        expiryHeight: 3543500,
      };

      const signedTx = await zecSDK.signTransaction(options);

      const tx = parseV5Transaction(signedTx);
      expect(tx.header.toString('hex')).toBe('050000800a27a726d90a197700000000cc113600');
      const changeScript = (await getSpentOutput(1, '0')).scriptPubKey.toString('hex');
      expect(tx.outputs.map((o) => o.toString('hex'))).toEqual([
        'a086010000000000' + RECIPIENT_SCRIPT,
        '9b99090000000000' + '19' + changeScript,
      ]);
      expect(verifyInputSignature(tx, 0, await getSpentOutput(0, '739147'))).toBe(true);
      expect(signedTx).toMatchInlineSnapshot(
        `"050000800a27a726d90a197700000000cc1136000137f4ea5868a2ff7b1db5d35315a8fd729c97c9162684db924d16ea1ad5bd5294010000006a4730440220105a5fcc10dcc369cb2d0c7438b1030e749794dcffd68c7ac5a0d8ac6190f2b60220185c5756ad3ddeec88215af4e9c4220e05ca9d0652dbfbb484987cda0f134bf28121024edfc9ffc53b2be653b2ce5771fad8dd57de250c0710618a9cd0f96980ae4787ffffffff02a0860100000000001976a91480aab6125e2949882b48d06cf543ae2e5bf9746388ac9b990900000000001976a914bcebe28e755a37eed245c734c1dbe78a5f052ce588ac000000"`
      );
    });

    it('pays a P2SH recipient', async () => {
      // Given one input of 739147 zatoshi at address index 0
      // And the recipient is a t3 (P2SH) address and gets 100000, and the change (address index 1) gets 629147
      // And the branch id is NU7's and there is no expiry height
      const options: signTxType = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        scriptType: ScriptType.P2PKH,
        inputs: [
          {
            preTxHash: '9452bdd51aea164d92db842616c9979c72fda81553d3b51d7bffa26858eaf437',
            preIndex: 1,
            preValue: '739147',
            addressIndex: 0,
          },
        ],
        output: { address: 't3Vz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd', value: '100000' },
        change: { addressIndex: 1, value: '629147' },
        branchId: NU7_BRANCH_ID,
      };

      const signedTx = await zecSDK.signTransaction(options);

      const tx = parseV5Transaction(signedTx);
      expect(tx.outputs[0].toString('hex')).toBe(
        'a086010000000000' + '17a914' + '7d46a730d31f97b1930d3368a967c309bd4d136a' + '87'
      );
      expect(verifyInputSignature(tx, 0, await getSpentOutput(0, '739147'))).toBe(true);
    });

    it('signs every input under one confirmation', async () => {
      // Given two inputs of 50000 (address index 0) and 70000 (address index 2) zatoshi
      // And the recipient gets 100000 with no change
      // And the branch id is NU7's and there is no expiry height
      const options: signTxType = {
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        scriptType: ScriptType.P2PKH,
        inputs: [
          {
            preTxHash: '9452bdd51aea164d92db842616c9979c72fda81553d3b51d7bffa26858eaf437',
            preIndex: 0,
            preValue: '50000',
            addressIndex: 0,
          },
          {
            preTxHash: '1f2e3d4c5b6a79881f2e3d4c5b6a79881f2e3d4c5b6a79881f2e3d4c5b6a7988',
            preIndex: 3,
            preValue: '70000',
            addressIndex: 2,
          },
        ],
        output: RECIPIENT,
        branchId: NU7_BRANCH_ID,
      };
      const executeScript = jest.spyOn(coreTx.command, 'executeScript');
      const executeUtxoSegmentScript = jest.spyOn(coreTx.command, 'executeUtxoSegmentScript');

      const signedTx = await zecSDK.signTransaction(options);

      const tx = parseV5Transaction(signedTx);
      // one 80A2 for the confirmation, then one 80AA per input, none with a hash key
      expect(executeScript).toHaveBeenCalledTimes(1);
      expect(executeUtxoSegmentScript).toHaveBeenCalledTimes(2);
      executeUtxoSegmentScript.mock.calls.forEach((call) => expect(call[4]).toBeUndefined());
      expect(tx.inputs).toHaveLength(2);
      expect(verifyInputSignature(tx, 0, await getSpentOutput(0, '50000'))).toBe(true);
      expect(verifyInputSignature(tx, 1, await getSpentOutput(2, '70000'))).toBe(true);
      // a signature over a different amount must not verify, or the check above proves nothing
      expect(verifyInputSignature(tx, 1, await getSpentOutput(2, '70001'))).toBe(false);
      expect(signedTx).toMatchInlineSnapshot(
        `"050000800a27a726d90a197700000000000000000237f4ea5868a2ff7b1db5d35315a8fd729c97c9162684db924d16ea1ad5bd5294000000006a473044022045038dd7b00ea596ad9fbddbe3c1a180ed94cbf3150950bef615b33e28e7a8fb0220215312eb0bd47fd6878f5ce3899bca61570f24c5ffdd3d9f6a511792bce3adb48121024edfc9ffc53b2be653b2ce5771fad8dd57de250c0710618a9cd0f96980ae4787ffffffff88796a5b4c3d2e1f88796a5b4c3d2e1f88796a5b4c3d2e1f88796a5b4c3d2e1f030000006b483045022100b9326851732aa02bf8c4034cc1524e0a96ec098dcf9a6a5175d94dbc79f6d63f02203e276151f7d444477ecc23538f8103a709335d703a229e2def07021ea3ca3e09812102d24af883804d313def5872b6f18bdcfc1204aa43c78178318fc2e50f52b4b54effffffff01a0860100000000001976a91480aab6125e2949882b48d06cf543ae2e5bf9746388ac000000"`
      );
    });
  });
});
