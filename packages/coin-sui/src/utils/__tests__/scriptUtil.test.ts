import BigNumber from 'bignumber.js';
import { Transaction } from '@mysten/sui/transactions';
import { getCoinTransferArguments } from '../scriptUtil';

jest.mock('@coolwallet/core', () => {
  return {
    utils: {
      getFullPath: jest.fn().mockReturnValue('108000002c800001f58000000080000000'),
    },
  };
});

describe('Test scriptUtil.getXXXArguments function', () => {
  // common parameters
  const fromAddress = '0xaa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fc';
  const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
  const amount = '0.1';
  const decimals = 9;
  const coinFeeInfo = {
    amount: '0.003476',
    payment: [
      {
        objectId: '0x159b6593e1bcfe4f784fcffdd483de003317a401308b7ed79bb22ecfb167cd26',
        version: 428891992,
        digest: 'GsuLrrruMfrn6tNpPqGMvXDujTG9QcxRpF1332MCThF4',
      },
      {
        objectId: '0xa8d3438b75c713a9d2ad4b7bc5009ed0a0fffb909ef42a050cba2f823f939387',
        version: 419878795,
        digest: '3MoCJHgS8kDb2fLLUBQaeY4Z4b4GqLN7zxkkd9hknTmL',
      },
    ],
    gasPrice: '750',
    gasBudget: '3476000',
  };

  it('getCoinTransferArguments for split + transfer ', async () => {
    const rawTx = new Transaction();
    rawTx.setSender(fromAddress);
    rawTx.setGasBudget(new BigNumber(coinFeeInfo.gasBudget).toNumber());
    rawTx.setGasPayment(coinFeeInfo.payment);
    rawTx.setGasPrice(new BigNumber(coinFeeInfo.gasPrice).toNumber());
    const sendAmountUnit = new BigNumber(amount).shiftedBy(decimals).toFixed();
    const [coin] = rawTx.splitCoins(rawTx.gas, [sendAmountUnit]);
    rawTx.transferObjects([coin], toAddress);

    const args = await getCoinTransferArguments(rawTx, 0);
    expect(args).toMatchInlineSnapshot(
      `"11108000002c800001f58000000080000000024010000000000002000800e1f50500000000002072fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af090202000101000001010300000000010100aa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fc02159b6593e1bcfe4f784fcffdd483de003317a401308b7ed79bb22ecfb167cd26585f90190000000020ebe9873170df93ffdbe7a6e0f92fd145b4ec08aa30f02cecf7e23913a1b0464fa8d3438b75c713a9d2ad4b7bc5009ed0a0fffb909ef42a050cba2f823f9393878bd706190000000020230b38ffe2845f04a303d8721ca50d89d23b77f97b17434efc65120fc0d7e46baa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fcee02000000000000200a35000000000000"`
    );
  });
});
