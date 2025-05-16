import { CardType, config, tx, utils } from '..';
import { SignatureType } from '../transaction';
import { ECDSA } from './config/params';
import { SignTxHashData, SignTxHashResult } from './config/types';

export async function signECDSA(coinType: string, signTxHashData: SignTxHashData): Promise<SignTxHashResult> {
  const {
    transport,
    addressIndex,
    purpose = 44,
    depth = 5,
    pathType = config.PathType.BIP32,
    txHash,
    appId,
    appPrivateKey,
    signatureType = SignatureType.Canonical,
    confirmCB,
    authorizedCB,
  } = signTxHashData;

  if (transport.cardType !== CardType.Go) {
    throw new Error(`signECDSA >>> not support card type: ${transport.cardType}`);
  }

  const script = ECDSA.script + ECDSA.signature;
  const path = await utils.getPath(coinType, addressIndex, depth, pathType, purpose);
  const pathByteLength = (path.length / 2).toString(16).padStart(2, '0');
  const argument = pathByteLength + path + txHash;

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
