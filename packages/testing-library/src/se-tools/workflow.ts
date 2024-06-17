import { Transport, config, utils, crypto, common, setting, wallet, tx } from '@coolwallet/core';

type Mandatory = {
  appPrivateKey: string;
  appPublicKey: string;
  appId: string;
  SEPublicKey: string;
};

async function initialize(transport: Transport, mnemonic: string): Promise<Mandatory> {
  await setting.card.resetCard(transport);
  const keyPair = crypto.key.generateKeyPair();
  const appPrivateKey = keyPair.privateKey;
  const appPublicKey = keyPair.publicKey;
  const name = 'testEVM';
  const password = '12345678';
  const SEPublicKey = await config.getSEPublicKey(transport);
  const appId = await wallet.client.register(transport, appPublicKey, password, name, SEPublicKey);
  await utils.createWalletByMnemonic(transport, appId, appPrivateKey, mnemonic, SEPublicKey);
  await setting.card.toggleDisplayAddress(transport, appId, appPrivateKey, true);

  return {
    appPrivateKey,
    appPublicKey,
    appId,
    SEPublicKey,
  };
}

async function getTxDetail(transport: Transport, appId: string): Promise<string> {
  await common.hi(transport, appId);
  await tx.command.finishPrepare(transport);
  return tx.command.getExplicitTxDetail(transport);
}

export { initialize, getTxDetail };
