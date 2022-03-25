import { apdu, Transport, crypto, config, utils } from '@coolwallet/core';

type Mandatory = {
  appPrivateKey: string;
  appPublicKey: string;
  appId: string;
  SEPublicKey: string;
};

async function initialize(transport: Transport, mnemonic: string): Promise<Mandatory> {
  await apdu.general.resetCard(transport);
  const keyPair = crypto.key.generateKeyPair();
  const appPrivateKey = keyPair.privateKey;
  const appPublicKey = keyPair.publicKey;
  const name = 'testEVM';
  const password = '12345678';
  const SEPublicKey = await config.getSEPublicKey(transport);
  const appId = await apdu.pair.register(transport, appPublicKey, password, name, SEPublicKey);
  await utils.createWalletByMnemonic(transport, appId, appPrivateKey, mnemonic, SEPublicKey);

  return {
    appPrivateKey,
    appPublicKey,
    appId,
    SEPublicKey,
  };
}

export { initialize };
