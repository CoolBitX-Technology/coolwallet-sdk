import { CardType, config, tx, utils } from '..';
import { ECDSA } from './config/params';
import { SignTxData, SignTxResult } from './config/types';

export async function signECDSA(signTxData: SignTxData): Promise<SignTxResult> {
  const {
    transport,
    coinType,
    addressIndex,
    depth = 5,
    pathType = config.PathType.BIP32,
    message,
    appId,
    appPrivateKey,
    signatureType,
    confirmCB,
    authorizedCB,
  } = signTxData;

  if (transport.cardType !== CardType.Go) {
    throw new Error(`signECDSA >>> not support card type: ${transport.cardType}`);
  }

  const script = ECDSA.script + ECDSA.signature;
  const path = await utils.getPath(coinType, addressIndex, depth, pathType);
  const pathByteLength = (path.length / 2).toString(16).padStart(2, '0');
  const argument = pathByteLength + path + message;

  const preActions = [];
  const sendScript = async () => {
    await tx.command.sendScript(transport, script);
  };
  preActions.push(sendScript);

  const sendArgument = async () => {
    return tx.command.executeScript(transport, appId, appPrivateKey, argument);
  };

  return await tx.flow.getSingleSignatureFromCoolWalletV2(
    transport,
    preActions,
    sendArgument,
    signatureType,
    confirmCB,
    authorizedCB
  );
}
