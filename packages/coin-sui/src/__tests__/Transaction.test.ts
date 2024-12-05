import { Transaction } from '../transactions/Transaction';

describe('Test Transaction function', () => {
  // common parameters
  const sender = '0xaa73d5cc704e89766ebb15ea992c76f59e9eac1d59484034d265fd9d5d3ab4fc';
  const toAddress = '0x72f5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
  const sendAmount = 100000000;
  const gasPrice = 750;
  const gasBudget = 3476000;
  const gasPayment = [
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
  ];

  it('buildTransferTransaction', async () => {
    const tx = new Transaction();
    tx.setSender(sender);
    tx.setGasPrice(gasPrice);
    tx.setGasBudget(gasBudget);
    tx.setGasPayment(gasPayment);
    const [coin] = tx.splitCoins(tx.gas, [sendAmount]);
    tx.transferObjects([coin], toAddress);
    const result = await tx.build();
    expect(result).toMatchInlineSnapshot();
  });
});
