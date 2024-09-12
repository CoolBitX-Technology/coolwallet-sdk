import { addressToOutScript, decodeAddress, getAddressByPublicKey, pubkeyToPayment } from '../address';

describe('Test address.ts', () => {
  it('Test getAddressByPublicKey', async () => {
    const publicKey = '03da8eaa97bf4457368188c78e92661fdf2d96ce166b225d0dc6c1c3e322ef62ef';
    const expectedAddress = 'kaspa:qrdga25hhaz9wd5p3rrcaynxrl0jm9kwze4jyhgdcmqu8cezaa3w7xh9a3xd9';
    expect(getAddressByPublicKey(publicKey)).toBe(expectedAddress);
  });

  it('Test addressToOutScript', async () => {
    const address = 'kaspa:qrdga25hhaz9wd5p3rrcaynxrl0jm9kwze4jyhgdcmqu8cezaa3w7xh9a3xd9';
    expect(addressToOutScript(address)).toMatchInlineSnapshot(`
      Object {
        "outScript": Object {
          "data": Array [
            32,
            218,
            142,
            170,
            151,
            191,
            68,
            87,
            54,
            129,
            136,
            199,
            142,
            146,
            102,
            31,
            223,
            45,
            150,
            206,
            22,
            107,
            34,
            93,
            13,
            198,
            193,
            195,
            227,
            34,
            239,
            98,
            239,
            172,
          ],
          "type": "Buffer",
        },
        "scriptType": 0,
      }
    `);
  });

  it('Test pubkeyToPayment', async () => {
    const publicKey = '03da8eaa97bf4457368188c78e92661fdf2d96ce166b225d0dc6c1c3e322ef62ef';
    expect(pubkeyToPayment(publicKey)).toMatchInlineSnapshot(`
      Object {
        "address": "kaspa:qrdga25hhaz9wd5p3rrcaynxrl0jm9kwze4jyhgdcmqu8cezaa3w7xh9a3xd9",
        "outScript": Object {
          "data": Array [
            32,
            218,
            142,
            170,
            151,
            191,
            68,
            87,
            54,
            129,
            136,
            199,
            142,
            146,
            102,
            31,
            223,
            45,
            150,
            206,
            22,
            107,
            34,
            93,
            13,
            198,
            193,
            195,
            227,
            34,
            239,
            98,
            239,
            172,
          ],
          "type": "Buffer",
        },
      }
    `);
  });

  it('Test decodeAddress throws error if address is different between decodeAddress and getAddressByPublicKey', () => {
    try {
      const address = 'kaspa:qyp2d6tctf8wkahskz4hv3xpe3llknrc3jl66798elnjvr2gewzrdggx6fnfh3y';
      decodeAddress(address);
      fail('Expected error to be thrown');
    } catch (error) {
      expect(error).toMatchInlineSnapshot(
        `[Error: error function: decodeAddress, message: Wrong public key from address: kaspa:qyp2d6tctf8wkahskz4hv3xpe3llknrc3jl66798elnjvr2gewzrdggx6fnfh3y]`
      );
    }
  });
});
