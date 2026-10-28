import { CardType } from '../../transport';

type MsgTable = Record<string, string>;

/**
 * Pro SE 347 and Go SE 101 renumbered their custom status words into one shared table, and some old
 * values now carry a different meaning (e.g. 6A01), so the message depends on the card version.
 */
export const PRO_RENUMBERED_ERROR_SE_VERSION = 347;
export const GO_RENUMBERED_ERROR_SE_VERSION = 101;

// ISO 7816-4 / common status words, unchanged across SE versions.
const COMMON_MSG: MsgTable = {
  _9000: 'success',
  _9999: 'unknow error',
  _6E00: 'cls not supported',
  _6D00: 'ins not supported',
  _6982: 'security statusCode not satisfied',
  _6F00: 'unknown error',
  _6700: 'wrong length',
  _6A86: 'incorrect p1 & p2',
  _6884: 'command chaining not supported',
  _6881: 'logical channel not suppoered',
  _6985: 'conditions not satisfied',
  _6A84: 'file full',
  _6100: 'bytes remaining 00',
  _6A80: 'wrong data',
  _6A82: 'file not found',
  _6984: 'data invalid',
  _6A88: 'applet is not exits',
};

// Custom status words of Pro SE <= 346 and Go SE <= 100.
const LEGACY_MSG: MsgTable = {
  _6201: 'incorrect fixed string',
  _6202: 'incorrect fixed string',
  _6203: 'fixed data needs to be zero',
  _6204: 'incorrect fixed string',
  _6205: 'data out of range',
  _6296: 'command no need secire channel',
  _6298: 'command need encryption',
  _6297: 'command need signature',
  _609C: 'the total length of the inspected data is lower than the signature (the signature is not placed?)',
  _609F: 'need effective nonce or unsupported packaging version of the card',
  _609D: 'appid need registered',
  _609E: 'check signature main function is failed',
  _6BAC: '',
  _6ED1: 'the data decrypted an incorrect result (PKCS5 check failed, the key may be wrong)',
  _6D60: 'path uses unsupported scheme in Bip32.java',
  _6D61: 'sign type is incorrect in Bip32.java',
  _6D62: 'path length is incorrect in Bip32Ed25519.java',
  _6D63: 'path length is incorrect in Bip32.java',
  _6D64: 'seed has not been initialized in Bip32Ed25519.java',
  _6D65: 'path uses unsupported scheme in Bip32.java',
  _6D66: 'unsupported signature algorithm in Bip32Ed25519.java',
  _6D67: 'path uses unsupported scheme in KeyManager.java',
  _6D68: 'path is not standard in KeyManager.java',
  _6D6C: 'the path of SLIP0010 contains non-harden index in Bip32.java',
  _6D6E: 'the required master key does not exist',
  _6091: 'data order is wrong',
  _6092: 'hash error',
  _609A: 'packaging version of the card not supported',
  _6032: 'this version does not support 8032 instructions',
  _6ACC: 'script signature verification failed',
  _6ACA: 'unsupported script version',
  _6A0D: 'the argument as a switch parameter is out of range',
  _6A74: 'argument as a string contains abnormal characters',
  _6A71: 'transaction amount exceeds display limit',
  _6A72: 'transaction amount exceeds display limit',
  _6AE2: 'called the script command to throw out the error',
  _6A01: 'unsupported script command',
  _6A0B: 'path is too short',
  _6A0C: 'coin type of path not meet the script limit',
  _6A03: 'unsupported parameters appear in the script (the script content is incorrect)',
  _6A07: 'unsupported parameters appear in the script (the script content is incorrect)',
  _6A08: 'unsupported parameters appear in the script (the script content is incorrect)',
  _6A0A: 'unsupported parameters appear in the script (the script content is incorrect)',
  _6B03: 'exceed the upper limit when converting digital format',
  _6B04: 'input too long when converting digital format',
  _6B01: 'enter unexpected numbers when converting digital formats',
  _6B85: 'unexpected parameters when converting digital format(wrong script content)',
  _6AC0: 'need execute 80A2',
  _6AC2: 'p1 and script type not match',
  _6AC7: 'p1 not supported',
  _6AC5: 'script type not supported (only support P2PKH=00 P2SH=01)',
  _6B0C: 'could not get pair password when card is not registered',
  _6B0D: 'could not get pair password when card is freezed',
};

// Custom status words of Pro SE >= 347 and Go SE >= 101, from coolwallet-pro-se ErrorMessage.java and
// CryptoError.java. Go SE uses a subset of them (no script, message pack or RLP codes; the pair password
// codes need Go SE >= 102).
const RENUMBERED_MSG: MsgTable = {
  // 690x command auth
  _6901: 'command data is shorter than appId and signature',
  _6902: 'nonce has not been activated',
  _6903: 'appid need registered',
  _6904: 'command signature verification failed',
  // 691x device
  _6910: 'pin is too long',
  _6911: 'device index out of range',
  _6912: 'no current device',
  _6913: 'card is not paired with any device',
  _6914: 'pairing is locked by changePairingStatus or after too many wrong passwords',
  _6915: 'old pair password is wrong',
  _6916: 'new pair password format is invalid',
  _6917: 'new pair password is the same as the old one',
  _6918: 'register data backup is pending; recover or reset it before changing the pair password',
  // 692x backup
  _6920: 'backup data contains an unknown key type',
  // 6A0x script loading
  _6A01: 'script signature verification failed',
  _6A02: 'script header is too short',
  _6A03: 'unsupported script version',
  _6A04: 'unsupported script command',
  _6A05: 'called the script command to throw out the error',
  // 6A1x script arguments
  _6A10: 'unsupported data source in the script (the script content is incorrect)',
  _6A11: 'unsupported integer source in the script (the script content is incorrect)',
  _6A12: 'unsupported charset in the script (the script content is incorrect)',
  _6A13: 'the argument as a switch parameter is out of range',
  _6A14: 'buffer int length is neither 1 nor 2',
  _6A15: 'unsupported signature verification mode',
  _6A16: 'wrap page argument is out of range',
  // 6A2x hash / checksum types
  _6A20: 'unsupported hash type',
  _6A21: 'unsupported update hash type',
  _6A22: 'unsupported personal hash type',
  _6A23: 'unsupported checksum type',
  _6A24: 'unsupported tagged hash type',
  // 6A3x data format
  _6A30: 'argument as a string contains abnormal characters',
  _6A31: 'transaction amount with odd digits has a non-zero leading nibble',
  _6A32: 'transaction amount exceeds display limit',
  _6A33: 'unsupported protobuf wire type',
  _6A34: 'placeholder data length is neither 0 nor 4',
  _6A35: 'bit array length is not a multiple of 8',
  _6A36: 'unsupported message pack type',
  _6A37: 'message pack element is used outside of an array',
  // 6A4x array stack
  _6A40: 'array nesting is too deep',
  _6A41: 'array end without a matching array start',
  _6A42: 'array length is negative',
  // 6A9x signing state
  _6A90: 'need execute script before signing',
  _6A91: 'path is too short',
  _6A92: 'coin type of path not meet the script limit',
  _6A93: 'remaining data type does not match the utxo sign type',
  _6A94: 'unsupported utxo sign type',
  _6A95: 'unsupported utxo script type',
  // 6B0x number conversion
  _6B01: 'enter unexpected numbers when converting digital formats',
  _6B02: 'input too long when converting digital format',
  _6B03: 'exceed the upper limit when converting digital format',
  _6B04: 'left justify requires charset 256 to 32 (wrong script content)',
  // 6B1x message pack
  _6B10: 'message pack integer is too long',
  _6B11: 'message pack string is too long',
  _6B12: 'message pack boolean length is invalid',
  _6B13: 'message pack binary is too long',
  _6B14: 'message pack array is too long',
  _6B15: 'message pack map is too long',
  _6B16: 'unsupported message pack type',
  // 6D0x Blake2b
  _6D01: 'blake2b key is too long',
  _6D02: 'blake2b personalization is too long',
  // 6D1x Bip32
  _6D10: 'path uses unsupported scheme when getting derived public key in Bip32.java',
  _6D11: 'sign type is incorrect in Bip32.java',
  _6D12: 'path length is incorrect in Bip32.java',
  _6D13: 'path uses unsupported scheme when deriving key in Bip32.java',
  _6D14: 'the path of SLIP0010 contains non-harden index in Bip32.java',
  _6D15: 'parent public key length is incorrect in Bip32.java',
  _6D16: 'hardened index cannot be derived from a public key in Bip32.java',
  // 6D2x Bip32Ed25519
  _6D20: 'path length is incorrect in Bip32Ed25519.java',
  _6D21: 'master key has not been initialized in Bip32Ed25519.java',
  _6D22: 'unsupported signature algorithm in Bip32Ed25519.java',
  // 6D3x KeyManager
  _6D30: 'sign type is incorrect in KeyManager.java',
  _6D31: 'path uses unsupported scheme in KeyManager.java',
  // 6D4x KeyGenerate
  _6D40: 'invalid card type when generating key',
  _6D41: 'invalid key type when generating key',
  // 6D5x EcdhUtil
  _6D50: 'the data decrypted an incorrect result (ECDH decryption failed)',
  // 6E1x RLP parser
  _6E10: 'rlp child element has an invalid prefix',
  _6E11: 'rlp path index is out of the short list range',
  _6E12: 'rlp long list length exceeds the input data',
  _6E14: 'rlp path index is out of the long list range',
  _6E15: 'rlp path goes through an element that is not a list',
  _6E16: 'rlp element length is too large',
  _6E17: 'rlp final element has an invalid prefix',
  // 6F0x uncaught CryptoException (0x6F00 | reason)
  _6F01: 'crypto exception: illegal value',
  _6F02: 'crypto exception: uninitialized key',
  _6F03: 'crypto exception: no such algorithm',
  _6F04: 'crypto exception: invalid init',
  _6F05: 'crypto exception: illegal use',
  // 6F1x-6F5x internal state
  _6F10: 'flow counter does not match the expected step',
  _6F30: 'card info state is corrupted',
  _6F40: 'invalid workspace',
  _6F41: 'workspace is not assigned',
  _6F42: 'apdu workspace is not released',
  _6F50: 'apdu data offset is invalid',
};

// CardType is read at call time, not at load time, because transport is in core's import cycle.
export const isRenumberedErrorCard = (cardType?: CardType, seVersion?: number): boolean => {
  if (seVersion === undefined) return false;
  if (cardType === CardType.Pro) return seVersion >= PRO_RENUMBERED_ERROR_SE_VERSION;
  if (cardType === CardType.Go) return seVersion >= GO_RENUMBERED_ERROR_SE_VERSION;
  return false;
};

// Whether the message of this status word is the same on every SE version, so no version is needed to read it.
export const isVersionIndependentCode = (code: string): boolean => COMMON_MSG[`_${code}`] !== undefined;

export const getMsg = (code: string, cardType?: CardType, seVersion?: number): string | undefined => {
  const key = `_${code}`;
  const versionMsg = isRenumberedErrorCard(cardType, seVersion) ? RENUMBERED_MSG : LEGACY_MSG;
  return COMMON_MSG[key] ?? versionMsg[key];
};
