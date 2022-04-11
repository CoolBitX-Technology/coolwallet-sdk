/* eslint-disable max-len */
import { getRawHex} from '../src/utils/ethUtils';
import { getTransferArgument, getERC20Argument} from '../src/utils/scriptUtils';

jest.mock('@coolwallet/core');

const getTransferArgumentTest = jest.fn(getTransferArgument);

const rlp = require('rlp');

const transferTx = {
  chainId: 1,
  nonce: '0x31b',
  gasPrice: '0xc4b20100',
  gasLimit: '0x5450',
  to: '0x0644De2A0Cf3f11Ef6Ad89C264585406Ea346a96',
  value: '0xde0b6b3a7640000',
  data: '',
};

const erc20TransferTx = {
  chainId: 1,
  nonce: '0x31b',
  gasPrice: '0xc4b20100',
  gasLimit: '0x5450',
  to: '0x0644De2A0Cf3f11Ef6Ad89C264585406Ea346a96',
  value: '0xde0b6b3a7640000',
  data: '0xa9059cbb000000000000000000000000c94f3bebddfc0fd7eac7badb149fad2171b94b6900000000000000000000000000000000000000000000000000000000000003e8',
  option: {
    info: { 
      symbol: 'DAI', 
      decimals: 18 
    }
  },
};

test('should build correct transaction hex', () => {
  const hex = rlp.encode(getRawHex(transferTx)).toString('hex');
  expect(hex).toBe('ed82031b84c4b20100825450940644de2a0cf3f11ef6ad89c264585406ea346a96880de0b6b3a764000080018080');
});


test('should get transfer argument', async () => {
  const argument = await getTransferArgumentTest(transferTx, 0);
  expect(argument).toBe('15328000002C8000003C8000000000000000000000000644De2A0Cf3f11Ef6Ad89C264585406Ea346a9600000de0b6b3a7640000000000000000c4b2010000000000000000005450000000000000031b0001');
});


test('should get erc20 transfer argument', async () => {
  const tokenSignature = "1203444149000000006b175474e89094c44da98b954eedeac495271d0f304402202DA4EC890EACC1A2667766EB2D63AC7313BAA5C3738C6D1AE7296FA68603552002204A8FDC63CFF04501BF5B78E84B2636306748C5F2602B4E7E0405AFEADEBEF585";
  const argument = await getERC20Argument(erc20TransferTx, tokenSignature, 0);
  expect(argument).toBe('15328000002C8000003C800000000000000000000000c94f3bebddfc0fd7eac7badb149fad2171b94b690000000000000000000003e8000000000000c4b2010000000000000000005450000000000000031b00011203444149000000000644De2A0Cf3f11Ef6Ad89C264585406Ea346a960000304402202DA4EC890EACC1A2667766EB2D63AC7313BAA5C3738C6D1AE7296FA68603552002204A8FDC63CFF04501BF5B78E84B2636306748C5F2602B4E7E0405AFEADEBEF585');
});
