import { apdu, Transport, config, utils, crypto } from '@coolwallet/core';

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
  await apdu.info.toggleDisplayAddress(transport, appId, appPrivateKey, true);

  return {
    appPrivateKey,
    appPublicKey,
    appId,
    SEPublicKey,
  };
}

async function getTxDetail(transport: Transport, appId: string): Promise<string> {
  await apdu.general.hi(transport, appId);
  await apdu.tx.finishPrepare(transport);
  return apdu.tx.getExplicitTxDetail(transport);
}

export { initialize, getTxDetail };
