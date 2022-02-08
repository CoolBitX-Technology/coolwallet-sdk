import JRETransport from '../src';
import { apdu } from '@coolwallet/core';

const transport = new JRETransport('http://localhost:8080');

test('Test getSEPublicKey', async () => {
  const result = await apdu.general.getSEVersion(transport);
  expect(result).toBe(320);
});
