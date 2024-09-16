import { createSeedsHexByMnemonic } from '../../src/utils';

describe('utils', () => {
  test('createSeedsHexByMnemonic', async () => {
    const mnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo card';
    const seedsHex = await createSeedsHexByMnemonic(mnemonic);
    expect(seedsHex).toMatchInlineSnapshot(
      `"c52efd54460e2acb9dc560ee868dbc4be74da82aca8f7d7f806ecf1a47183f140d16aad1fac199ad9934b6659556a69ec63be60df25a89f16d103445b8440d6360bc741dba717e0ea991ba26210e6a1efc05c8e8a33eff0119b1a66e81c3a35337895fa1129f4f792cbe40c8de33478a24cd2b7688fe1de81341135263017f694d3b0f11600fe4b9fff8f77ff5853d9e1fe2ba80909328d4ff65d7246804112c"`
    );
  });
});
