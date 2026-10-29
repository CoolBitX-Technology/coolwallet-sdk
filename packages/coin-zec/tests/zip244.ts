import * as bitcoin from 'bitcoinjs-lib';
import blake2b from 'blake2b';

// Independent of src/: parses a signed v5 transparent transaction (ZIP-225) and checks each input's signature
// against its ZIP-244 digest, so the test fails if the SE signed anything other than what the transaction carries.

type ParsedInput = { outpoint: Buffer; signature: Buffer; hashType: number; pubkey: Buffer; sequence: Buffer };

export type ParsedV5Transaction = {
  header: Buffer; // header | nVersionGroupId | nConsensusBranchId | nLockTime | nExpiryHeight
  consensusBranchId: number;
  inputs: ParsedInput[];
  outputs: Buffer[]; // value | scriptPubKey with its compact size
};

export type SpentOutput = { value: Buffer; scriptPubKey: Buffer };

const SIGHASH_ALL_ANYONECANPAY = 0x81;

function blake2b256(personal: string, ...data: Buffer[]): Buffer {
  const hash = blake2b(32, undefined, undefined, Buffer.from(personal));
  data.forEach((d) => hash.update(d));
  return Buffer.from(hash.digest());
}

class Reader {
  private offset = 0;

  constructor(private readonly buffer: Buffer) {}

  read(length: number): Buffer {
    const data = this.buffer.subarray(this.offset, this.offset + length);
    this.offset += length;
    return data;
  }

  readCompactSize(): number {
    const first = this.read(1)[0];
    if (first < 0xfd) return first;
    if (first === 0xfd) return this.read(2).readUInt16LE(0);
    throw new Error(`compact size 0x${first.toString(16)} not expected in this test`);
  }

  isDone(): boolean {
    return this.offset === this.buffer.length;
  }
}

export function parseV5Transaction(hex: string): ParsedV5Transaction {
  const reader = new Reader(Buffer.from(hex, 'hex'));
  const header = reader.read(20);
  const inputs = Array.from({ length: reader.readCompactSize() }, () => {
    const outpoint = reader.read(36);
    const scriptSig = new Reader(reader.read(reader.readCompactSize()));
    const { signature, hashType } = bitcoin.script.signature.decode(scriptSig.read(scriptSig.readCompactSize()));
    const pubkey = scriptSig.read(scriptSig.readCompactSize());
    return { outpoint, signature, hashType, pubkey, sequence: reader.read(4) };
  });
  const outputs = Array.from({ length: reader.readCompactSize() }, () => {
    const value = reader.read(8);
    const scriptLength = reader.read(1);
    return Buffer.concat([value, scriptLength, reader.read(scriptLength[0])]);
  });
  // nSpendsSapling | nOutputsSapling | nActionsOrchard
  const shieldedBundles = reader.read(3);
  if (!shieldedBundles.equals(Buffer.alloc(3)) || !reader.isDone()) {
    throw new Error('expected a transparent-only transaction');
  }
  return { header, consensusBranchId: header.readUInt32LE(8), inputs, outputs };
}

export function getSignatureDigest(tx: ParsedV5Transaction, inputIndex: number, spent: SpentOutput): Buffer {
  const input = tx.inputs[inputIndex];
  const txinDigest = blake2b256(
    'Zcash___TxInHash',
    input.outpoint,
    spent.value,
    Buffer.from([spent.scriptPubKey.length]),
    spent.scriptPubKey,
    input.sequence
  );
  // ANYONECANPAY: the other inputs are not committed, so their digests hash empty data
  const transparentDigest = blake2b256(
    'ZTxIdTranspaHash',
    Buffer.from([SIGHASH_ALL_ANYONECANPAY]),
    blake2b256('ZTxIdPrevoutHash'),
    blake2b256('ZTxTrAmountsHash'),
    blake2b256('ZTxTrScriptsHash'),
    blake2b256('ZTxIdSequencHash'),
    blake2b256('ZTxIdOutputsHash', ...tx.outputs),
    txinDigest
  );
  const branchId = Buffer.alloc(4);
  branchId.writeUInt32LE(tx.consensusBranchId);
  const personal = Buffer.concat([Buffer.from('ZcashTxHash_'), branchId]);
  const hash = blake2b(32, undefined, undefined, personal);
  [
    blake2b256('ZTxIdHeadersHash', tx.header),
    transparentDigest,
    blake2b256('ZTxIdSaplingHash'),
    blake2b256('ZTxIdOrchardHash'),
  ].forEach((d) => hash.update(d));
  return Buffer.from(hash.digest());
}

export function verifyInputSignature(tx: ParsedV5Transaction, inputIndex: number, spent: SpentOutput): boolean {
  const input = tx.inputs[inputIndex];
  if (input.hashType !== SIGHASH_ALL_ANYONECANPAY) return false;
  const digest = getSignatureDigest(tx, inputIndex, spent);
  return bitcoin.ECPair.fromPublicKey(input.pubkey).verify(digest, input.signature);
}

export function p2pkhScriptPubKey(pubkey: Buffer): Buffer {
  return bitcoin.payments.p2pkh({ pubkey }).output as Buffer;
}
