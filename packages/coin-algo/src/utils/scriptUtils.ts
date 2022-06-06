import nacl from "tweetnacl";
import base32 from "hi-base32";
import sha512 from "js-sha512";
import * as types from '../config/types';
import { getTransactionArgument } from "./transactionUtils";

const PUBLIC_KEY_LENGTH = nacl.sign.publicKeyLength;
const ALGORAND_ADDRESS_LENGTH = 58;
const ALGORAND_CHECKSUM_BYTE_LENGTH = 4;

function concatArrays(...arrs: ArrayLike<number>[]): Uint8Array {
  const size = arrs.reduce((sum, arr) => sum + arr.length, 0);
  const c = new Uint8Array(size);

  let offset = 0;
  for (let i = 0; i < arrs.length; i++) {
    c.set(arrs[i], offset);
    offset += arrs[i].length;
  }
  return c;
}

const pubKeyToAddress = async (publicKey: string) => {
  const publicKeyBytes = Buffer.from(publicKey, 'hex');
  const checksum = sha512.sha512_256
    .array(publicKeyBytes)
    .slice(
      PUBLIC_KEY_LENGTH - ALGORAND_CHECKSUM_BYTE_LENGTH,
      PUBLIC_KEY_LENGTH
    );
  const addr = base32.encode(concatArrays(publicKeyBytes, checksum));
  return addr.toString().slice(0, ALGORAND_ADDRESS_LENGTH);
}

const getPaymentArgument = async (
  transaction: types.Transaction
): Promise<string> => {
  const fields = ['amt', 'close', 'fee', 'fv', 'gen', 'grp', 'gh', 'lv', 'lx', 'note', 'rcv', 'rekey', 'snd', 'type'];
  const argument = getTransactionArgument(transaction, fields);
  return argument;
};

const getKeyRegistrationArgument = async (
  transaction: types.Transaction
): Promise<string> => {
  const fields = ['fee', 'fv', 'gen', 'grp', 'gh', 'lv', 'lx', 'nonpart', 'note', 'rekey', 'selkey', 'sprfkey', 'snd', 'type', 'votefst', 'votekd', 'votekey', 'votelst'];
  const argument = getTransactionArgument(transaction, fields);
  return argument;
};

const getAssetConfigArgument = async (
  transaction: types.Transaction
): Promise<string> => {
  const fields = ['apar', 'caid', 'fee', 'fv', 'gen', 'grp', 'gh', 'lv', 'lx', 'note', 'rekey', 'snd', 'type'];
  const argument = getTransactionArgument(transaction, fields);
  return argument;
};

const getAssetTransferArgument = async (
  transaction: types.Transaction
): Promise<string> => {
  const fields = ['aamt', 'aclose', 'arcv', 'asnd', 'fee', 'fv', 'gen', 'grp', 'gh', 'lv', 'lx', 'note', 'rekey', 'snd', 'type', 'xaid'];
  const argument = getTransactionArgument(transaction, fields);
  return argument;
};

const getAssetFreezeArgument = async (
  transaction: types.Transaction
): Promise<string> => {
  const fields = ['afrz', 'fadd', 'faid', 'fee', 'fv', 'gen', 'grp', 'gh', 'lv', 'lx', 'note', 'rekey', 'snd', 'type'];
  const argument = getTransactionArgument(transaction, fields);
  return argument;
};

const getApplicationCallArgument = async (
  transaction: types.Transaction
): Promise<string> => {
  const fields = ['apaa', 'apan', 'apap', 'apas', 'apat', 'apep', 'apfa', 'apid',
    'apls', 'apgs', 'apsu', 'fee', 'fv', 'gen', 'grp', 'gh', 'lv', 'lx', 'note',
    'rekey', 'snd', 'type'];
  const argument = getTransactionArgument(transaction, fields);
  return argument;
};


export {
  pubKeyToAddress,
  getPaymentArgument,
  getAssetTransferArgument,
  getAssetConfigArgument,
  getAssetFreezeArgument,
  getApplicationCallArgument,
  getKeyRegistrationArgument
};