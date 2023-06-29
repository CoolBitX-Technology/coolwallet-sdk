import crypto from 'node:crypto';
import * as bitcoin from 'bitcoinjs-lib';
import { ECPairAPI } from 'ecpair';

type UtxoInput = {
  txHash: string;
  txIndex: number;
  value: number;
  sequence: number;
  addressIndex: number;
};

function calculateSegwitFee(ecpair: ECPairAPI, inputs: UtxoInput[], network: bitcoin.Network): number {
  const keyPair = ecpair.fromPrivateKey(crypto.randomBytes(32));
  const publicKey = keyPair.publicKey;

  const payment = bitcoin.payments.p2sh({
    redeem: bitcoin.payments.p2wpkh({
      pubkey: publicKey,
      network,
    }),
    network,
  });

  const psbt = new bitcoin.Psbt();
  psbt.setVersion(2);
  psbt.setLocktime(0);
  psbt.addInputs(
    inputs.map((i) => ({
      hash: i.txHash,
      index: i.txIndex,
      sequence: i.sequence,
      witnessUtxo: {
        script: payment.output!,
        value: i.value,
      },
      redeemScript: payment.redeem?.output,
    }))
  );
  psbt.signAllInputs(keyPair);
  psbt.finalizeAllInputs();
  const size = psbt.extractTransaction().virtualSize();

  return size * 25;
}

export { calculateSegwitFee, UtxoInput };
