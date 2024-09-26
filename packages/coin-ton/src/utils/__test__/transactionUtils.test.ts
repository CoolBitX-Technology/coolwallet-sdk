import { finalizeTransferTransaction } from '../transactionUtils';

describe('Test TON SDK', () => {
  it('Test composeFinalTransaction', async () => {
    const transaction = {
      toAddress: 'EQAW5QLk3XvW3HMbLqkE9wXkL9NdGpE1555tUxhdea8pVIbJ',
      amount: '123000000',
      seqno: 20,
      payload: 'Hello CoolWallet!',
      expireAt: 1716886177,
      sendMode: 3,
    };
    const publicKey = '98840c22b503b78f4fad53f29a8aa7e7a8069e11846ba71a09e0387f86500c3b';
    const signature = Buffer.from(
      '232635e2de5a60ef089bd4d6d5b7109f294dd9887e2d27bdb4cffd9b3109a5d3ff378aff0da9863a2202e95251491cd6e679ef8d28fbbf9460968fe72006e00e',
      'hex'
    );

    expect(await finalizeTransferTransaction(transaction, publicKey, signature)).toBe(
      'te6cckEBAgEAvwAB4YgASrT5P/nTDC5E74DyH+76IjHh20SSOMQ0wgRkO6cnHEYBGTGvFvLTB3hE3qa2rbiE+UpuzEPxaT3tpn/s2YhNLp/5vFf4bUwx0RAXSpKKSOa3M898aUfd/KMEtH85ADcAcU1NGLsyrNUIAAAAoAAcAQCSYgALcoFybr3rbjmNl1SCe4LyF+mujUia8882qYwuvNeUqiA6pqYAAAAAAAAAAAAAAAAAAAAAAABIZWxsbyBDb29sV2FsbGV0Ie1Mom4='
    );
  });
});
