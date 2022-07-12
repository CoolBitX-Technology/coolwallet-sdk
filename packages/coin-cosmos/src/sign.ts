import { apdu, tx, error } from '@coolwallet/core';
import { THOR } from './chain';
import { ChainProps } from './chain/base';
import { Msg } from './proto/msg';
import { Tx } from './proto/tx';
import { getProtoCoin } from './utils/coin';
import { convertSESignatureToDER } from './utils/signature';
import type { Mandatory } from './types';

async function signTransaction(
  params: Mandatory<Record<string, unknown>>,
  chain: ChainProps,
  messages: Msg[],
  public_key: string,
  script: string,
  argument: string
): Promise<string> {
  const { transport, appId, appPrivateKey, transaction } = params;
  let fee_amount = [getProtoCoin(chain, transaction.fee.denom, transaction.fee.amount)];
  //  ThorChain does not have fee.amount<Coin>.
  if (chain.isChainId(THOR.getChainId())) {
    fee_amount = [];
  }

  const preActions = [() => apdu.tx.sendScript(transport, script)];
  const action = () => apdu.tx.executeScript(transport, appId, appPrivateKey, argument);

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    params.confirmCB,
    params.authorizedCB,
    true
  );

  if (!Buffer.isBuffer(canonicalSignature)) {
    const signature = convertSESignatureToDER(canonicalSignature);
    const signedTx = new Tx(
      messages,
      public_key,
      +transaction.sequence,
      transaction.fee.gas_limit,
      fee_amount,
      transaction.memo,
      signature
    );
    return Buffer.from(signedTx.toBytes()).toString('hex');
  } else {
    throw new error.SDKError(signTransaction.name, 'canonicalSignature type error');
  }
}

export { signTransaction };
