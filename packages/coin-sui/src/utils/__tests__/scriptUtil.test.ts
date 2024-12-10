import BigNumber from 'bignumber.js';
import { Inputs, Transaction } from '@mysten/sui/transactions';
import { getCoinTransferArguments, getSmartContractArguments, getTokenTransferArguments } from '../scriptUtil';
import { coinFeeInfo, tokenFeeInfo } from './testData';

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

  it('getCoinTransferArguments', async () => {
    const amount = '0.1';
    const decimals = 9;

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
      `"11108000002c800001f5800000008000000000240010000000000002000800e1f50500000000002072fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af090202000101000001010300000000010100aa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fc02159b6593e1bcfe4f784fcffdd483de003317a401308b7ed79bb22ecfb167cd26585f90190000000020ebe9873170df93ffdbe7a6e0f92fd145b4ec08aa30f02cecf7e23913a1b0464fa8d3438b75c713a9d2ad4b7bc5009ed0a0fffb909ef42a050cba2f823f9393878bd706190000000020230b38ffe2845f04a303d8721ca50d89d23b77f97b17434efc65120fc0d7e46baa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fcee02000000000000200a35000000000000"`
    );
  });

  it('getTokenTransferArguments for split + transfer', async () => {
    const amount = '0.001';
    const tokenInfo = {
      name: 'Sui',
      symbol: 'USDC',
      decimals: 6,
      suiCoinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
    };
    const { digest, objectId, version } = tokenFeeInfo.coinObjects[0];

    const rawTx = new Transaction();
    rawTx.setSender(fromAddress);
    rawTx.setGasBudget(new BigNumber(tokenFeeInfo.gasBudget).toNumber());
    rawTx.setGasPayment(tokenFeeInfo.payment);
    rawTx.setGasPrice(new BigNumber(tokenFeeInfo.gasPrice).toNumber());
    const sendAmountUnit = new BigNumber(amount).shiftedBy(tokenInfo.decimals).toFixed();

    rawTx.object(Inputs.ObjectRef({ digest, objectId, version }));
    const [coin] = rawTx.splitCoins(rawTx.objectRef({ digest, objectId, version }), [sendAmountUnit]);
    rawTx.transferObjects([coin], toAddress);

    const args = await getTokenTransferArguments(rawTx, 0, tokenInfo);
    expect(args).toMatchInlineSnapshot(
      `"11108000002c800001f5800000008000000000ba00a60604555344430000000000000000030100c7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde4bae6d5f90190000000020e5da84a92b533a056944eeb23dbc58b9027c2ef57bd513fe8c7f14109c43df530008e803000000000000002072fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af0902020100000101010001010300000000010200aa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fc02159b6593e1bcfe4f784fcffdd483de003317a401308b7ed79bb22ecfb167cd26585f90190000000020ebe9873170df93ffdbe7a6e0f92fd145b4ec08aa30f02cecf7e23913a1b0464fa8d3438b75c713a9d2ad4b7bc5009ed0a0fffb909ef42a050cba2f823f9393878bd706190000000020230b38ffe2845f04a303d8721ca50d89d23b77f97b17434efc65120fc0d7e46baa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fcee0200000000000008583a000000000000"`
    );
  });

  it('getSmartContractArguments', async () => {
    const amount = '0.1';
    const decimals = 9;

    const rawTx = new Transaction();
    rawTx.setSender(fromAddress);
    rawTx.setGasBudget(new BigNumber(coinFeeInfo.gasBudget).toNumber());
    rawTx.setGasPayment(coinFeeInfo.payment);
    rawTx.setGasPrice(new BigNumber(coinFeeInfo.gasPrice).toNumber());
    const sendAmountUnit = new BigNumber(amount).shiftedBy(decimals).toFixed();
    const [coin] = rawTx.splitCoins(rawTx.gas, [sendAmountUnit]);
    rawTx.transferObjects([coin], toAddress);

    const args = await getSmartContractArguments(rawTx, 0);
    expect(args).toMatchInlineSnapshot(
      `"11108000002c800001f58000000080000000000000000002000800e1f50500000000002072fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af090202000101000001010300000000010100aa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fc02159b6593e1bcfe4f784fcffdd483de003317a401308b7ed79bb22ecfb167cd26585f90190000000020ebe9873170df93ffdbe7a6e0f92fd145b4ec08aa30f02cecf7e23913a1b0464fa8d3438b75c713a9d2ad4b7bc5009ed0a0fffb909ef42a050cba2f823f9393878bd706190000000020230b38ffe2845f04a303d8721ca50d89d23b77f97b17434efc65120fc0d7e46baa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fcee02000000000000200a35000000000000"`
    );
  });
});
