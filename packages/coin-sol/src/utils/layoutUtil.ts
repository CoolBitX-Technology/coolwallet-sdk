import * as BufferLayout from '@solana/buffer-layout';

interface InstructionInputData {
  readonly instruction: number;
}

type InstructionLayoutType<TInputData extends InstructionInputData> = {
  index: number;
  layout: BufferLayout.Layout<TInputData>;
};

type SystemInstructionInputData = {
  CreateWithSeed: InstructionInputData & {
    base: Uint8Array;
    lamports: number;
    programId: Uint8Array;
    seed: string;
    space: number;
  };
  Transfer: InstructionInputData & {
    lamports: number;
  };
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
 * Layout for a PublicKey type
 */
const publicKey = (property: string = 'publicKey') => {
  return BufferLayout.blob(32, property);
};
/**
 * Layout for a Rust String type
 */
const rustString = (property: string = 'string'): BufferLayout.Layout<string> => {
  const rsl = BufferLayout.struct<
    Readonly<{
      length?: number;
      lengthPadding?: number;
      chars: Uint8Array;
    }>
  >(
    [
      BufferLayout.u32('length'),
      BufferLayout.u32('lengthPadding'),
      BufferLayout.blob(BufferLayout.offset(BufferLayout.u32(), -8), 'chars'),
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

export const SystemProgramLayout = {
  Transfer: {
    index: 2,
    layout: BufferLayout.struct<SystemInstructionInputData['Transfer']>([
      BufferLayout.u32('instruction'),
      BufferLayout.ns64('lamports'),
    ]),
  },
  createWithSeed: {
    index: 3,
    layout: BufferLayout.struct<SystemInstructionInputData['CreateWithSeed']>([
      BufferLayout.u32('instruction'),
      publicKey('base'),
      rustString('seed'),
      BufferLayout.ns64('lamports'),
      BufferLayout.ns64('space'),
      publicKey('programId'),
    ]),
  },
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

export function encodeData<TInputData extends InstructionInputData>(
  layoutType: InstructionLayoutType<TInputData>,
  fields?: any
): Buffer {
  const allocLength = layoutType.layout.span >= 0 ? layoutType.layout.span : getAlloc(layoutType, fields);
  const data = Buffer.alloc(allocLength);
  const layoutFields = Object.assign({ instruction: layoutType.index }, fields);
  layoutType.layout.encode(layoutFields, data);
  return data;
}
