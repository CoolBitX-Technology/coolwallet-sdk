import BigNumber from 'bignumber.js';
import { Inputs, Transaction } from '@mysten/sui/transactions';
import { getCoinTransferArguments, getSmartContractArguments, getTokenTransferArguments } from '../scriptUtil';
import { coinFeeInfo, tokenFeeInfo, tokenFeeInfoWith10CoinObjects } from './testData';
import { messageWithIntent } from '@mysten/sui/cryptography';
import { addressBalanceToAddress, addressBalanceTransactions } from './addressBalanceTestData';

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

    const transaction = Buffer.from(await rawTx.build()).toString('base64');
    const args = getCoinTransferArguments(transaction, 0);
    expect(args.argument).toMatchInlineSnapshot(
      `"15108000002c800001f5800000008000000000120008000000000002000800e1f50500000000002072fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af090202000101000001010300000000010100aa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fc02159b6593e1bcfe4f784fcffdd483de003317a401308b7ed79bb22ecfb167cd26585f90190000000020ebe9873170df93ffdbe7a6e0f92fd145b4ec08aa30f02cecf7e23913a1b0464fa8d3438b75c713a9d2ad4b7bc5009ed0a0fffb909ef42a050cba2f823f9393878bd706190000000020230b38ffe2845f04a303d8721ca50d89d23b77f97b17434efc65120fc0d7e46baa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fcee02000000000000200a35000000000000"`
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

    const amountArg = rawTx.pure.u64(sendAmountUnit);
    const toAddressArg = rawTx.pure.address(toAddress);
    rawTx.object(Inputs.ObjectRef({ digest, objectId, version }));
    const [coin] = rawTx.splitCoins(rawTx.objectRef({ digest, objectId, version }), [amountArg]);
    rawTx.transferObjects([coin], toAddressArg);

    const transaction = Buffer.from(await rawTx.build()).toString('base64');
    const args = getTokenTransferArguments(transaction, 0, tokenInfo);
    expect(args.argument).toMatchInlineSnapshot(
      `"15108000002c800001f58000000080000000001200080604555344430000000000000000030008e803000000000000002072fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af090100c7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde4bae6d5f90190000000020e5da84a92b533a056944eeb23dbc58b9027c2ef57bd513fe8c7f14109c43df5302020102000101000001010300000000010100aa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fc02159b6593e1bcfe4f784fcffdd483de003317a401308b7ed79bb22ecfb167cd26585f90190000000020ebe9873170df93ffdbe7a6e0f92fd145b4ec08aa30f02cecf7e23913a1b0464fa8d3438b75c713a9d2ad4b7bc5009ed0a0fffb909ef42a050cba2f823f9393878bd706190000000020230b38ffe2845f04a303d8721ca50d89d23b77f97b17434efc65120fc0d7e46baa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fcee0200000000000008583a000000000000"`
    );
  });

  it('getTokenTransferArguments for 10 coinObjects', async () => {
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
    const amountArg = rawTx.pure.u64(sendAmountUnit);
    const toAddressArg = rawTx.pure.address(toAddress);

    if (coinObjects.length > 1) {
      // merge coins if have more than one coinObjects
      const destination = coinObjects[0];
      const sources = coinObjects.filter((object) => object.objectId !== destination.objectId);
      const sourcesRef = sources.map((source) => rawTx.objectRef(source));
      rawTx.mergeCoins(rawTx.objectRef(destination), sourcesRef);
    }
    const { digest, objectId, version } = coinObjects[0];
    const [coin] = rawTx.splitCoins(rawTx.objectRef({ digest, objectId, version }), [amountArg]);
    rawTx.transferObjects([coin], toAddressArg);

    const transaction = Buffer.from(await rawTx.build()).toString('base64');
    const args = getTokenTransferArguments(transaction, 0, tokenInfo);
    expect(args.argument).toMatchInlineSnapshot(
      `"15108000002c800001f580000000800000000012000806045553444300000000000000000c0008e803000000000000002072fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af090100c7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde4aaa6d5f90190000000020e5da84a92b533a056944eeb23dbc58b9027c2ef57bd513fe8c7f14109c43df530100c7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde4bbb6d5f90190000000020e5da84a92b533a056944eeb23dbc58b9027c2ef57bd513fe8c7f14109c43df530100c7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde4ccc6d5f90190000000020e5da84a92b533a056944eeb23dbc58b9027c2ef57bd513fe8c7f14109c43df530100c7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde4ddd6d5f90190000000020e5da84a92b533a056944eeb23dbc58b9027c2ef57bd513fe8c7f14109c43df530100c7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde4eee6d5f90190000000020e5da84a92b533a056944eeb23dbc58b9027c2ef57bd513fe8c7f14109c43df530100c7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde4fff6d5f90190000000020e5da84a92b533a056944eeb23dbc58b9027c2ef57bd513fe8c7f14109c43df530100c7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde41116d5f90190000000020e5da84a92b533a056944eeb23dbc58b9027c2ef57bd513fe8c7f14109c43df530100c7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde42226d5f90190000000020e5da84a92b533a056944eeb23dbc58b9027c2ef57bd513fe8c7f14109c43df530100c7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde43336d5f90190000000020e5da84a92b533a056944eeb23dbc58b9027c2ef57bd513fe8c7f14109c43df530100c7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde4bae6d5f90190000000020e5da84a92b533a056944eeb23dbc58b9027c2ef57bd513fe8c7f14109c43df530303010b0009010200010300010400010500010600010700010800010900010a0002010b000101000001010301000000010100aa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fc02159b6593e1bcfe4f784fcffdd483de003317a401308b7ed79bb22ecfb167cd26585f90190000000020ebe9873170df93ffdbe7a6e0f92fd145b4ec08aa30f02cecf7e23913a1b0464fa8d3438b75c713a9d2ad4b7bc5009ed0a0fffb909ef42a050cba2f823f9393878bd706190000000020230b38ffe2845f04a303d8721ca50d89d23b77f97b17434efc65120fc0d7e46baa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fcee0200000000000008583a000000000000"`
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

    const transaction = Buffer.from(await rawTx.build()).toString('base64');
    const args = getSmartContractArguments(transaction, 0);
    expect(args.argument).toMatchInlineSnapshot(
      `"15108000002c800001f58000000080000000000000000002000800e1f50500000000002072fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af090202000101000001010300000000010100aa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fc02159b6593e1bcfe4f784fcffdd483de003317a401308b7ed79bb22ecfb167cd26585f90190000000020ebe9873170df93ffdbe7a6e0f92fd145b4ec08aa30f02cecf7e23913a1b0464fa8d3438b75c713a9d2ad4b7bc5009ed0a0fffb909ef42a050cba2f823f9393878bd706190000000020230b38ffe2845f04a303d8721ca50d89d23b77f97b17434efc65120fc0d7e46baa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fcee02000000000000200a35000000000000"`
    );
  });
});

describe('Test scriptUtil offsets with address balance transactions', () => {
  function readHexAt(intentMessageHex: string, offsetHex: string, byteLength: number): string {
    const start = parseInt(offsetHex, 16) * 2;
    return intentMessageHex.slice(start, start + byteLength * 2);
  }

  it.each(addressBalanceTransactions)('$name', ({ amount, transaction }) => {
    const txBytes = new Uint8Array(Buffer.from(transaction, 'base64'));
    const intentMessageHex = Buffer.from(messageWithIntent('TransactionData', txBytes)).toString('hex');

    const args = getCoinTransferArguments(transaction, 0);
    const header = '00120008'; // toAddress offset | amount offset
    expect(args.argument).toContain(header + intentMessageHex);
    expect(args.bytes).toBe(transaction);

    // SE script 從 offset 讀出的值，要等於卡片上顯示的收款地址與金額
    expect(`0x${readHexAt(intentMessageHex, header.slice(0, 4), 32)}`).toBe(addressBalanceToAddress);
    const amountLittleEndian = readHexAt(intentMessageHex, header.slice(4), 8);
    const amountBigEndian = Buffer.from(amountLittleEndian, 'hex').reverse().toString('hex');
    expect(new BigNumber(amountBigEndian, 16).toFixed()).toBe(amount);
  });
});
