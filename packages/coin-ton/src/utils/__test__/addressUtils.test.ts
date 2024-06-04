import { getAddressByPublicKey } from '../addressUtils';

describe('Test addressUtils.ts', () => {
  it('Test getAddressByPublicKey', async () => {
    const publicKey = '98840c22b503b78f4fad53f29a8aa7e7a8069e11846ba71a09e0387f86500c3b';
    const expectedAddress = 'UQAlWnyf_OmGFyJ3wHkP930RGPDtokkcYhphAjId05OOIyjs';

    expect(await getAddressByPublicKey(publicKey)).toBe(expectedAddress);
  });
});
