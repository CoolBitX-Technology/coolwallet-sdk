const bip32Edd25519 = require('bip32-ed25519');
const blake2b = require('blake2b');
const { bech32 } = require('bech32');

const derivePubKeyFromAccountToIndex = (accountPubKey: Buffer, roleIndex = 0, index = 0) => {
  const rolePubKey = bip32Edd25519.derivePublic(accountPubKey, roleIndex);
  return bip32Edd25519.derivePublic(rolePubKey, index).slice(0, 32);
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
