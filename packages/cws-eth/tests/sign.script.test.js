/* eslint-disable max-len */
/* eslint-disable class-methods-use-this */

import ETH from '../src';

require('@coolwallets/core').core.util.checkSupportScripts = () => true;

const appId = '0533ac5f177331221642adc02f7265bc3edb84d1';
// const appPublicKey = '04cc68637846686549886133daa6acc4dceeed546bc04b8f258211df59ba2e28bbb5d4a1384a920acf0bbd1654dbcb5431ea1629e9856551bccb425c641de9f801';
const appPrivateKey = '57a1c4ecdfc2dad7d392bf0f707ddd7280623f1b7de21e5efd42895b4b178737';

class Transport {}

const transport = new Transport();
const eth = new ETH(transport, appPrivateKey, appId);

test('should sign transaction with script command ', async () => {
  const transaction = {
    chainId: 1,
    nonce: '0x31b',
    gasPrice: '0x12a05f200',
    gasLimit: '0x520c',
    to: '0x0644De2A0Cf3f11Ef6Ad89C264585406Ea346a96',
    value: '0xde0b6b3a7640000',
    data: '0x00'
  };
  const tx = await eth.signTransaction(transaction, 0);
  expect(tx).toBe('0xf86e82031b85012a05f20082520c940644de2a0cf3f11ef6ad89c264585406ea346a96880de0b6b3a76400008025a07cce23b352f3c1f11ef4833e76b3b0cb14ca17bb0097d197b307690a551d19eea0156703269448e84d2a82e07531375896fd6fc6e0478cdda876315611d4cad697');
});
