import {bech32} from 'bech32';
import * as cryptoUtil from './cryptoUtil'

export function publicKeyToAddress(publicKey: string, prefix = "terra") {
    const publicKeyBuf = Buffer.from(publicKey, 'hex')
    const sha256Hash = cryptoUtil.sha256(publicKeyBuf);
    const ripemd160hash = cryptoUtil.ripemd160(sha256Hash)
    const words = bech32.toWords(ripemd160hash);
    return bech32.encode(prefix, words);
}