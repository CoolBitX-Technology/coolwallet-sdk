import { core } from '@coolwallets/core'
import { genSignBuf, genSignedTxV1 } from './eos_utils';
import crypto from 'crypto';
import BigInteger from 'bigi';

type Transport = import('@coolwallets/transport').default
type Transaction = import('./types').Transaction


const base58 = require('bs58');
const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');


/**
 * sign EOS transfer (1 transfer action)
 */
export const signTransfer = async (
  transport:Transport,
  appId:string,
  appPrivateKey:string,
  coinType:string, 
  txObject: Transaction, 
  addressIndex:number, 
  chain_id: string, 
  publicKey: string,
  confirmCB: Function | undefined = undefined,
  authorizedCB: Function | undefined = undefined,
  ) => {
  
    const keyId = core.util.addressIndexToKeyId(coinType, addressIndex)
    const signBuf = genSignBuf(txObject, chain_id);
    const dataForSE = core.flow.prepareSEData(keyId, signBuf, coinType)
    const canonical_signature = await core.flow.sendDataToCoolWallet(
      transport,
      appId,
      appPrivateKey,
      dataForSE,
      '00',
      '00',
      false,
      undefined,
      confirmCB,
      authorizedCB,
      true
    );

    const signature = convertToSignature(canonical_signature, signBuf, publicKey);
    const signedTransaction = genSignedTxV1(txObject, signature);
    return signedTransaction;
  
};


/**
 * decrypt dignature from cws, convert to EOS signature.
 */
const convertToSignature = (signature:any, signBuf:Buffer, publicKey:string) => { 
    let ecQ  = ec.keyFromPublic(publicKey, 'hex').pub;
    let i = ec.getKeyRecoveryParam(sha256(signBuf), signature, ecQ);
    return combineSignature(signature.r, signature.s, i+31);
 }

/**
 * @param {string} r 
 * @param {string} s 
 * @param {number} i
 * @return {String} EOS K1 Signature
 */
const combineSignature = (r:string, s:string, i:number) => {
    const buf = Buffer.alloc(65);
    buf.writeUInt8(i, 0);
    BigInteger.fromHex(r).toBuffer(32).copy(buf, 1);
    BigInteger.fromHex(s).toBuffer(32).copy(buf, 33);

    const keyType = 'K1';
    const check = [buf];
    check.push(Buffer.from(keyType));

    var _checksum = ripemd160(Buffer.concat(check)).slice(0, 4);
    var encode = base58.encode(Buffer.concat([buf, _checksum]));
    return 'SIG_K1_' + encode;
}

function ripemd160(data:Buffer):Buffer {
    return crypto.createHash('rmd160').update(data).digest();
}

function sha256(data:Buffer):Buffer {
    return crypto.createHash('sha256').update(data).digest()
}