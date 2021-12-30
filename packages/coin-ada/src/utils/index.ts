const bip32Edd25519 = require('bip32-ed25519');
const blake2b = require('blake2b');
const { bech32 } = require('bech32');

export const derivePubKeyFromAccountToIndex = (accountPubKey: Buffer, roleIndex = 0, index = 0) => {
  const rolePubKey = bip32Edd25519.derivePublic(accountPubKey, roleIndex);
  return bip32Edd25519.derivePublic(rolePubKey, index).slice(0, 32);
};

// export const deriveChildKey = (accountPubKey: Buffer, index: number) => {
//   return bip32Edd25519.derivePublic(accountPubKey, index);
// };

export const blake2b224 = (input: Buffer) => {
  return Buffer.from(blake2b(28).update(input).digest());
};

export const accountKeyToAddress = (accountPubKey: Buffer, addressIndex: number) => {
  const paymentPubKey = derivePubKeyFromAccountToIndex(accountPubKey, 0, addressIndex);
  const stakePubKey = derivePubKeyFromAccountToIndex(accountPubKey, 2, 0);

  const paymentHash = Buffer.from(blake2b(28).update(paymentPubKey).digest());
  const stakeHash = Buffer.from(blake2b(28).update(stakePubKey).digest());

  const addressBuff = Buffer.concat([Buffer.allocUnsafe(1).fill(0x01), paymentHash, stakeHash]);
  const words = bech32.toWords(addressBuff);
  const address = bech32.encode('addr', words, 200);
  return address;
};

export const decodeAddress = (address: string): { paymentPubKey: Buffer; stakePubKey: Buffer } => {
  const words = bech32.decode(address, 150).words;
  const addressBuff = Buffer.from(bech32.fromWords(words), 'hex');
  const paymentPubKey = addressBuff.slice(1, 33);
  const stakePubKey = addressBuff.slice(33, 65);
  return { paymentPubKey, stakePubKey };
};
