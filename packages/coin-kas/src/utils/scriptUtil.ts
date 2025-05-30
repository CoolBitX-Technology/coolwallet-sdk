import { tx, Transport, utils } from '@coolwallet/core';
import { PathType } from '@coolwallet/core/lib/config';
import { Transaction } from '../transaction';
import { getUtxoArgumentBuffer } from './hash';
import { Callback, TransactionSigningHashKey } from '../config/types';

export function getSEPath(addressIndex: number): string {
  const pathLength = '15';
  const path = utils.getFullPath({ pathString: `44'/111111'/${addressIndex}'`, pathType: PathType.SLIP0010 });
  const SEPath = `${pathLength}${path}`;
  return SEPath;
}

export function getSigningPreActions(
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  script: string,
  inputArgument: string
): {
  preActions: Array<Callback>;
} {
  const argument = '00' + inputArgument; // 一般會塞 sePath 判斷簽法，00 表示不導 Key就不會簽
  console.debug('argument: ', argument);

  const preActions = [];
  const sendScript = async () => {
    await tx.command.sendScript(transport, script);
  };
  preActions.push(sendScript);

  const sendArgument = async () => {
    await tx.command.executeScript(transport, appId, appPrivateKey, argument);
  };
  preActions.push(sendArgument);

  return { preActions };
}

export async function getSigningActions(
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  transaction: Transaction
): Promise<{
  actions: Array<Callback>;
}> {
  const utxoArguments = transaction.inputs.map(async (input, index) => {
    const utxo = transaction.utxos[index];
    const utxoArgumentBuf = await getUtxoArgumentBuffer(input, utxo);
    return utxoArgumentBuf.toString('hex');
  });
  const actions = utxoArguments.map((utxoArgument) => async () => {
    return tx.command.executeUtxoSegmentScript(
      transport,
      appId,
      appPrivateKey,
      await utxoArgument,
      TransactionSigningHashKey.toString('hex')
    );
  });
  return { actions };
}
