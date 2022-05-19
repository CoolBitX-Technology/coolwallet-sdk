import * as BufferLayout from '@solana/buffer-layout';
import { InstructionInputData, InstructionLayoutType } from './programLayout';

/**
 * Layout for a PublicKey type
 */
const publicKey = (property = 'publicKey') => {
  return BufferLayout.blob(32, property);
};

/**
 * Layout for an Authorized object
 */
const authorized = (property = 'authorized') => {
  return BufferLayout.struct<
    Readonly<{
      staker: Uint8Array;
      withdrawer: Uint8Array;
    }>
  >([publicKey('staker'), publicKey('withdrawer')], property);
};

/**
 * Layout for a Lockup object
 */
const lockup = (property = 'lockup') => {
  return BufferLayout.struct<
    Readonly<{
      custodian: Uint8Array;
      epoch: number;
      unixTimestamp: number;
    }>
  >([BufferLayout.ns64('unixTimestamp'), BufferLayout.ns64('epoch'), publicKey('custodian')], property);
};

interface IRustStringShim
  extends Omit<
    BufferLayout.Structure<
      Readonly<{
        length: number;
        lengthPadding: number;
        chars: Uint8Array;
      }>
    >,
    'decode' | 'encode' | 'replicate'
  > {
  alloc: (str: string) => number;
  decode: (b: Uint8Array, offset?: number) => string;
  encode: (str: string, b: Uint8Array, offset?: number) => number;
  replicate: (property: string) => this;
}

/**
 * Layout for a Rust String type
 */
const rustString = (property = 'string'): BufferLayout.Layout<string> => {
  const rsl = BufferLayout.struct<
    Readonly<{
      length?: number;
      lengthPadding?: number;
      chars: Uint8Array;
    }>
  >(
    [
      BufferLayout.u32('length'), // 4
      BufferLayout.u32('lengthPadding'), // 4
      BufferLayout.blob(BufferLayout.offset(BufferLayout.u32(), -8), 'chars'), // data length
    ],
    property
  );
  const _decode = rsl.decode.bind(rsl);
  const _encode = rsl.encode.bind(rsl);

  const rslShim = rsl as unknown as IRustStringShim;

  rslShim.decode = (b: Uint8Array, offset?: number) => {
    const data = _decode(b, offset);
    return data['chars'].toString();
  };

  rslShim.encode = (str: string, b: Uint8Array, offset?: number) => {
    const data = {
      chars: Buffer.from(str, 'utf8'),
    };
    return _encode(data, b, offset);
  };

  rslShim.alloc = (str: string) => {
    return BufferLayout.u32().span + BufferLayout.u32().span + Buffer.from(str, 'utf8').length;
  };

  return rslShim;
};

function getAlloc(type: any, fields: any): number {
  let alloc = 0;
  type.layout.fields.forEach((item: any) => {
    if (item.span >= 0) {
      alloc += item.span;
    } else if (typeof item.alloc === 'function') {
      alloc += item.alloc(fields[item.property]);
    }
  });
  return alloc;
}

function encodeData<T extends InstructionInputData>(layoutType: InstructionLayoutType<T>, fields?: any): Buffer {
  const allocLength = layoutType.layout.span >= 0 ? layoutType.layout.span : getAlloc(layoutType, fields);
  const data = Buffer.alloc(allocLength);
  const layoutFields = Object.assign({ instruction: layoutType.index }, fields);
  layoutType.layout.encode(layoutFields, data);
  return data;
}

export { publicKey, authorized, lockup, rustString, encodeData };
