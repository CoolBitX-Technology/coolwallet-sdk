import * as types from '../config/types';

export const keyLength: number = 16; // 8 Bytes
export const booleanLength: number = 2; // 1 Byte
export const numberLength: number = 16; // 8 Bytes
export const bufferLength: number = 64; // 32 Bytes

export const transactionFields: types.FieldType = {
    aamt: { type: 'Number', padding: numberLength },
    aclose: { type: 'Buffer', padding: bufferLength },
    afrz: { type: 'Boolean', padding: booleanLength },
    amt: { type: 'Number', padding: numberLength },
    // apaa: { type: 'Array', padding: 4096, length: 8, subType: 'Buffer' }, // Max size 2048 Bytes
    apaa: { type: 'Array', padding: 2048, length: 6, subType: 'Buffer' }, // Max size 2048 Bytes
    apan: { type: 'Number', padding: numberLength },
    apap: { type: 'Buffer', padding: 16384 }, // 1 + 3 (MAX EXTRA PAGE) * 2048 Bytes
    apar: {
        type: 'Object', padding: bufferLength, length: 11,
        subFields: {
            am: { type: 'Buffer', padding: 64 },
            an: { type: 'String', padding: 64 },
            au: { type: 'String', padding: 192 }, // 96 Bytes
            c: { type: 'Buffer', padding: bufferLength },
            dc: { type: 'Number', padding: numberLength },
            df: { type: 'Boolean', padding: booleanLength },
            f: { type: 'Buffer', padding: bufferLength },
            m: { type: 'Buffer', padding: bufferLength },
            r: { type: 'Buffer', padding: bufferLength },
            t: { type: 'Number', padding: numberLength },
            un: { type: 'String', padding: 16 },
        }
    },
    // apas: { type: 'Array', padding: numberLength, length: 8, subType: 'Number' },
    apas: { type: 'Array', padding: numberLength, length: 6, subType: 'Number' },
    // apat: { type: 'Array', padding: bufferLength, length: 8, subType: 'Buffer' },
    apat: { type: 'Array', padding: bufferLength, length: 6, subType: 'Buffer' },
    apep: { type: 'Number', padding: numberLength },
    // apfa: { type: 'Array', padding: numberLength, length: 8, subType: 'Number' },
    apfa: { type: 'Array', padding: numberLength, length: 6, subType: 'Number' },
    apid: { type: 'Number', padding: numberLength },
    apls: {
        type: 'Object', padding: bufferLength, length: 2,
        subFields: {
            nbs: { type: 'Number', padding: numberLength },
            nui: { type: 'Number', padding: numberLength },
        }
    },
    apgs: {
        type: 'Object', padding: bufferLength, length: 2,
        subFields: {
            nbs: { type: 'Number', padding: numberLength },
            nui: { type: 'Number', padding: numberLength },
        }
    },
    apsu: { type: 'Buffer', padding: 16384 }, // 1 + 3 (MAX EXTRA PAGE) * 2048 Bytes
    arcv: { type: 'Buffer', padding: bufferLength },
    asnd: { type: 'Buffer', padding: bufferLength },
    caid: { type: 'Number', padding: numberLength },
    close: { type: 'Buffer', padding: bufferLength },
    fadd: { type: 'Buffer', padding: bufferLength },
    fee: { type: 'Number', padding: numberLength },
    faid: { type: 'Number', padding: numberLength },
    fv: { type: 'Number', padding: numberLength },
    gen: { type: 'String', padding: 64 },
    grp: { type: 'Buffer', padding: bufferLength },
    gh: { type: 'Buffer', padding: bufferLength },
    lv: { type: 'Number', padding: numberLength },
    lx: { type: 'Buffer', padding: bufferLength },
    nonpart: { type: 'Boolean', padding: booleanLength },
    note: { type: 'Buffer', padding: 2048 }, // 1024 Bytes
    rcv: { type: 'Buffer', padding: bufferLength },
    rekey: { type: 'Buffer', padding: bufferLength },
    selkey: { type: 'Buffer', padding: bufferLength },
    sprfkey: { type: 'Buffer', padding: 128 },
    snd: { type: 'Buffer', padding: bufferLength },
    type: { type: 'String', padding: 16 },
    votefst: { type: 'Number', padding: numberLength },
    votekd: { type: 'Number', padding: numberLength },
    votekey: { type: 'Buffer', padding: bufferLength },
    votelst: { type: 'Number', padding: numberLength },
    xaid: { type: 'Number', padding: numberLength },
}