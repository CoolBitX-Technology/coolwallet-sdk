const blake2b = require('blake2b');
const { bech32 } = require('bech32');

export const pubKeyToAddress = (paymentPubKey: Buffer, stakePubKey: Buffer) => {
  const paymentHash = Buffer.from(blake2b(28).update(paymentPubKey).digest());
  console.log('paymentHash   :', paymentHash.toString('hex'));
  const stakeHash = Buffer.from(blake2b(28).update(stakePubKey).digest());
  console.log('stakeHash     :', stakeHash.toString('hex'));
  const addressBuff = Buffer.concat([Buffer.allocUnsafe(1).fill(0x01), paymentHash, stakeHash]);
  console.log('addressBuff   :', addressBuff.toString('hex'));
  const address = bech32.toWords(addressBuff);
  console.log('address :', address);
  return address;
};
