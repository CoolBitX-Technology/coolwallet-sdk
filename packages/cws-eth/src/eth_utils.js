import Web3 from 'web3';
import elliptic from 'elliptic';
import { DataTooLong } from '@coolwallets/errors';
import { core, apdu } from '@coolwallets/core';

const rlp = require('rlp');

const web3 = new Web3();
// eslint-disable-next-line new-cap
const ec = new elliptic.ec('secp256k1');


const evenHexDigit = (hex) => (hex.length % 2 !== 0 ? `0${hex}` : hex);

export const removeHex0x = (hex) => (hex.slice(0, 2) === '0x' ? hex.slice(2) : hex);

export const handleHex = (hex) => evenHexDigit(removeHex0x(hex));

/**
 * Get raw payload
 * @param {{nonce:string, gasPrice:string, gasLimit:string, to:string,
 * value:string, data:string, chainId: number}} transaction
 * @return {Array<Buffer>}
 */
export const getRawHex = (transaction) => {
  const fields = ['nonce', 'gasPrice', 'gasLimit', 'to', 'value', 'data'];
  const raw = fields.map((field) => {
    const hex = handleHex(transaction[field]);
    if (hex === '00' || hex === '') {
      return Buffer.allocUnsafe(0);
    }
    return Buffer.from(hex, 'hex');
  });
  raw[6] = Buffer.from([transaction.chainId]);
  raw[7] = Buffer.allocUnsafe(0);
  raw[8] = Buffer.allocUnsafe(0);

  const t = rlp.encode(raw);
  if (t.length > 870) throw new DataTooLong();
  return raw;
};

/**
 *
 * @param {Transport} transport
 * @param {{nonce:string, gasPrice:string, gasLimit:string, to:string,
 * value:string, data:string}} transaction
 */
export const getReadTypeAndParmas = async (transport, transaction) => {
  const P1 = '00';
  const P2 = '00';

  // const to = handleHex(transaction.to.toString('hex'))
  const data = handleHex(transaction.data.toString('hex'));

  // transfer ETH
  if (data === '' || data === '00') return { P1, P2, readType: '3C' };

  // if (token.isSupportedERC20Transaction(data) && erc20Info) {
  //   const preActionPayload = token.getSetTokenPayload(to, erc20Info.symbol, erc20Info.decimals)
  //   const preAction = token.getSetTokenPreAction(transport, false, preActionPayload)
  //   return { P1, P2, readType: 'C2', preAction }
  // }

  // smart contract
  await core.auth.versionCheck(transport, 84);
  return { P1, P2, readType: '33' };
};

/**
 * 
 * @param {number} addressIndex 
 * @param {*} transaction 
 */
export const getScriptAndArguments = async (addressIndex, transaction) => {
  // 15 32 8000002C 8000003C 80000000 00000000 00000000
  const SEPath = '1532' + '8000002C' + '8000003C' + '80000000' + '00000000' 
                  + '00' + addressIndex.toString(16).padStart(6,'0')
                  
  // // Got from path
  // const postfix = path.split('/').map(index => {
  //   let harden = index.contains("'")
  //   if (harden) index = index.replace("'","")
  //   let hex = parseInt(index).toString(16).padStart(6, '0')
  //   return harden
  //     ? '80' + hex
  //     : '00' + hex
  // }).join()
  // const SEPath = '1532' + postfix

  console.log(`got sepath ${SEPath}`)

  const script = scripts.TRANSFER;
  const argument = handleHex(transaction.to)                              // 81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C
    + handleHex(transaction.value).padStart(20, '0')                      // 000000b1a2bc2ec50000
    + handleHex(transaction.gasPrice).padStart(20, '0')                   // 0000000000020c855800
    + handleHex(transaction.gasLimit).padStart(20, '0')                   // 0000000000000000520c
    + handleHex(transaction.nonce).padStart(20, '0')                      // 00000000000000000289
    + handleHex(transaction.chainId.toString(16)).padStart(4, '0');       // 0001

  console.log(`sciprt:\t${script}`)
  console.log(`argument:\t ${SEPath} + ${argument}`)
  return { 
    script, 
    argument: SEPath + argument
  }
} 

/**
 * @description Compose Signed Transaction
 * @param {Array<Buffer>} payload
 * @param {Number} v
 * @param {String} r
 * @param {String} s
 * @param {number} chainId
 * @return {String}
 */
export const composeSignedTransacton = (payload, v, r, s, chainId) => {
  const vValue = v + chainId * 2 + 8;

  const transaction = payload.slice(0, 6);

  transaction.push(Buffer.from([vValue]), Buffer.from(r, 'hex'), Buffer.from(s, 'hex'));

  const serializedTx = rlp.encode(transaction);
  return `0x${serializedTx.toString('hex')}`;
};

/**
 * @description Generate Canonical Signature from Der Signature
 * @param {{r:string, s:string}} canonicalSignature
 * @param {Buffer} payload
 * @param {String} compressedPubkey hex string
 * @return {Promise<{v: Number, r: String, s: String}>}
 */
export const genEthSigFromSESig = async (canonicalSignature, payload, compressedPubkey) => {
  const hash = web3.utils.keccak256(payload);
  const data = Buffer.from(handleHex(hash), 'hex');
  const keyPair = ec.keyFromPublic(compressedPubkey, 'hex');

  // get v
  const recoveryParam = ec.getKeyRecoveryParam(data, canonicalSignature, keyPair.pub);
  const v = recoveryParam + 27;
  const { r } = canonicalSignature;
  const { s } = canonicalSignature;

  return { v, r, s };
};

/**
 * @description APDU Send Raw Data for Segregated Signature
 * @param {Transport} transport
 * @param {Buffer} msgBuf
 * @param {String} p1
 * @return {Function}
 */
export const apduForParsingMessage = (transport, msgBuf, p1) => {
  let rawData = msgBuf.toString('hex');
  rawData = handleHex(rawData);
  const patch = Math.ceil(rawData.length / 500);
  // if (patch > 1) return; // To Do : if card support patch, remove this line
  return async () => {
    for (let i = 0; i < patch; i++) {
      const patchData = rawData.substr(i * 500, 500);
      const p2 = patch === 1 ? '00' : (i === patch - 1 ? '8' : '0') + (i + 1);
      // eslint-disable-next-line no-await-in-loop
      await apdu.tx.prepTx(transport, patchData, p1, p2);
    }
  };
};

/**
 * @description get APDU set token function
 * @param {String} address
 * @return {Function}
 */
// export const apduSetToken = (contractAddress, symbol, decimals, sn = 1) => async () => {
//   const setTokenPayload = token.getSetTokenPayload(contractAddress, symbol, decimals);
//   await apdu.tx.setCustomToken(setTokenPayload, sn);
// };

/**
 * @description Trim Hex for Address
 * @param {string} hexString expect 32 bytes address in topics
 * @return {string} 20 bytes address + "0x" prefixed
 */
function trimFirst12Bytes(hexString) {
  return '0x'.concat(hexString.substr(hexString.length - 40));
}

/**
 * Convert public key to address
 * @param {string} compressedPubkey
 * @return {string}
 */
export function pubKeyToAddress(compressedPubkey) {
  const keyPair = ec.keyFromPublic(compressedPubkey, 'hex');
  const pubkey = `0x${keyPair.getPublic(false, 'hex').substr(2)}`;
  const address = trimFirst12Bytes(web3.utils.keccak256(pubkey));
  return web3.utils.toChecksumAddress(address);
}
