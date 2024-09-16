import { Transport, config, utils, crypto, common, setting, wallet, tx, CardType, info } from '@coolwallet/core';

type Mandatory = {
  appPrivateKey: string;
  appPublicKey: string;
  name: string;
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
  if (transport.cardType === CardType.Pro) {
    await setting.card.toggleDisplayAddress(transport, appId, appPrivateKey, true);
  }

  return {
    appPrivateKey,
    appPublicKey,
    name,
    appId,
    SEPublicKey,
  };
}

async function getTxDetail(transport: Transport, appId: string): Promise<string> {
  if (transport.cardType === CardType.Lite) {
    return '';
  }
  await common.hi(transport, appId);
  await tx.command.finishPrepare(transport);
  return tx.command.getExplicitTxDetail(transport);
}

export { initialize, getTxDetail };
