import BigNumber from 'bignumber.js';
import { Inputs, Transaction } from '@mysten/sui/transactions';
import { getCoinTransferArguments, getSmartContractArguments, getTokenTransferArguments } from '../scriptUtil';
import { coinFeeInfo, tokenFeeInfo, tokenFeeInfoWith10CoinObjects } from './testData';

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
      `"11108000002c800001f5800000008000000000120008000000000002000800e1f50500000000002072fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af090202000101000001010300000000010100aa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fc02159b6593e1bcfe4f784fcffdd483de003317a401308b7ed79bb22ecfb167cd26585f90190000000020ebe9873170df93ffdbe7a6e0f92fd145b4ec08aa30f02cecf7e23913a1b0464fa8d3438b75c713a9d2ad4b7bc5009ed0a0fffb909ef42a050cba2f823f9393878bd706190000000020230b38ffe2845f04a303d8721ca50d89d23b77f97b17434efc65120fc0d7e46baa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fcee02000000000000200a35000000000000"`
    );
  });

  it('getTokenTransferArguments', async () => {
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
      `"11108000002c800001f58000000080000000005d00530604555344430000000000000000030100c7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde4bae6d5f90190000000020e5da84a92b533a056944eeb23dbc58b9027c2ef57bd513fe8c7f14109c43df530008e803000000000000002072fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af0902020100000101010001010300000000010200aa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fc02159b6593e1bcfe4f784fcffdd483de003317a401308b7ed79bb22ecfb167cd26585f90190000000020ebe9873170df93ffdbe7a6e0f92fd145b4ec08aa30f02cecf7e23913a1b0464fa8d3438b75c713a9d2ad4b7bc5009ed0a0fffb909ef42a050cba2f823f9393878bd706190000000020230b38ffe2845f04a303d8721ca50d89d23b77f97b17434efc65120fc0d7e46baa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fcee0200000000000008583a000000000000"`
    );
  });

  it.only('getTokenTransferArguments for 10 coinObjects', async () => {
    const amount = '0.001';
    const tokenInfo = {
      name: 'Sui',
      symbol: 'USDC',
      decimals: 6,
      suiCoinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
    };
    const coinObjects = tokenFeeInfoWith10CoinObjects.coinObjects;

    const rawTx = new Transaction();
    rawTx.setSender(fromAddress);
    rawTx.setGasBudget(new BigNumber(tokenFeeInfoWith10CoinObjects.gasBudget).toNumber());
    rawTx.setGasPayment(tokenFeeInfoWith10CoinObjects.payment);
    rawTx.setGasPrice(new BigNumber(tokenFeeInfoWith10CoinObjects.gasPrice).toNumber());
    const sendAmountUnit = new BigNumber(amount).shiftedBy(tokenInfo.decimals).toFixed();

    if (coinObjects.length > 1) {
      // merge coins if have more than one coinObjects
      const destination = coinObjects[0];
      const sources = coinObjects.filter((object) => object.objectId !== destination.objectId);
      const sourcesRef = sources.map((source) => rawTx.objectRef(source));
      rawTx.mergeCoins(rawTx.objectRef(destination), sourcesRef);
    }
    const { digest, objectId, version } = coinObjects[0];
    const [coin] = rawTx.splitCoins(rawTx.objectRef({ digest, objectId, version }), [sendAmountUnit]);
    rawTx.transferObjects([coin], toAddress);

    const args = await getTokenTransferArguments(rawTx, 0, tokenInfo);
    expect(args).toMatchInlineSnapshot(
      `"11108000002c800001f58000000080000000030002f606045553444300000000000000000c0100c7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde4aaa6d5f90190000000020e5da84a92b533a056944eeb23dbc58b9027c2ef57bd513fe8c7f14109c43df530100c7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde4bbb6d5f90190000000020e5da84a92b533a056944eeb23dbc58b9027c2ef57bd513fe8c7f14109c43df530100c7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde4ccc6d5f90190000000020e5da84a92b533a056944eeb23dbc58b9027c2ef57bd513fe8c7f14109c43df530100c7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde4ddd6d5f90190000000020e5da84a92b533a056944eeb23dbc58b9027c2ef57bd513fe8c7f14109c43df530100c7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde4eee6d5f90190000000020e5da84a92b533a056944eeb23dbc58b9027c2ef57bd513fe8c7f14109c43df530100c7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde4fff6d5f90190000000020e5da84a92b533a056944eeb23dbc58b9027c2ef57bd513fe8c7f14109c43df530100c7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde41116d5f90190000000020e5da84a92b533a056944eeb23dbc58b9027c2ef57bd513fe8c7f14109c43df530100c7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde42226d5f90190000000020e5da84a92b533a056944eeb23dbc58b9027c2ef57bd513fe8c7f14109c43df530100c7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde43336d5f90190000000020e5da84a92b533a056944eeb23dbc58b9027c2ef57bd513fe8c7f14109c43df530100c7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde4bae6d5f90190000000020e5da84a92b533a056944eeb23dbc58b9027c2ef57bd513fe8c7f14109c43df530008e803000000000000002072fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af090303010900090100000101000102000103000104000105000106000107000108000201090001010a0001010301000000010b00aa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fc02159b6593e1bcfe4f784fcffdd483de003317a401308b7ed79bb22ecfb167cd26585f90190000000020ebe9873170df93ffdbe7a6e0f92fd145b4ec08aa30f02cecf7e23913a1b0464fa8d3438b75c713a9d2ad4b7bc5009ed0a0fffb909ef42a050cba2f823f9393878bd706190000000020230b38ffe2845f04a303d8721ca50d89d23b77f97b17434efc65120fc0d7e46baa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fcee0200000000000008583a000000000000"`
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
