import ByteBuffer from 'bytebuffer';
import { encodeName, toTransferByteBuffer } from './bufferUtil';

type TransferData = import('./types').TransferData;
type Transaction = import('./types').Transaction;

/**
 * encode data object in action
 */
export const hashTransferData = (data: TransferData): string => {
  const {
    from,
    to,
    quantity,
    memo,
  } = data;

  const b2 = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
  b2.writeUint64(encodeName(from, false));
  b2.writeUint64(encodeName(to, false));
  const arr = quantity.split(' ');

  b2.writeInt64(Number(arr[0].replace('.', '')));
  const symbol = arr[1];
  const pad = '\0'.repeat(7 - symbol.length);
  const precision = arr[0].split('.')[1].length;
  b2.append(String.fromCharCode(precision) + symbol + pad);
  b2.writeVString(memo);
  return b2.copy(0, b2.offset).toString('hex');
};

/**
 * concat chainId, signBuf, contextFreeData into buff
 */
export const genSignBuf = (txObject: Transaction, chainId: string): Buffer => {
  const binary = toTransferByteBuffer(txObject).toBinary();
  const buf = Buffer.from(binary, 'binary');
  const chainIdBuf = Buffer.from(chainId, 'hex');
  const packedContextFreeData = Buffer.from(new Uint8Array(32));
  return Buffer.concat([chainIdBuf, buf, packedContextFreeData]);
};

/**
 * return signed transaction object ready to broadcast
 * @param {object} txObject
 * @param {string} signature
 */
export const genSignedTxV1 = (txObject: Transaction, signature: string) => {
  const expiration = new Date(txObject.expiration * 1000).toISOString().split('.')[0];

  const hashedData = hashTransferData(txObject.data);
  const signedTransaction = {
    signatures: [signature],
    compression: 'none',
    transaction: {
      expiration,
      ref_block_num: txObject.ref_block_num,
      ref_block_prefix: txObject.ref_block_prefix,
      max_net_usage_words: txObject.max_net_usage_words,
      max_cpu_usage_ms: txObject.max_cpu_usage_ms,
      delay_sec: txObject.delay_sec,
      context_free_actions: [],
      actions: [
        {
          account: 'eosio.token',
          name: 'transfer',
          authorization: [{ actor: txObject.data.from, permission: 'active' }],
          data: hashedData
        }
      ],
      transaction_extensions: []
    }
  };
  return signedTransaction;
};
