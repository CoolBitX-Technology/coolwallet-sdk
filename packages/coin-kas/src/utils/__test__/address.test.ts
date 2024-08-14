import { getAddressByPublicKey } from '../address';

describe('Test address.ts', () => {
  it('Test getAddressByPublicKey', async () => {
    const publicKey = '03da8eaa97bf4457368188c78e92661fdf2d96ce166b225d0dc6c1c3e322ef62ef';
    const expectedAddress = 'kaspa:qrdga25hhaz9wd5p3rrcaynxrl0jm9kwze4jyhgdcmqu8cezaa3w7xh9a3xd9';
    expect(getAddressByPublicKey(publicKey)).toBe(expectedAddress);
  });
});
