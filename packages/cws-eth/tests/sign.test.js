/* eslint-disable max-len */
/* eslint-disable class-methods-use-this */
import ETH from '../src';

const appId = '0533ac5f177331221642adc02f7265bc3edb84d1';
// const appPublicKey = '04cc68637846686549886133daa6acc4dceeed546bc04b8f258211df59ba2e28bbb5d4a1384a920acf0bbd1654dbcb5431ea1629e9856551bccb425c641de9f801';
const appPrivateKey = '57a1c4ecdfc2dad7d392bf0f707ddd7280623f1b7de21e5efd42895b4b178737';

const coreModule = require('@coolwallet/core');

class Transport {}

const transport = new Transport();
const eth = new ETH(transport, appPrivateKey, appId);

test('should get address ', async () => {
  const address = await eth.getAddress(0);
  expect(address).toBe('0xbAF99eD5b5663329FA417953007AFCC60f06F781');
});

test('should sign transaction ', async () => {
  const transaction = {
    chainId: 1,
    nonce: '0x31b',
    gasPrice: '0xb2d05e00',
    gasLimit: '0x520c',
    to: '0x0644De2A0Cf3f11Ef6Ad89C264585406Ea346a96',
    value: '0xde0b6b3a7640000',
    data: '0x00',
  };
  const tx = await eth.signTransaction(transaction, 0);
  expect(tx).toBe('0xf86d82031b84b2d05e0082520c940644de2a0cf3f11ef6ad89c264585406ea346a96880de0b6b3a76400008025a0ac1feeae6a0d9c0b6e23152432a270889495dcfc837db978f10000d38102be02a01570ac1cea178b10c2bc4d1693ba6599c80679eac83c2548234a3ad8e4f117a4');
});

test('should call old generation functions ', async () => {
  expect(coreModule.core.flow.prepareSEData).toHaveBeenCalledTimes(1);
  expect(coreModule.core.flow.sendDataToCoolWallet).toHaveBeenCalledTimes(1);
  expect(coreModule.core.flow.sendScriptAndDataToCard).toHaveBeenCalledTimes(0);
});
